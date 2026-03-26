import { invalidateAllL1, getShowtimes } from './cacheService.js';
import { CINEMAS } from '../config/cinemas.js';
import { prisma } from '../lib/prisma.js';

interface SyncState {
  isSyncing: boolean;
  lastSyncAt: Date | null;
  lastSyncResult: SyncResult | null;
}

export interface SyncResult {
  duration: number;
  cinemasProcessed: number;
  cinemasErrored: number;
  totalFilms: number;
  totalShowtimes: number;
  errors: Array<{ cinema: string; error: string }>;
}

const state: SyncState = {
  isSyncing: false,
  lastSyncAt: null,
  lastSyncResult: null,
};

export function getSyncState(): Readonly<SyncState> {
  return state;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

interface Logger {
  info(obj: unknown, msg?: string): void;
  warn(obj: unknown, msg?: string): void;
  error(obj: unknown, msg?: string): void;
}

async function cleanupOldShowtimes(logger: Logger): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const cutoffDate = formatDate(cutoff);

  const { count } = await prisma.showtime.deleteMany({
    where: { date: { lt: cutoffDate } },
  });

  if (count > 0) {
    logger.info({ deleted: count, before: cutoffDate }, 'Cleaned up old showtimes');
  }

  return count;
}

export async function runFullSync(logger: Logger): Promise<SyncResult> {
  if (state.isSyncing) {
    logger.warn({ msg: 'Sync already in progress, skipping' });
    return state.lastSyncResult ?? {
      duration: 0,
      cinemasProcessed: 0,
      cinemasErrored: 0,
      totalFilms: 0,
      totalShowtimes: 0,
      errors: [],
    };
  }

  state.isSyncing = true;
  const startTime = Date.now();
  const result: SyncResult = {
    duration: 0,
    cinemasProcessed: 0,
    cinemasErrored: 0,
    totalFilms: 0,
    totalShowtimes: 0,
    errors: [],
  };

  const today = new Date();
  const totalDays = 60;

  logger.info(
    { cinemas: CINEMAS.length, days: totalDays },
    'Starting full sync',
  );

  // Invalidate L1 + L2 metadata to force fresh AlloCiné re-fetch
  invalidateAllL1();
  await prisma.cacheMetadata.deleteMany();

  for (const cinema of CINEMAS) {
    const cinemaStart = Date.now();
    let cinemaFilms = 0;
    let cinemaShowtimes = 0;

    try {
      for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
        const date = addDays(today, dayOffset);
        const dateStr = formatDate(date);

        const cached = await getShowtimes(cinema.allocineId, dateStr);
        cinemaFilms += cached.data.films.length;
        cinemaShowtimes += cached.data.showtimes.length;
      }

      result.cinemasProcessed++;
      result.totalFilms += cinemaFilms;
      result.totalShowtimes += cinemaShowtimes;

      logger.info(
        {
          cinema: cinema.name,
          films: cinemaFilms,
          showtimes: cinemaShowtimes,
          durationMs: Date.now() - cinemaStart,
        },
        'Cinema sync complete',
      );
    } catch (err) {
      result.cinemasErrored++;
      result.errors.push({
        cinema: cinema.name,
        error: String(err),
      });

      logger.error(
        { cinema: cinema.name, error: String(err) },
        'Cinema sync failed, continuing with next',
      );
    }
  }

  result.duration = Date.now() - startTime;
  state.isSyncing = false;
  state.lastSyncAt = new Date();
  state.lastSyncResult = result;

  logger.info(
    {
      durationMs: result.duration,
      cinemasProcessed: result.cinemasProcessed,
      cinemasErrored: result.cinemasErrored,
      totalFilms: result.totalFilms,
      totalShowtimes: result.totalShowtimes,
      errorsCount: result.errors.length,
    },
    'Full sync completed',
  );

  // Clean up showtimes older than 7 days
  await cleanupOldShowtimes(logger).catch((err) => {
    logger.error({ error: String(err) }, 'Showtime cleanup failed after sync');
  });

  return result;
}
