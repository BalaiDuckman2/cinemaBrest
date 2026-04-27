import NodeCache from 'node-cache';
import { prisma } from '../lib/prisma.js';
import { getShowtimesForCinema } from './allocineService.js';
import type { ParsedFilm, ParsedShowtime } from './allocineParser.js';
import {
  buildCacheKey,
  type CachedShowtimeData,
  type CachedResult,
} from '../types/cache.js';
import {
  cacheHitsTotal,
  cacheMissesTotal,
  cacheInvalidationsTotal,
  cacheEntriesL1Gauge,
} from '../plugins/prometheus.js';
import { Version as PrismaVersion } from '../generated/prisma/index.js';
import { Version } from '@reeltime/types';

const CACHE_TTL_SECONDS = 90_000; // 25 hours (covers 24h sync interval + 1h buffer)
const EMPTY_CACHE_TTL_SECONDS = 3_600; // 1 hour for empty results (AlloCiné may add data later)

// --- L1: In-memory cache (node-cache) ---

const l1Cache = new NodeCache({
  stdTTL: CACHE_TTL_SECONDS,
  checkperiod: 600,
  useClones: false,
});

function getFromL1(key: string): CachedShowtimeData | undefined {
  return l1Cache.get<CachedShowtimeData>(key);
}

function setInL1(key: string, data: CachedShowtimeData, ttl?: number): void {
  l1Cache.set(key, data, ttl ?? CACHE_TTL_SECONDS);
  cacheEntriesL1Gauge.set(l1Cache.keys().length);
}

export function invalidateL1(key: string): void {
  l1Cache.del(key);
  cacheEntriesL1Gauge.set(l1Cache.keys().length);
}

export function invalidateAllL1(): void {
  l1Cache.flushAll();
  cacheEntriesL1Gauge.set(0);
}

// --- L2: Database (Prisma) ---

async function isL2Valid(cinemaAllocineId: string, date: string): Promise<boolean> {
  const key = buildCacheKey(cinemaAllocineId, date);
  const meta = await prisma.cacheMetadata.findUnique({
    where: { cacheKey: key },
  });
  if (!meta) return false;
  return meta.expiresAt > new Date();
}

async function getFromL2(
  cinemaAllocineId: string,
  date: string,
): Promise<CachedShowtimeData | null> {
  // Look up the cinema by allocineId
  const cinema = await prisma.cinema.findUnique({
    where: { allocineId: cinemaAllocineId },
  });
  if (!cinema) return null;

  // Query showtimes with their films for this cinema+date
  const showtimes = await prisma.showtime.findMany({
    where: { cinemaId: cinema.id, date },
    include: { film: true },
  });

  if (showtimes.length === 0) {
    // Check if we explicitly cached empty results (cache_metadata exists)
    const key = buildCacheKey(cinemaAllocineId, date);
    const meta = await prisma.cacheMetadata.findUnique({
      where: { cacheKey: key },
    });
    if (meta) {
      return { films: [], showtimes: [] };
    }
    return null;
  }

  // Convert DB records back to ParsedFilm/ParsedShowtime format
  const seenFilmIds = new Set<number>();
  const films: ParsedFilm[] = [];
  const parsedShowtimes: ParsedShowtime[] = [];

  // Format startsAt as local Paris ISO-like string (not UTC) to match AlloCine format
  const parisDateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parisTimeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  for (const st of showtimes) {
    // Build film list (deduplicated)
    if (!seenFilmIds.has(st.film.allocineId)) {
      seenFilmIds.add(st.film.allocineId);
      films.push({
        allocineId: st.film.allocineId,
        title: st.film.title,
        year: st.film.year,
        posterUrl: st.film.posterUrl,
        synopsis: st.film.synopsis,
        cast: JSON.parse(st.film.cast),
        director: st.film.director,
        rating: st.film.rating,
        productionYear: st.film.productionYear,
        releaseDate: st.film.releaseDate?.toISOString() ?? null,
        runtime: st.film.runtime,
        genres: JSON.parse(st.film.genres),
        filmAge: st.film.filmAge,
      });
    }

    // Convert UTC DateTime to Paris local ISO-like string (YYYY-MM-DDTHH:MM:SS)
    // so that downstream substring(11,16) extraction gives correct local time
    const localDate = parisDateFormatter.format(st.startsAt);
    const localTime = parisTimeFormatter.format(st.startsAt);

    parsedShowtimes.push({
      filmAllocineId: st.film.allocineId,
      cinemaAllocineId,
      date: st.date,
      startsAt: `${localDate}T${localTime}`,
      version: st.version as Version,
      bookingUrl: st.bookingUrl,
    });
  }

  return { films, showtimes: parsedShowtimes };
}

function mapVersionToPrisma(version: Version): PrismaVersion {
  switch (version) {
    case Version.VF: return PrismaVersion.VF;
    case Version.VO: return PrismaVersion.VO;
    case Version.VOST: return PrismaVersion.VOST;
    default: return PrismaVersion.OTHER;
  }
}

async function setInL2(
  cinemaAllocineId: string,
  date: string,
  data: CachedShowtimeData,
  ttlSeconds: number = CACHE_TTL_SECONDS,
): Promise<void> {
  const cinema = await prisma.cinema.findUnique({
    where: { allocineId: cinemaAllocineId },
  });
  if (!cinema) {
    console.warn(`[cache] Cinema ${cinemaAllocineId} not found in database, skipping L2 store`);
    return;
  }

  // Upsert films and create showtimes
  for (const film of data.films) {
    await prisma.film.upsert({
      where: { allocineId: film.allocineId },
      update: {
        title: film.title,
        year: film.year,
        posterUrl: film.posterUrl,
        synopsis: film.synopsis,
        cast: JSON.stringify(film.cast),
        director: film.director,
        rating: film.rating,
        productionYear: film.productionYear,
        releaseDate: film.releaseDate ? new Date(film.releaseDate) : null,
        runtime: film.runtime,
        genres: JSON.stringify(film.genres),
        filmAge: film.filmAge,
      },
      create: {
        allocineId: film.allocineId,
        title: film.title,
        year: film.year,
        posterUrl: film.posterUrl,
        synopsis: film.synopsis,
        cast: JSON.stringify(film.cast),
        director: film.director,
        rating: film.rating,
        productionYear: film.productionYear,
        releaseDate: film.releaseDate ? new Date(film.releaseDate) : null,
        runtime: film.runtime,
        genres: JSON.stringify(film.genres),
        filmAge: film.filmAge,
      },
    });
  }

  // Delete existing showtimes for this cinema+date to avoid duplicates on re-fetch
  await prisma.showtime.deleteMany({
    where: { cinemaId: cinema.id, date },
  });

  // Insert new showtimes
  for (const st of data.showtimes) {
    const film = await prisma.film.findUnique({
      where: { allocineId: st.filmAllocineId },
    });
    if (!film) continue;

    try {
      await prisma.showtime.create({
        data: {
          filmId: film.id,
          cinemaId: cinema.id,
          date: st.date,
          startsAt: new Date(st.startsAt),
          version: mapVersionToPrisma(st.version),
          bookingUrl: st.bookingUrl,
        },
      });
    } catch (err: unknown) {
      // Skip duplicate showtimes (same cinema+film+startsAt)
      if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') continue;
      throw err;
    }
  }

  // Update cache metadata
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
  const key = buildCacheKey(cinemaAllocineId, date);

  await prisma.cacheMetadata.upsert({
    where: { cacheKey: key },
    update: { fetchedAt: now, expiresAt },
    create: { cacheKey: key, fetchedAt: now, expiresAt },
  });
}

// --- Main cache lookup chain ---
// Read-only: serves cache only (L1 → L2 valid → L2 stale → empty).
// NEVER calls AlloCiné synchronously — that path belongs to fetchAndCacheShowtimes(),
// invoked exclusively by the background sync (refreshService).

export async function getShowtimes(
  cinemaAllocineId: string,
  date: string,
): Promise<CachedResult> {
  const key = buildCacheKey(cinemaAllocineId, date);

  // L1: In-memory
  const l1Data = getFromL1(key);
  if (l1Data) {
    cacheHitsTotal.inc({ level: 'L1' });
    return { data: l1Data, source: 'l1', stale: false };
  }

  // L2: Database (still within TTL)
  const l2Valid = await isL2Valid(cinemaAllocineId, date);
  if (l2Valid) {
    const l2Data = await getFromL2(cinemaAllocineId, date);
    if (l2Data) {
      setInL1(key, l2Data);
      cacheHitsTotal.inc({ level: 'L2' });
      return { data: l2Data, source: 'l2', stale: false };
    }
  }

  // L2 stale: TTL expired but data is still in DB — serve it (background sync will refresh).
  cacheMissesTotal.inc({ level: 'L1' });
  const staleData = await getFromL2(cinemaAllocineId, date);
  if (staleData) {
    setInL1(key, staleData, EMPTY_CACHE_TTL_SECONDS);
    return { data: staleData, source: 'l2-stale', stale: true };
  }

  // No data at all — return empty. Background sync will populate eventually.
  return { data: { films: [], showtimes: [] }, source: 'empty', stale: true };
}

// Write path: scrapes AlloCiné and writes to L1+L2.
// Used exclusively by the background sync (refreshService.ts), never from HTTP handlers.

export async function fetchAndCacheShowtimes(
  cinemaAllocineId: string,
  date: string,
): Promise<CachedResult> {
  const key = buildCacheKey(cinemaAllocineId, date);
  const dateObj = new Date(date + 'T00:00:00');
  const freshData = await getShowtimesForCinema(cinemaAllocineId, dateObj);

  if (freshData.films.length > 0 || freshData.showtimes.length > 0) {
    try {
      await setInL2(cinemaAllocineId, date, freshData);
    } catch (err) {
      console.warn(`[cache] Failed to store in L2 for ${cinemaAllocineId}/${date}:`, err);
    }
    setInL1(key, freshData);
    return { data: freshData, source: 'allocine', stale: false };
  }

  // AlloCiné returned empty — cache with short TTL so we retry sooner.
  const emptyData: CachedShowtimeData = { films: [], showtimes: [] };
  try {
    await setInL2(cinemaAllocineId, date, emptyData, EMPTY_CACHE_TTL_SECONDS);
  } catch {
    // Ignore L2 store failures for empty data
  }
  setInL1(key, emptyData, EMPTY_CACHE_TTL_SECONDS);
  return { data: emptyData, source: 'allocine', stale: false };
}

// --- Manual invalidation ---

export async function invalidateCache(options: {
  key?: string;
  all?: boolean;
}): Promise<void> {
  if (options.all) {
    invalidateAllL1();
    await prisma.cacheMetadata.deleteMany();
    cacheInvalidationsTotal.inc();
    console.log('[cache] All cache entries invalidated');
    return;
  }

  if (options.key) {
    invalidateL1(options.key);
    await prisma.cacheMetadata.deleteMany({
      where: { cacheKey: options.key },
    });
    cacheInvalidationsTotal.inc();
    console.log(`[cache] Cache entry invalidated: ${options.key}`);
  }
}
