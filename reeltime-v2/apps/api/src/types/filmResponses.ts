export interface ShowtimeEntry {
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM
  version: string;    // VF, VO, VOST
  cinemaId: string;   // allocineId
  cinemaName: string;
  bookingUrl: string | null;
}

export interface FilmListItem {
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
  showtimes: ShowtimeEntry[];
}

export interface FilmListMeta {
  weekStart: string;
  weekEnd: string;
  weekOffset: number;
  totalFilms: number;
}

export interface FilmListResponse {
  films: FilmListItem[];
  meta: FilmListMeta;
}

export interface FilmDetailResponse {
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
  showtimesByDate: Record<string, Record<string, ShowtimeEntry[]>>;
}
