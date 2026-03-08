import { apiFetch } from '../services/api';
import type { FilmListItem, ShowtimeEntry } from '../types/components';

/** API response shape from GET /api/v1/films */
interface FilmsApiResponse {
  data: ApiFilm[];
  meta: FilmsMeta;
}

interface ApiFilm {
  id: number;
  title: string;
  year: number | null;
  posterUrl: string | null;
  director: string | null;
  genres: string[];
  filmAge: number | null;
  rating: number | null;
  totalShowtimes: number;
  letterboxdUrl: string;
  showtimes: ApiShowtime[];
}

interface ApiShowtime {
  date: string;
  time: string;
  version: string;
  cinemaId: string;
  cinemaName: string;
  bookingUrl: string | null;
}

export interface FilmsMeta {
  weekStart: string;
  weekEnd: string;
  weekOffset: number;
  totalFilms: number;
}

export interface FilmsData {
  films: FilmListItem[];
  meta: FilmsMeta;
}

function mapShowtime(st: ApiShowtime, filmId: string): ShowtimeEntry {
  return {
    id: `${filmId}-${st.cinemaId}-${st.date}-${st.time}`,
    filmId,
    cinemaId: st.cinemaId,
    cinemaName: st.cinemaName,
    datetime: `${st.date}T${st.time}:00`,
    time: st.time,
    version: st.version as ShowtimeEntry['version'],
    bookingUrl: st.bookingUrl,
  };
}

function mapFilm(film: ApiFilm): FilmListItem {
  const id = String(film.id);
  return {
    id,
    title: film.title,
    year: film.year ?? 0,
    posterUrl: film.posterUrl,
    rating: film.rating,
    filmAge: film.filmAge,
    synopsis: null,
    director: film.director,
    cast: [],
    genres: film.genres,
    runtime: null,
    letterboxdUrl: film.letterboxdUrl,
    showtimes: film.showtimes.map((st) => mapShowtime(st, id)),
  };
}

export async function fetchFilms(weekOffset: number): Promise<FilmsData> {
  const response = await apiFetch<FilmsApiResponse>(
    `/api/v1/films?weekOffset=${weekOffset}`,
  );
  return {
    films: response.data.map(mapFilm),
    meta: response.meta,
  };
}
