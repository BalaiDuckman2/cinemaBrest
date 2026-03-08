import type { Version } from '@reeltime/types';

/** Film data shaped for list/card display. */
export interface FilmListItem {
  id: string;
  title: string;
  year: number;
  posterUrl: string | null;
  rating: number | null;
  filmAge: number | null;
  synopsis: string | null;
  director: string | null;
  cast: string[];
  genres: string[];
  runtime: number | null;
  letterboxdUrl: string | null;
  showtimes: ShowtimeEntry[];
}

/** Single showtime entry for chip display. */
export interface ShowtimeEntry {
  id: string;
  filmId: string;
  cinemaId: string;
  cinemaName: string;
  datetime: string;
  time: string;
  version: Version;
  bookingUrl: string | null;
}
