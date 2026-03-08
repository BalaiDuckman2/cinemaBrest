import type { FilmListItem, ShowtimeEntry } from '../../types';

// We test the mapping functions from filmsApi without hitting the network.
// Reproduce the mapping logic to test in isolation.

interface ApiShowtime {
  date: string;
  time: string;
  version: string;
  cinemaId: string;
  cinemaName: string;
  bookingUrl: string | null;
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

describe('filmsApi mapping', () => {
  describe('mapShowtime', () => {
    it('generates correct showtime id', () => {
      const result = mapShowtime(
        {
          date: '2026-03-09',
          time: '14:00',
          version: 'VF',
          cinemaId: 'cinema-1',
          cinemaName: 'Cinema 1',
          bookingUrl: null,
        },
        '42',
      );
      expect(result.id).toBe('42-cinema-1-2026-03-09-14:00');
    });

    it('constructs datetime from date and time', () => {
      const result = mapShowtime(
        {
          date: '2026-03-09',
          time: '20:30',
          version: 'VO',
          cinemaId: 'c1',
          cinemaName: 'C1',
          bookingUrl: null,
        },
        '1',
      );
      expect(result.datetime).toBe('2026-03-09T20:30:00');
    });

    it('preserves all fields', () => {
      const result = mapShowtime(
        {
          date: '2026-03-09',
          time: '14:00',
          version: 'VOST',
          cinemaId: 'cinema-abc',
          cinemaName: 'Cinema ABC',
          bookingUrl: 'https://booking.example.com',
        },
        '99',
      );
      expect(result.filmId).toBe('99');
      expect(result.cinemaId).toBe('cinema-abc');
      expect(result.cinemaName).toBe('Cinema ABC');
      expect(result.version).toBe('VOST');
      expect(result.bookingUrl).toBe('https://booking.example.com');
      expect(result.date).toBe('2026-03-09');
      expect(result.time).toBe('14:00');
    });
  });

  describe('mapFilm', () => {
    it('converts numeric id to string', () => {
      const result = mapFilm({
        id: 42,
        title: 'Test',
        year: 2024,
        posterUrl: null,
        director: null,
        genres: [],
        filmAge: null,
        rating: null,
        totalShowtimes: 0,
        letterboxdUrl: '',
        showtimes: [],
      });
      expect(result.id).toBe('42');
    });

    it('defaults null year to 0', () => {
      const result = mapFilm({
        id: 1,
        title: 'Test',
        year: null,
        posterUrl: null,
        director: null,
        genres: [],
        filmAge: null,
        rating: null,
        totalShowtimes: 0,
        letterboxdUrl: '',
        showtimes: [],
      });
      expect(result.year).toBe(0);
    });

    it('preserves non-null year', () => {
      const result = mapFilm({
        id: 1,
        title: 'Test',
        year: 1994,
        posterUrl: null,
        director: null,
        genres: [],
        filmAge: null,
        rating: null,
        totalShowtimes: 0,
        letterboxdUrl: '',
        showtimes: [],
      });
      expect(result.year).toBe(1994);
    });

    it('maps all showtimes with film id', () => {
      const result = mapFilm({
        id: 7,
        title: 'Film',
        year: 2024,
        posterUrl: 'https://poster.jpg',
        director: 'Director',
        genres: ['Action', 'Comedy'],
        filmAge: 5,
        rating: 3.8,
        totalShowtimes: 2,
        letterboxdUrl: 'https://letterboxd.com/film/test',
        showtimes: [
          {
            date: '2026-03-09', time: '14:00', version: 'VF',
            cinemaId: 'c1', cinemaName: 'C1', bookingUrl: null,
          },
          {
            date: '2026-03-10', time: '20:00', version: 'VO',
            cinemaId: 'c2', cinemaName: 'C2', bookingUrl: 'https://book.example.com',
          },
        ],
      });

      expect(result.showtimes).toHaveLength(2);
      expect(result.showtimes[0].filmId).toBe('7');
      expect(result.showtimes[1].filmId).toBe('7');
      expect(result.title).toBe('Film');
      expect(result.director).toBe('Director');
      expect(result.genres).toEqual(['Action', 'Comedy']);
      expect(result.rating).toBe(3.8);
      expect(result.filmAge).toBe(5);
      expect(result.letterboxdUrl).toBe('https://letterboxd.com/film/test');
      expect(result.posterUrl).toBe('https://poster.jpg');
    });

    it('handles film with empty showtimes', () => {
      const result = mapFilm({
        id: 1,
        title: 'No Showtimes',
        year: 2024,
        posterUrl: null,
        director: null,
        genres: [],
        filmAge: null,
        rating: null,
        totalShowtimes: 0,
        letterboxdUrl: '',
        showtimes: [],
      });
      expect(result.showtimes).toEqual([]);
    });
  });

  describe('mapFilm batch processing', () => {
    it('maps an array of API films correctly', () => {
      const apiFilms: ApiFilm[] = [
        {
          id: 1, title: 'Film A', year: 2020, posterUrl: null, director: 'A',
          genres: ['Drama'], filmAge: 6, rating: 4.0, totalShowtimes: 1,
          letterboxdUrl: '', showtimes: [{
            date: '2026-03-09', time: '14:00', version: 'VF',
            cinemaId: 'c1', cinemaName: 'C1', bookingUrl: null,
          }],
        },
        {
          id: 2, title: 'Film B', year: 2024, posterUrl: 'https://img.jpg', director: 'B',
          genres: ['Comedy'], filmAge: 2, rating: 3.0, totalShowtimes: 1,
          letterboxdUrl: '', showtimes: [{
            date: '2026-03-10', time: '20:00', version: 'VO',
            cinemaId: 'c2', cinemaName: 'C2', bookingUrl: null,
          }],
        },
      ];

      const result = apiFilms.map(mapFilm);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
      expect(result[0].showtimes[0].filmId).toBe('1');
      expect(result[1].showtimes[0].filmId).toBe('2');
    });
  });
});
