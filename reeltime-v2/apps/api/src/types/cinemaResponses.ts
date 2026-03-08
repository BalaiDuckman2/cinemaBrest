export interface CinemaListItem {
  id: number;
  allocineId: string;
  name: string;
  address: string | null;
  city: string;
  latitude: number | null;
  longitude: number | null;
}

export interface CinemaFilmShowtime {
  time: string;       // HH:MM
  version: string;    // VF, VO, VOST
  bookingUrl: string | null;
}

export interface CinemaFilmShowtimes {
  id: number;
  title: string;
  posterUrl: string | null;
  year: number | null;
  director: string | null;
  genres: string[];
  showtimes: CinemaFilmShowtime[];
}

export interface CinemaShowtimesResponse {
  cinema: CinemaListItem;
  date: string;  // YYYY-MM-DD
  films: CinemaFilmShowtimes[];
}
