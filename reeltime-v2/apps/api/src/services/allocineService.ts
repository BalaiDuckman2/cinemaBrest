import { RateLimiter } from '../utils/rateLimiter.js';
import { withRetry, FetchError } from '../utils/retry.js';
import {
  parseAllocineResponse,
  hasMorePages,
  isEmptyResponse,
  type ParsedFilm,
  type ParsedShowtime,
} from './allocineParser.js';
import { CINEMAS } from '../config/cinemas.js';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const FETCH_TIMEOUT_MS = 10_000;

const rateLimiter = new RateLimiter(200);

// --- Internal fetch with rate limiting ---

async function fetchAllocinePage(
  cinemaAllocineId: string,
  date: string,
  page: number,
): Promise<unknown> {
  await rateLimiter.acquire();

  const url = `https://www.allocine.fr/_/showtimes/theater-${cinemaAllocineId}/d-${date}/p-${page}/`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new FetchError(
        `AlloCine HTTP ${response.status} for ${cinemaAllocineId} on ${date}`,
        response.status,
      );
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

// --- Fetch all pages for a cinema/date ---

async function fetchAllPages(
  cinemaAllocineId: string,
  date: string,
): Promise<{ films: ParsedFilm[]; showtimes: ParsedShowtime[] }> {
  const allFilms: ParsedFilm[] = [];
  const allShowtimes: ParsedShowtime[] = [];
  const seenFilmIds = new Set<number>();
  let page = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const raw = await withRetry(
      () => fetchAllocinePage(cinemaAllocineId, date, page),
      { maxAttempts: 3, baseDelayMs: 200, backoffMultiplier: 2 },
    );

    if (raw === null) {
      console.warn(
        `[allocine] Failed to fetch page ${page} for ${cinemaAllocineId} on ${date} after retries`,
      );
      break;
    }

    if (isEmptyResponse(raw)) {
      break;
    }

    const { films, showtimes } = parseAllocineResponse(raw, cinemaAllocineId);

    for (const film of films) {
      if (!seenFilmIds.has(film.allocineId)) {
        seenFilmIds.add(film.allocineId);
        allFilms.push(film);
      }
    }
    allShowtimes.push(...showtimes);

    const { hasMore } = hasMorePages(raw);
    if (!hasMore) break;
    page++;
  }

  return { films: allFilms, showtimes: allShowtimes };
}

// --- Public API ---

export async function getShowtimesForCinema(
  cinemaAllocineId: string,
  date: Date,
): Promise<{ films: ParsedFilm[]; showtimes: ParsedShowtime[] }> {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const dateStr = `${y}-${m}-${d}`; // YYYY-MM-DD (local time, not UTC)
  console.log(`[allocine] Fetching showtimes for ${cinemaAllocineId} on ${dateStr}`);

  try {
    return await fetchAllPages(cinemaAllocineId, dateStr);
  } catch (err) {
    console.error(`[allocine] Unexpected error for ${cinemaAllocineId} on ${dateStr}:`, err);
    return { films: [], showtimes: [] };
  }
}

export async function getShowtimesForAllCinemas(
  date: Date,
): Promise<Map<string, { films: ParsedFilm[]; showtimes: ParsedShowtime[] }>> {
  const results = new Map<string, { films: ParsedFilm[]; showtimes: ParsedShowtime[] }>();

  // Sequential to respect rate limiting
  for (const cinema of CINEMAS) {
    const data = await getShowtimesForCinema(cinema.allocineId, date);
    results.set(cinema.allocineId, data);
  }

  return results;
}
