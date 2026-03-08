import { apiClient } from '../services/api';
import type { FilmListItem, ShowtimeEntry, FilmsMeta } from '../types';

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
    date: st.date,
    time: st.time,
    version: st.version,
    bookingUrl: st.bookingUrl,
  };
}

/** Convert API film (numeric id) to client model (string id) */
function mapFilm(film: ApiFilm): FilmListItem {
  const id = String(film.id);
  return {
    id,
    title: film.title,
    year: film.year ?? 0,
    posterUrl: film.posterUrl,
    rating: film.rating,
    filmAge: film.filmAge,
    director: film.director,
    genres: film.genres,
    letterboxdUrl: film.letterboxdUrl,
    showtimes: film.showtimes.map((st) => mapShowtime(st, id)),
  };
}

export async function fetchFilms(weekOffset: number): Promise<FilmsData> {
  const response = await apiClient<FilmsApiResponse>(
    `/api/v1/films?weekOffset=${weekOffset}`,
  );
  return {
    films: response.data.map(mapFilm),
    meta: response.meta,
  };
}

interface ApiFilmDetail {
  id: number;
  title: string;
  year: number | null;
  posterUrl: string | null;
  synopsis: string | null;
  cast: string[];
  director: string | null;
  genres: string[];
  runtime: number | null;
  rating: number | null;
  filmAge: number | null;
  letterboxdUrl: string;
  showtimesByDate: Record<string, Record<string, ApiShowtime[]>>;
}

interface FilmDetailResponse {
  data: ApiFilmDetail;
}

/** Fetch a single film by its numeric id and map to client model */
export async function fetchFilmDetail(filmId: string): Promise<FilmListItem> {
  const response = await apiClient<FilmDetailResponse>(`/api/v1/films/${filmId}`);
  const film = response.data;
  const id = String(film.id);

  // Flatten showtimesByDate into a flat ShowtimeEntry array
  const showtimes: ShowtimeEntry[] = [];
  for (const [date, cinemaMap] of Object.entries(film.showtimesByDate)) {
    for (const entries of Object.values(cinemaMap)) {
      for (const st of entries) {
        showtimes.push({
          id: `${id}-${st.cinemaId}-${date}-${st.time}`,
          filmId: id,
          cinemaId: st.cinemaId,
          cinemaName: st.cinemaName,
          datetime: `${date}T${st.time}:00`,
          date,
          time: st.time,
          version: st.version,
          bookingUrl: st.bookingUrl,
        });
      }
    }
  }

  return {
    id,
    title: film.title,
    year: film.year ?? 0,
    posterUrl: film.posterUrl,
    rating: film.rating,
    filmAge: film.filmAge,
    director: film.director,
    genres: film.genres,
    letterboxdUrl: film.letterboxdUrl,
    showtimes,
  };
}
