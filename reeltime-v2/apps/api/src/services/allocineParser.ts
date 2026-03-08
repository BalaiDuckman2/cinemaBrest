import { Version } from '@reeltime/types';

// --- Raw AlloCine response types ---

interface RawAllocineResponse {
  message: string;
  error: unknown;
  pagination: { page: number; totalPages: number };
  results: RawResult[];
}

interface RawResult {
  movie: RawMovie | null;
  showtimes: Record<string, RawShowtime[]>;
}

interface RawMovie {
  internalId: number;
  title: string;
  runtime: number | string | null;
  synopsis: string | null;
  poster: { url: string } | null;
  genres: Array<{ translate: string }>;
  cast: { edges: Array<{ node: { actor: { firstName: string | null; lastName: string | null } } }> } | null;
  credits: Array<{ person: { firstName: string | null; lastName: string | null } }> | null;
  stats: { wantToSeeCount: number } | null;
  productionYear: number | null;
  releases: Array<{ releaseDate: { date: string } | null }> | null;
}

interface RawShowtime {
  startsAt: string;
  diffusionVersion: string;
  service: Array<{ name: string; url?: string }> | null;
}

// --- Parsed output types ---

export interface ParsedFilm {
  allocineId: number;
  title: string;
  year: number | null;
  posterUrl: string | null;
  synopsis: string | null;
  cast: string[];
  director: string | null;
  rating: number | null;
  productionYear: number | null;
  releaseDate: string | null;
  runtime: number | null;
  genres: string[];
  filmAge: number | null;
}

export interface ParsedShowtime {
  filmAllocineId: number;
  cinemaAllocineId: string;
  date: string; // YYYY-MM-DD
  startsAt: string; // ISO 8601
  version: Version;
  bookingUrl: string | null;
}

// --- Runtime parsing ---

function parseRuntime(raw: number | string | null | undefined): number | null {
  if (raw == null) return null;
  if (typeof raw === 'number') return raw;
  // Parse strings like "1h 54min", "2h", "45min"
  const hours = raw.match(/(\d+)\s*h/);
  const minutes = raw.match(/(\d+)\s*min/);
  const totalMinutes = (hours ? parseInt(hours[1], 10) * 60 : 0) + (minutes ? parseInt(minutes[1], 10) : 0);
  return totalMinutes > 0 ? totalMinutes : null;
}

// --- Version mapping (from v1 app.py) ---

const VERSION_MAP: Record<string, Version> = {
  DUBBED: Version.VF,
  ORIGINAL: Version.VO,
  LOCAL_LANGUAGE: Version.VF,
  LOCAL: Version.VF,
};

function mapVersion(raw: string | null | undefined): Version {
  if (!raw) return Version.VF;
  const normalized = raw.toUpperCase();
  return VERSION_MAP[normalized] ?? Version.VF;
}

// --- Film year calculation (from v1 modules/api.py lines 76-114) ---

function computeFilmYear(movie: RawMovie): {
  year: number | null;
  productionYear: number | null;
  filmAge: number | null;
  releaseDate: string | null;
} {
  const currentYear = new Date().getFullYear();
  const foundYears: number[] = [];
  let releaseDate: string | null = null;

  // Source 1: productionYear
  if (movie.productionYear) {
    const yr = movie.productionYear;
    if (yr >= 1880 && yr <= currentYear + 2) {
      foundYears.push(yr);
    }
  }

  // Source 2: all releases
  if (movie.releases) {
    for (const release of movie.releases) {
      if (release?.releaseDate?.date) {
        try {
          const d = new Date(release.releaseDate.date);
          const yr = d.getFullYear();
          if (yr >= 1880 && yr <= currentYear + 2) {
            foundYears.push(yr);
            // Keep the earliest release date
            if (!releaseDate || release.releaseDate.date < releaseDate) {
              releaseDate = release.releaseDate.date;
            }
          }
        } catch {
          // Invalid date, skip
        }
      }
    }
  }

  if (foundYears.length === 0) {
    return {
      year: currentYear,
      productionYear: movie.productionYear ?? currentYear,
      filmAge: 0,
      releaseDate,
    };
  }

  const minYear = Math.min(...foundYears);
  return {
    year: minYear,
    productionYear: movie.productionYear ?? minYear,
    filmAge: currentYear - minYear,
    releaseDate,
  };
}

// --- Cast parsing ---

function parseCast(movie: RawMovie): string[] {
  const cast: string[] = [];
  try {
    const edges = movie.cast?.edges ?? [];
    for (const edge of edges) {
      if (!edge?.node?.actor) continue;
      const actor = edge.node.actor;
      const firstName = actor.firstName ?? '';
      const lastName = actor.lastName ?? '';
      const name = `${firstName} ${lastName}`.trim();
      if (name) cast.push(name);
    }
  } catch {
    // Parsing error, return empty cast
  }
  return cast;
}

// --- Director parsing ---

function parseDirector(movie: RawMovie): string | null {
  try {
    const credits = movie.credits;
    if (!credits || credits.length === 0) return null;
    const person = credits[0]?.person;
    if (!person) return null;
    const firstName = person.firstName ?? '';
    const lastName = person.lastName ?? '';
    const name = `${firstName} ${lastName}`.trim();
    return name || null;
  } catch {
    return null;
  }
}

// --- Booking URL extraction ---

function extractBookingUrl(services: RawShowtime['service']): string | null {
  if (!services) return null;
  for (const service of services) {
    if (service.url) return service.url;
  }
  return null;
}

// --- Main parser ---

export function parseAllocineResponse(
  raw: unknown,
  cinemaAllocineId: string,
): { films: ParsedFilm[]; showtimes: ParsedShowtime[] } {
  const films: ParsedFilm[] = [];
  const showtimes: ParsedShowtime[] = [];
  const seenFilmIds = new Set<number>();

  const data = raw as RawAllocineResponse;

  if (!data?.results || !Array.isArray(data.results)) {
    return { films, showtimes };
  }

  for (const result of data.results) {
    if (!result?.movie) {
      console.warn('[parser] Skipping result with missing movie data');
      continue;
    }

    const movie = result.movie;
    const allocineId = movie.internalId;

    if (!allocineId) {
      console.warn('[parser] Skipping movie with no internalId');
      continue;
    }

    // Parse the film (deduplicate across results)
    if (!seenFilmIds.has(allocineId)) {
      seenFilmIds.add(allocineId);

      const { year, productionYear, filmAge, releaseDate } = computeFilmYear(movie);

      films.push({
        allocineId,
        title: movie.title || 'Film sans titre',
        year,
        posterUrl: movie.poster?.url ?? null,
        synopsis: movie.synopsis ?? null,
        cast: parseCast(movie),
        director: parseDirector(movie),
        rating: movie.stats?.wantToSeeCount ?? null,
        productionYear,
        releaseDate,
        runtime: parseRuntime(movie.runtime),
        genres: (movie.genres ?? []).map((g) => g.translate).filter(Boolean),
        filmAge,
      });
    }

    // Parse showtimes from all version keys
    const showtimeMap = result.showtimes ?? {};
    for (const key of Object.keys(showtimeMap)) {
      const entries = showtimeMap[key] ?? [];
      for (const entry of entries) {
        if (!entry?.startsAt) {
          console.warn(`[parser] Skipping showtime with no startsAt for film ${allocineId}`);
          continue;
        }

        const startsAt = entry.startsAt;
        // Extract YYYY-MM-DD from ISO string
        const date = startsAt.substring(0, 10);

        showtimes.push({
          filmAllocineId: allocineId,
          cinemaAllocineId,
          date,
          startsAt,
          version: mapVersion(entry.diffusionVersion),
          bookingUrl: extractBookingUrl(entry.service),
        });
      }
    }
  }

  return { films, showtimes };
}

// --- Pagination check ---

export function hasMorePages(raw: unknown): { hasMore: boolean; currentPage: number; totalPages: number } {
  const data = raw as RawAllocineResponse;
  if (!data?.pagination) {
    return { hasMore: false, currentPage: 1, totalPages: 1 };
  }
  const currentPage = Number(data.pagination.page) || 1;
  const totalPages = Number(data.pagination.totalPages) || 1;
  return { hasMore: currentPage < totalPages, currentPage, totalPages };
}

// --- Response message check ---

export function isEmptyResponse(raw: unknown): boolean {
  const data = raw as RawAllocineResponse;
  if (!data?.results || data.results.length === 0) return true;
  if (data.message === 'no.showtime.error' || data.message === 'next.showtime.on') return true;
  return false;
}
