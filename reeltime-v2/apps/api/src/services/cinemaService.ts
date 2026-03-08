import { prisma } from '../lib/prisma.js';
import { getShowtimes } from './cacheService.js';
import type {
  CinemaListItem,
  CinemaShowtimesResponse,
  CinemaFilmShowtimes,
} from '../types/cinemaResponses.js';

// --- Cinema list ---

export async function getAllCinemas(): Promise<CinemaListItem[]> {
  const cinemas = await prisma.cinema.findMany({
    orderBy: { name: 'asc' },
  });

  return cinemas.map((c) => ({
    id: c.id,
    allocineId: c.allocineId,
    name: c.name,
    address: c.address,
    city: c.city,
    latitude: c.latitude,
    longitude: c.longitude,
  }));
}

// --- Cinema showtimes for a specific date ---

function getTodayParis(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' });
  return formatter.format(new Date());
}

function getNowHHMMParis(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(now);
}

export async function getCinemaShowtimes(
  cinemaId: number,
  date: string,
): Promise<CinemaShowtimesResponse | null> {
  // Look up cinema by database ID
  const cinema = await prisma.cinema.findUnique({
    where: { id: cinemaId },
  });

  if (!cinema) return null;

  // Fetch showtimes from cache using allocineId
  const result = await getShowtimes(cinema.allocineId, date);

  const today = getTodayParis();
  const nowTime = getNowHHMMParis();
  const isToday = date === today;

  // Group showtimes by film
  const filmMap = new Map<number, CinemaFilmShowtimes>();

  for (const st of result.data.showtimes) {
    // Only include showtimes for this cinema
    if (st.cinemaAllocineId !== cinema.allocineId) continue;

    // Extract HH:MM from ISO startsAt
    const time = st.startsAt.substring(11, 16);

    // Filter past showtimes for today
    if (isToday && time <= nowTime) continue;

    const filmId = st.filmAllocineId;

    if (!filmMap.has(filmId)) {
      const matchingFilm = result.data.films.find((f) => f.allocineId === filmId);
      if (!matchingFilm) continue;

      filmMap.set(filmId, {
        id: matchingFilm.allocineId,
        title: matchingFilm.title,
        posterUrl: matchingFilm.posterUrl,
        year: matchingFilm.year,
        director: matchingFilm.director,
        genres: matchingFilm.genres,
        showtimes: [],
      });
    }

    filmMap.get(filmId)!.showtimes.push({
      time,
      version: st.version,
      bookingUrl: st.bookingUrl,
    });
  }

  // Sort films alphabetically by title (French locale), showtimes chronologically
  const films = Array.from(filmMap.values())
    .sort((a, b) => a.title.localeCompare(b.title, 'fr'))
    .map((f) => ({
      ...f,
      showtimes: f.showtimes.sort((a, b) => a.time.localeCompare(b.time)),
    }));

  return {
    cinema: {
      id: cinema.id,
      allocineId: cinema.allocineId,
      name: cinema.name,
      address: cinema.address,
      city: cinema.city,
      latitude: cinema.latitude,
      longitude: cinema.longitude,
    },
    date,
    films,
  };
}
