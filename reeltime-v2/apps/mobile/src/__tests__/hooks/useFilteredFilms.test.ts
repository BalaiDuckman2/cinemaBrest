import { useFiltersStore } from '../../stores/useFiltersStore';
import type { FilmListItem } from '../../types';

// Inline filter utilities (same logic as useFilteredFilms)
function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

type DayFilter = 'all' | 'weekday' | 'weekend' | '0' | '1' | '2' | '3' | '4' | '5' | '6';
type TimeSlotFilter = 'all' | 'morning' | 'afternoon' | 'evening' | 'night';

function matchesDay(datetime: string, dayFilter: DayFilter): boolean {
  if (dayFilter === 'all') return true;
  const date = new Date(datetime);
  const jsDay = date.getDay();
  const dayIndex = jsDay === 0 ? 6 : jsDay - 1;
  if (dayFilter === 'weekday') return dayIndex >= 0 && dayIndex <= 3;
  if (dayFilter === 'weekend') return dayIndex >= 4 && dayIndex <= 6;
  return dayIndex === parseInt(dayFilter);
}

function matchesTimeSlot(time: string, timeSlot: TimeSlotFilter): boolean {
  if (timeSlot === 'all') return true;
  const hourMatch = time.match(/^(\d{1,2})/);
  if (!hourMatch) return false;
  const hour = parseInt(hourMatch[1]);
  switch (timeSlot) {
    case 'morning': return hour < 12;
    case 'afternoon': return hour >= 12 && hour < 18;
    case 'evening': return hour >= 18 && hour < 22;
    case 'night': return hour >= 22;
    default: return true;
  }
}

// Reproduce the filtering logic from useFilteredFilms for testing without React
function applyFilters(
  films: FilmListItem[],
  filters: {
    searchQuery: string;
    selectedCinemas: string[];
    version: 'VO' | 'VF' | 'VOST' | null;
    dayFilter: string;
    timeSlot: string;
    minTime: string | null;
    minAge: number;
    minRating: number | null;
  },
): FilmListItem[] {
  let result = films;

  if (filters.searchQuery) {
    const normalizedQuery = normalizeText(filters.searchQuery);
    result = result.filter((film) =>
      normalizeText(film.title).includes(normalizedQuery),
    );
  }

  if (filters.selectedCinemas.length > 0) {
    result = result
      .map((film) => ({
        ...film,
        showtimes: film.showtimes.filter((st) =>
          filters.selectedCinemas.includes(st.cinemaId),
        ),
      }))
      .filter((film) => film.showtimes.length > 0);
  }

  if (filters.version) {
    result = result
      .map((film) => ({
        ...film,
        showtimes: film.showtimes.filter((st) => {
          if (filters.version === 'VO')
            return st.version === 'VO' || st.version === 'VOST';
          return st.version === filters.version;
        }),
      }))
      .filter((film) => film.showtimes.length > 0);
  }

  if (filters.dayFilter !== 'all') {
    result = result
      .map((film) => ({
        ...film,
        showtimes: film.showtimes.filter((st) =>
          matchesDay(st.datetime, filters.dayFilter as DayFilter),
        ),
      }))
      .filter((film) => film.showtimes.length > 0);
  }

  if (filters.timeSlot !== 'all') {
    result = result
      .map((film) => ({
        ...film,
        showtimes: film.showtimes.filter((st) =>
          matchesTimeSlot(st.time, filters.timeSlot as TimeSlotFilter),
        ),
      }))
      .filter((film) => film.showtimes.length > 0);
  }

  if (filters.minTime) {
    result = result
      .map((film) => ({
        ...film,
        showtimes: film.showtimes.filter((st) => st.time >= filters.minTime!),
      }))
      .filter((film) => film.showtimes.length > 0);
  }

  if (filters.minAge > 0) {
    result = result.filter((film) => (film.filmAge ?? 0) >= filters.minAge);
  }

  if (filters.minRating !== null) {
    result = result.filter((film) => (film.rating ?? 0) >= filters.minRating!);
  }

  return result;
}

function countActiveFilters(filters: {
  searchQuery: string;
  selectedCinemas: string[];
  version: 'VO' | 'VF' | 'VOST' | null;
  dayFilter: string;
  timeSlot: string;
  minAge: number;
  minTime: string | null;
  minRating: number | null;
}): number {
  return (
    (filters.searchQuery ? 1 : 0) +
    (filters.selectedCinemas.length > 0 ? 1 : 0) +
    (filters.version ? 1 : 0) +
    (filters.dayFilter !== 'all' ? 1 : 0) +
    (filters.timeSlot !== 'all' ? 1 : 0) +
    (filters.minAge > 0 ? 1 : 0) +
    (filters.minTime ? 1 : 0) +
    (filters.minRating !== null ? 1 : 0)
  );
}

// Test data factory
function createFilm(overrides: Partial<FilmListItem> = {}): FilmListItem {
  return {
    id: '1',
    title: 'Test Film',
    year: 2024,
    posterUrl: null,
    rating: 3.5,
    filmAge: 2,
    director: 'Test Director',
    genres: ['Drama'],
    letterboxdUrl: null,
    showtimes: [
      {
        id: 'st-1',
        filmId: '1',
        cinemaId: 'cinema-a',
        cinemaName: 'Cinema A',
        datetime: '2026-03-09T14:00:00', // Monday
        date: '2026-03-09',
        time: '14:00',
        version: 'VF',
        bookingUrl: null,
      },
    ],
    ...overrides,
  };
}

const defaultFilters = {
  searchQuery: '',
  selectedCinemas: [],
  version: null as 'VO' | 'VF' | 'VOST' | null,
  dayFilter: 'all',
  timeSlot: 'all',
  minTime: null as string | null,
  minAge: 0,
  minRating: null as number | null,
};

describe('useFilteredFilms logic', () => {
  describe('no filters', () => {
    it('returns all films when no filters are active', () => {
      const films = [createFilm({ id: '1' }), createFilm({ id: '2', title: 'Film 2' })];
      const result = applyFilters(films, defaultFilters);
      expect(result).toHaveLength(2);
    });
  });

  describe('search filter', () => {
    it('filters by title (case insensitive)', () => {
      const films = [
        createFilm({ id: '1', title: 'Batman Begins' }),
        createFilm({ id: '2', title: 'Spider-Man' }),
      ];
      const result = applyFilters(films, { ...defaultFilters, searchQuery: 'batman' });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Batman Begins');
    });

    it('filters with accent insensitivity', () => {
      const films = [
        createFilm({ id: '1', title: 'Amelie' }),
        createFilm({ id: '2', title: 'Les Miserables' }),
      ];
      const result = applyFilters(films, { ...defaultFilters, searchQuery: 'amelie' });
      expect(result).toHaveLength(1);

      // Search with accented query for non-accented title
      const result2 = applyFilters(films, { ...defaultFilters, searchQuery: 'Amelie' });
      expect(result2).toHaveLength(1);
    });

    it('accented film title matches unaccented query', () => {
      const films = [createFilm({ id: '1', title: 'Amelie Poulain' })];
      const result = applyFilters(films, { ...defaultFilters, searchQuery: 'amelie' });
      expect(result).toHaveLength(1);
    });
  });

  describe('cinema filter', () => {
    it('only shows showtimes from selected cinemas', () => {
      const film = createFilm({
        id: '1',
        showtimes: [
          {
            id: 'st-1', filmId: '1', cinemaId: 'cinema-a', cinemaName: 'Cinema A',
            datetime: '2026-03-09T14:00:00', date: '2026-03-09', time: '14:00', version: 'VF', bookingUrl: null,
          },
          {
            id: 'st-2', filmId: '1', cinemaId: 'cinema-b', cinemaName: 'Cinema B',
            datetime: '2026-03-09T16:00:00', date: '2026-03-09', time: '16:00', version: 'VO', bookingUrl: null,
          },
        ],
      });

      const result = applyFilters([film], {
        ...defaultFilters,
        selectedCinemas: ['cinema-a'],
      });

      expect(result).toHaveLength(1);
      expect(result[0].showtimes).toHaveLength(1);
      expect(result[0].showtimes[0].cinemaId).toBe('cinema-a');
    });

    it('removes films with no matching showtimes', () => {
      const film = createFilm({
        id: '1',
        showtimes: [
          {
            id: 'st-1', filmId: '1', cinemaId: 'cinema-a', cinemaName: 'Cinema A',
            datetime: '2026-03-09T14:00:00', date: '2026-03-09', time: '14:00', version: 'VF', bookingUrl: null,
          },
        ],
      });

      const result = applyFilters([film], {
        ...defaultFilters,
        selectedCinemas: ['cinema-b'],
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('version filter', () => {
    const filmWithVersions = createFilm({
      id: '1',
      showtimes: [
        {
          id: 'st-vf', filmId: '1', cinemaId: 'cinema-a', cinemaName: 'A',
          datetime: '2026-03-09T14:00:00', date: '2026-03-09', time: '14:00', version: 'VF', bookingUrl: null,
        },
        {
          id: 'st-vo', filmId: '1', cinemaId: 'cinema-a', cinemaName: 'A',
          datetime: '2026-03-09T16:00:00', date: '2026-03-09', time: '16:00', version: 'VO', bookingUrl: null,
        },
        {
          id: 'st-vost', filmId: '1', cinemaId: 'cinema-a', cinemaName: 'A',
          datetime: '2026-03-09T18:00:00', date: '2026-03-09', time: '18:00', version: 'VOST', bookingUrl: null,
        },
      ],
    });

    it('VO includes both VO and VOST', () => {
      const result = applyFilters([filmWithVersions], {
        ...defaultFilters,
        version: 'VO',
      });
      expect(result[0].showtimes).toHaveLength(2);
      expect(result[0].showtimes.map((s) => s.version)).toEqual(['VO', 'VOST']);
    });

    it('VF only includes VF', () => {
      const result = applyFilters([filmWithVersions], {
        ...defaultFilters,
        version: 'VF',
      });
      expect(result[0].showtimes).toHaveLength(1);
      expect(result[0].showtimes[0].version).toBe('VF');
    });

    it('VOST only includes VOST', () => {
      const result = applyFilters([filmWithVersions], {
        ...defaultFilters,
        version: 'VOST',
      });
      expect(result[0].showtimes).toHaveLength(1);
      expect(result[0].showtimes[0].version).toBe('VOST');
    });
  });

  describe('day filter', () => {
    const filmWithDays = createFilm({
      id: '1',
      showtimes: [
        {
          id: 'st-mon', filmId: '1', cinemaId: 'cinema-a', cinemaName: 'A',
          datetime: '2026-03-09T14:00:00', date: '2026-03-09', time: '14:00', version: 'VF', bookingUrl: null,
        }, // Monday
        {
          id: 'st-fri', filmId: '1', cinemaId: 'cinema-a', cinemaName: 'A',
          datetime: '2026-03-13T20:00:00', date: '2026-03-13', time: '20:00', version: 'VF', bookingUrl: null,
        }, // Friday
        {
          id: 'st-sun', filmId: '1', cinemaId: 'cinema-a', cinemaName: 'A',
          datetime: '2026-03-15T16:00:00', date: '2026-03-15', time: '16:00', version: 'VF', bookingUrl: null,
        }, // Sunday
      ],
    });

    it('"weekday" keeps Mon-Thu showtimes only', () => {
      const result = applyFilters([filmWithDays], {
        ...defaultFilters,
        dayFilter: 'weekday',
      });
      expect(result[0].showtimes).toHaveLength(1);
      expect(result[0].showtimes[0].date).toBe('2026-03-09');
    });

    it('"weekend" keeps Fri-Sun showtimes only', () => {
      const result = applyFilters([filmWithDays], {
        ...defaultFilters,
        dayFilter: 'weekend',
      });
      expect(result[0].showtimes).toHaveLength(2);
    });
  });

  describe('time slot filter', () => {
    const filmWithTimes = createFilm({
      id: '1',
      showtimes: [
        {
          id: 'st-morning', filmId: '1', cinemaId: 'a', cinemaName: 'A',
          datetime: '2026-03-09T10:00:00', date: '2026-03-09', time: '10:00', version: 'VF', bookingUrl: null,
        },
        {
          id: 'st-afternoon', filmId: '1', cinemaId: 'a', cinemaName: 'A',
          datetime: '2026-03-09T14:00:00', date: '2026-03-09', time: '14:00', version: 'VF', bookingUrl: null,
        },
        {
          id: 'st-evening', filmId: '1', cinemaId: 'a', cinemaName: 'A',
          datetime: '2026-03-09T20:00:00', date: '2026-03-09', time: '20:00', version: 'VF', bookingUrl: null,
        },
        {
          id: 'st-night', filmId: '1', cinemaId: 'a', cinemaName: 'A',
          datetime: '2026-03-09T23:00:00', date: '2026-03-09', time: '23:00', version: 'VF', bookingUrl: null,
        },
      ],
    });

    it('"morning" keeps only hour < 12', () => {
      const result = applyFilters([filmWithTimes], { ...defaultFilters, timeSlot: 'morning' });
      expect(result[0].showtimes).toHaveLength(1);
      expect(result[0].showtimes[0].time).toBe('10:00');
    });

    it('"afternoon" keeps 12-18', () => {
      const result = applyFilters([filmWithTimes], { ...defaultFilters, timeSlot: 'afternoon' });
      expect(result[0].showtimes).toHaveLength(1);
      expect(result[0].showtimes[0].time).toBe('14:00');
    });

    it('"evening" keeps 18-22', () => {
      const result = applyFilters([filmWithTimes], { ...defaultFilters, timeSlot: 'evening' });
      expect(result[0].showtimes).toHaveLength(1);
      expect(result[0].showtimes[0].time).toBe('20:00');
    });

    it('"night" keeps >= 22', () => {
      const result = applyFilters([filmWithTimes], { ...defaultFilters, timeSlot: 'night' });
      expect(result[0].showtimes).toHaveLength(1);
      expect(result[0].showtimes[0].time).toBe('23:00');
    });
  });

  describe('minTime filter', () => {
    it('only keeps showtimes >= minTime', () => {
      const film = createFilm({
        id: '1',
        showtimes: [
          {
            id: 'st-1', filmId: '1', cinemaId: 'a', cinemaName: 'A',
            datetime: '2026-03-09T10:00:00', date: '2026-03-09', time: '10:00', version: 'VF', bookingUrl: null,
          },
          {
            id: 'st-2', filmId: '1', cinemaId: 'a', cinemaName: 'A',
            datetime: '2026-03-09T14:00:00', date: '2026-03-09', time: '14:00', version: 'VF', bookingUrl: null,
          },
          {
            id: 'st-3', filmId: '1', cinemaId: 'a', cinemaName: 'A',
            datetime: '2026-03-09T18:00:00', date: '2026-03-09', time: '18:00', version: 'VF', bookingUrl: null,
          },
        ],
      });

      const result = applyFilters([film], { ...defaultFilters, minTime: '14:00' });
      expect(result[0].showtimes).toHaveLength(2);
      expect(result[0].showtimes.map((s) => s.time)).toEqual(['14:00', '18:00']);
    });
  });

  describe('minAge filter', () => {
    it('filters films by minimum age', () => {
      const films = [
        createFilm({ id: '1', title: 'New Film', filmAge: 1 }),
        createFilm({ id: '2', title: 'Classic Film', filmAge: 30 }),
        createFilm({ id: '3', title: 'Old Film', filmAge: 55 }),
      ];

      const result = applyFilters(films, { ...defaultFilters, minAge: 20 });
      expect(result).toHaveLength(2);
      expect(result.map((f) => f.title)).toEqual(['Classic Film', 'Old Film']);
    });

    it('treats null filmAge as 0', () => {
      const films = [createFilm({ id: '1', filmAge: null })];
      const result = applyFilters(films, { ...defaultFilters, minAge: 1 });
      expect(result).toHaveLength(0);
    });
  });

  describe('minRating filter', () => {
    it('filters films by minimum rating', () => {
      const films = [
        createFilm({ id: '1', title: 'Bad', rating: 2.0 }),
        createFilm({ id: '2', title: 'Good', rating: 4.0 }),
        createFilm({ id: '3', title: 'Great', rating: 4.5 }),
      ];

      const result = applyFilters(films, { ...defaultFilters, minRating: 3.5 });
      expect(result).toHaveLength(2);
      expect(result.map((f) => f.title)).toEqual(['Good', 'Great']);
    });

    it('treats null rating as 0', () => {
      const films = [createFilm({ id: '1', rating: null })];
      const result = applyFilters(films, { ...defaultFilters, minRating: 1 });
      expect(result).toHaveLength(0);
    });
  });

  describe('combined filters', () => {
    it('applies multiple filters together', () => {
      const films = [
        createFilm({
          id: '1', title: 'Batman VO', filmAge: 10, rating: 4.0,
          showtimes: [{
            id: 'st-1', filmId: '1', cinemaId: 'cinema-a', cinemaName: 'A',
            datetime: '2026-03-09T20:00:00', date: '2026-03-09', time: '20:00', version: 'VO', bookingUrl: null,
          }],
        }),
        createFilm({
          id: '2', title: 'Spider-Man VF', filmAge: 5, rating: 3.0,
          showtimes: [{
            id: 'st-2', filmId: '2', cinemaId: 'cinema-a', cinemaName: 'A',
            datetime: '2026-03-09T14:00:00', date: '2026-03-09', time: '14:00', version: 'VF', bookingUrl: null,
          }],
        }),
        createFilm({
          id: '3', title: 'Batman VF', filmAge: 20, rating: 4.5,
          showtimes: [{
            id: 'st-3', filmId: '3', cinemaId: 'cinema-b', cinemaName: 'B',
            datetime: '2026-03-09T18:00:00', date: '2026-03-09', time: '18:00', version: 'VF', bookingUrl: null,
          }],
        }),
      ];

      // Search "batman" + cinema-a + evening
      const result = applyFilters(films, {
        ...defaultFilters,
        searchQuery: 'batman',
        selectedCinemas: ['cinema-a'],
        timeSlot: 'evening',
      });

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Batman VO');
    });
  });

  describe('activeFilterCount', () => {
    it('returns 0 when no filters active', () => {
      expect(countActiveFilters(defaultFilters)).toBe(0);
    });

    it('counts each active filter', () => {
      expect(
        countActiveFilters({
          ...defaultFilters,
          searchQuery: 'test',
          version: 'VO',
          dayFilter: 'weekend',
        }),
      ).toBe(3);
    });

    it('counts all 8 filters when all active', () => {
      expect(
        countActiveFilters({
          searchQuery: 'test',
          selectedCinemas: ['cinema-a'],
          version: 'VO',
          dayFilter: 'weekend',
          timeSlot: 'evening',
          minAge: 10,
          minTime: '14:00',
          minRating: 3.0,
        }),
      ).toBe(8);
    });
  });
});
