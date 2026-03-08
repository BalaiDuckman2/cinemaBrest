import { useMemo } from 'react';
import { useFiltersStore } from '../stores/filtersStore';
import type { FilmListItem } from '../types/components';
import type { DayFilter, TimeSlotFilter } from '../stores/filtersStore';

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function matchesSearch(title: string, query: string): boolean {
  return normalizeText(title).includes(normalizeText(query));
}

/** Check if a showtime's datetime matches the day filter */
function matchesDay(datetime: string, dayFilter: DayFilter): boolean {
  if (dayFilter === 'all') return true;
  const date = new Date(datetime);
  // getDay(): 0=Sunday, we need Monday=0 to match old site's convention
  const jsDay = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const dayIndex = jsDay === 0 ? 6 : jsDay - 1; // 0=Mon, 1=Tue, ..., 6=Sun

  if (dayFilter === 'weekday') return dayIndex >= 0 && dayIndex <= 3; // Mon-Thu
  if (dayFilter === 'weekend') return dayIndex >= 4 && dayIndex <= 6; // Fri-Sun
  return dayIndex === parseInt(dayFilter);
}

/** Check if a showtime's time matches the time slot filter */
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

export function useFilteredFilms(films: FilmListItem[]) {
  const searchQuery = useFiltersStore((s) => s.searchQuery);
  const selectedCinemas = useFiltersStore((s) => s.selectedCinemas);
  const version = useFiltersStore((s) => s.version);
  const minTime = useFiltersStore((s) => s.minTime);
  const minRating = useFiltersStore((s) => s.minRating);
  const sort = useFiltersStore((s) => s.sort);
  const dayFilter = useFiltersStore((s) => s.dayFilter);
  const timeSlot = useFiltersStore((s) => s.timeSlot);
  const minAge = useFiltersStore((s) => s.minAge);

  const filteredFilms = useMemo(() => {
    let result = films;

    // Search by title
    if (searchQuery) {
      result = result.filter((film) => matchesSearch(film.title, searchQuery));
    }

    // Filter by cinema (empty = all cinemas)
    if (selectedCinemas.length > 0) {
      result = result.filter((film) =>
        film.showtimes.some((st) => selectedCinemas.includes(st.cinemaId)),
      );
    }

    // Filter by version
    if (version) {
      result = result
        .map((film) => ({
          ...film,
          showtimes: film.showtimes.filter((st) => {
            if (version === 'VO') return st.version === 'VO' || st.version === 'VOST';
            return st.version === version;
          }),
        }))
        .filter((film) => film.showtimes.length > 0);
    }

    // Filter by day
    if (dayFilter !== 'all') {
      result = result
        .map((film) => ({
          ...film,
          showtimes: film.showtimes.filter((st) => matchesDay(st.datetime, dayFilter)),
        }))
        .filter((film) => film.showtimes.length > 0);
    }

    // Filter by time slot
    if (timeSlot !== 'all') {
      result = result
        .map((film) => ({
          ...film,
          showtimes: film.showtimes.filter((st) => matchesTimeSlot(st.time, timeSlot)),
        }))
        .filter((film) => film.showtimes.length > 0);
    }

    // Filter by minimum time (kept for backward compatibility)
    if (minTime) {
      result = result
        .map((film) => ({
          ...film,
          showtimes: film.showtimes.filter((st) => st.time >= minTime),
        }))
        .filter((film) => film.showtimes.length > 0);
    }

    // Filter by minimum film age
    if (minAge > 0) {
      result = result.filter((film) => (film.filmAge ?? 0) >= minAge);
    }

    // Filter by minimum rating
    if (minRating !== null) {
      result = result.filter((film) => (film.rating ?? 0) >= minRating);
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'year-desc':
          return (b.year ?? 0) - (a.year ?? 0);
        case 'year-asc':
          return (a.year ?? 0) - (b.year ?? 0);
        case 'showtimes':
          return b.showtimes.length - a.showtimes.length;
        case 'popularity':
        default:
          return (b.rating ?? 0) - (a.rating ?? 0);
      }
    });

    return result;
  }, [films, searchQuery, selectedCinemas, version, minTime, minRating, sort, dayFilter, timeSlot, minAge]);

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    (selectedCinemas.length > 0 ? 1 : 0) +
    (version ? 1 : 0) +
    (dayFilter !== 'all' ? 1 : 0) +
    (timeSlot !== 'all' ? 1 : 0) +
    (minAge > 0 ? 1 : 0) +
    (minTime ? 1 : 0) +
    (minRating !== null ? 1 : 0);

  return { filteredFilms, activeFilterCount, hasActiveFilters: activeFilterCount > 0 };
}
