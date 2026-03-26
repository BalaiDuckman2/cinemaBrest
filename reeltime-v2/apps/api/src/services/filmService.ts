import { getShowtimes } from './cacheService.js';
import { CINEMAS, getCinemaByAllocineId } from '../config/cinemas.js';
import { generateLetterboxdUrl } from '../utils/letterboxd.js';
import { matchesSearch } from '../utils/searchUtils.js';
import { prisma } from '../lib/prisma.js';
import type {
  FilmListItem,
  FilmListResponse,
  FilmListMeta,
  FilmDetailResponse,
  ShowtimeEntry,
} from '../types/filmResponses.js';
import type { ParsedFilm, ParsedShowtime } from './allocineParser.js';
import type { FilmFilterInput } from '../schemas/filmSchemas.js';

// --- Date helpers (no external dependency) ---

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

function getWeekDates(weekOffset: number): { start: string; end: string; dates: string[] } {
  const now = new Date();
  const base = addDays(now, weekOffset * 7);
  // Reset to start of day
  base.setHours(0, 0, 0, 0);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(formatDate(addDays(base, i)));
  }
  return {
    start: dates[0],
    end: dates[6],
    dates,
  };
}

function getTodayStr(): string {
  // Use Paris timezone to match cinema showtimes (not UTC or server local time)
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' });
  return formatter.format(new Date());
}

function getNowHHMM(): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(new Date());
}

/** Convert a UTC Date (from Prisma) to local Paris time HH:MM string */
function dateToLocalHHMM(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(date);
}

// --- Film list aggregation ---

export async function getFilmsForWeek(weekOffset: number): Promise<FilmListResponse> {
  const { start, end, dates } = getWeekDates(weekOffset);
  const today = getTodayStr();
  const nowTime = getNowHHMM();

  // Collect all films and showtimes across all cinemas and dates
  const filmMap = new Map<string, {
    film: ParsedFilm;
    showtimes: ShowtimeEntry[];
  }>();
  // Track seen showtimes to deduplicate across cache entries
  const seenShowtimes = new Set<string>();

  for (const date of dates) {
    for (const cinema of CINEMAS) {
      const result = await getShowtimes(cinema.allocineId, date);

      for (const st of result.data.showtimes) {
        // Find the cinema config for the name
        const cinemaConfig = getCinemaByAllocineId(st.cinemaAllocineId);
        const cinemaName = cinemaConfig?.name ?? st.cinemaAllocineId;

        // Extract HH:MM from ISO startsAt
        const time = st.startsAt.substring(11, 16);

        // Filter past showtimes for today only
        if (st.date === today && time <= nowTime) {
          continue;
        }

        // Deduplicate: same film + cinema + date + time + version = same showtime
        const dedupeKey = `${st.filmAllocineId}:${st.cinemaAllocineId}:${st.date}:${time}:${st.version}`;
        if (seenShowtimes.has(dedupeKey)) continue;
        seenShowtimes.add(dedupeKey);

        const entry: ShowtimeEntry = {
          date: st.date,
          time,
          version: st.version,
          cinemaId: st.cinemaAllocineId,
          cinemaName,
          bookingUrl: st.bookingUrl,
        };

        // Find the matching film
        const matchingFilm = result.data.films.find(
          (f) => f.allocineId === st.filmAllocineId,
        );
        if (!matchingFilm) continue;

        // Group by film title (matching v1 behavior)
        const key = matchingFilm.title;
        if (!filmMap.has(key)) {
          filmMap.set(key, { film: matchingFilm, showtimes: [] });
        }
        filmMap.get(key)!.showtimes.push(entry);
      }
    }
  }

  // Build response
  const films: FilmListItem[] = [];
  for (const [, { film, showtimes }] of filmMap) {
    films.push({
      id: film.allocineId,
      title: film.title,
      year: film.year,
      posterUrl: film.posterUrl,
      director: film.director,
      genres: film.genres,
      filmAge: film.filmAge,
      rating: film.rating,
      totalShowtimes: showtimes.length,
      letterboxdUrl: generateLetterboxdUrl(film.title),
      showtimes,
    });
  }

  // Sort by rating (wantToSee) descending, matching v1 behavior
  films.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  const meta: FilmListMeta = {
    weekStart: start,
    weekEnd: end,
    weekOffset,
    totalFilms: films.length,
  };

  return { films, meta };
}

// --- Film detail ---

export async function getFilmById(id: number): Promise<FilmDetailResponse | null> {
  const film = await prisma.film.findUnique({
    where: { allocineId: id },
    include: {
      showtimes: {
        include: { cinema: true },
        orderBy: [{ date: 'asc' }, { startsAt: 'asc' }],
      },
    },
  });

  if (!film) return null;

  // Group showtimes by date -> cinema name
  const showtimesByDate: Record<string, Record<string, ShowtimeEntry[]>> = {};

  for (const st of film.showtimes) {
    if (!showtimesByDate[st.date]) {
      showtimesByDate[st.date] = {};
    }
    const cinemaName = st.cinema.name;
    if (!showtimesByDate[st.date][cinemaName]) {
      showtimesByDate[st.date][cinemaName] = [];
    }

    showtimesByDate[st.date][cinemaName].push({
      date: st.date,
      time: dateToLocalHHMM(st.startsAt),
      version: st.version,
      cinemaId: st.cinema.allocineId,
      cinemaName,
      bookingUrl: st.bookingUrl,
    });
  }

  return {
    id: film.allocineId,
    title: film.title,
    year: film.year,
    posterUrl: film.posterUrl,
    synopsis: film.synopsis,
    cast: JSON.parse(film.cast),
    director: film.director,
    genres: JSON.parse(film.genres),
    runtime: film.runtime,
    rating: film.rating,
    filmAge: film.filmAge,
    letterboxdUrl: generateLetterboxdUrl(film.title),
    showtimesByDate,
  };
}

// --- Filtered film list ---

export async function getFilmsWithFilters(
  filters: FilmFilterInput,
): Promise<FilmListResponse> {
  const result = await getFilmsForWeek(filters.weekOffset);
  let films = result.films;

  // Text search (accent/case insensitive)
  if (filters.q) {
    films = films.filter((film) => matchesSearch(film.title, filters.q!));
  }

  // Cinema filter
  if (filters.cinemaId) {
    films = films.filter((film) =>
      film.showtimes.some((st) => st.cinemaId === filters.cinemaId),
    );
    // Also sub-filter showtimes to only show the matching cinema
    films = films.map((film) => ({
      ...film,
      showtimes: film.showtimes.filter((st) => st.cinemaId === filters.cinemaId),
      totalShowtimes: film.showtimes.filter((st) => st.cinemaId === filters.cinemaId).length,
    }));
  }

  // Version filter -- sub-filter showtimes, then drop films with none left
  // For VO/VF: keep films that only have the opposite version (French films in VF = VO original)
  if (filters.version) {
    films = films
      .map((film) => {
        if (filters.version === 'VO') {
          const voShowtimes = film.showtimes.filter((st) => st.version === 'VO' || st.version === 'VOST');
          if (voShowtimes.length > 0) {
            return { ...film, showtimes: voShowtimes, totalShowtimes: voShowtimes.length };
          }
          // No VO/VOST → likely French film where VF = original language, keep all
          return film;
        }
        if (filters.version === 'VF') {
          const vfShowtimes = film.showtimes.filter((st) => st.version === 'VF');
          if (vfShowtimes.length > 0) {
            return { ...film, showtimes: vfShowtimes, totalShowtimes: vfShowtimes.length };
          }
          // No VF → likely foreign film only in VO, keep all
          return film;
        }
        // VOST or OTHER: exact match
        const filtered = film.showtimes.filter((st) => st.version === filters.version);
        return { ...film, showtimes: filtered, totalShowtimes: filtered.length };
      })
      .filter((film) => film.showtimes.length > 0);
  }

  // Minimum time filter -- sub-filter showtimes, then drop films with none left
  if (filters.minTime) {
    films = films
      .map((film) => {
        const filtered = film.showtimes.filter((st) => st.time >= filters.minTime!);
        return { ...film, showtimes: filtered, totalShowtimes: filtered.length };
      })
      .filter((film) => film.showtimes.length > 0);
  }

  // Minimum rating filter
  if (filters.minRating !== undefined) {
    films = films.filter((film) => (film.rating ?? 0) >= filters.minRating!);
  }

  return {
    films,
    meta: { ...result.meta, totalFilms: films.length },
  };
}

// --- Search across all cached films ---

export interface SearchResult {
  films: FilmListItem[];
  total: number;
  limit: number;
  offset: number;
}

export async function searchAllFilms(
  query: string,
  limit = 50,
  offset = 0,
): Promise<SearchResult> {
  // Search across all films in the database (not limited to current week)
  const dbFilms = await prisma.film.findMany({
    include: {
      showtimes: {
        include: { cinema: true },
        orderBy: [{ date: 'asc' }, { startsAt: 'asc' }],
      },
    },
  });

  const allResults: FilmListItem[] = [];

  for (const film of dbFilms) {
    if (!matchesSearch(film.title, query)) continue;

    const showtimes: ShowtimeEntry[] = film.showtimes.map((st) => ({
      date: st.date,
      time: dateToLocalHHMM(st.startsAt),
      version: st.version,
      cinemaId: st.cinema.allocineId,
      cinemaName: st.cinema.name,
      bookingUrl: st.bookingUrl,
    }));

    allResults.push({
      id: film.allocineId,
      title: film.title,
      year: film.year,
      posterUrl: film.posterUrl,
      director: film.director,
      genres: JSON.parse(film.genres),
      filmAge: film.filmAge,
      rating: film.rating,
      totalShowtimes: showtimes.length,
      letterboxdUrl: generateLetterboxdUrl(film.title),
      showtimes,
    });
  }

  // Sort by rating descending
  allResults.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  const total = allResults.length;
  const films = allResults.slice(offset, offset + limit);

  return { films, total, limit, offset };
}
