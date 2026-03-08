export interface FilmListItem {
  id: string;
  title: string;
  year: number;
  posterUrl: string | null;
  rating: number | null;
  filmAge: number | null;
  director: string | null;
  genres: string[];
  letterboxdUrl: string | null;
  showtimes: ShowtimeEntry[];
}

export interface ShowtimeEntry {
  id: string;
  filmId: string;
  cinemaId: string;
  cinemaName: string;
  datetime: string;
  date: string;
  time: string;
  version: string;
  bookingUrl: string | null;
}

export interface FilmsMeta {
  weekStart: string;
  weekEnd: string;
  weekOffset: number;
  totalFilms: number;
}
