import { useMemo } from 'react';
import { useFiltersStore } from '../stores/useFiltersStore';
import type { DayFilter, TimeSlotFilter } from '../stores/useFiltersStore';
import type { FilmListItem } from '../types';

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function matchesSearch(title: string, query: string): boolean {
  return normalizeText(title).includes(normalizeText(query));
}

function matchesDay(datetime: string, dayFilter: DayFilter): boolean {
  if (dayFilter === 'all') return true;
  const date = new Date(datetime);
  const jsDay = date.getDay();
  const dayIndex = jsDay === 0 ? 6 : jsDay - 1; // 0=Mon, 6=Sun

  if (dayFilter === 'weekday') return dayIndex >= 0 && dayIndex <= 3; // Mon-Thu
  if (dayFilter === 'weekend') return dayIndex >= 4 && dayIndex <= 6; // Fri-Sun
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

export function useFilteredFilms(films: FilmListItem[]) {
  const searchQuery = useFiltersStore((s) => s.searchQuery);
  const selectedCinemas = useFiltersStore((s) => s.selectedCinemas);
  const version = useFiltersStore((s) => s.version);
  const minTime = useFiltersStore((s) => s.minTime);
  const minRating = useFiltersStore((s) => s.minRating);
  const dayFilter = useFiltersStore((s) => s.dayFilter);
  const timeSlot = useFiltersStore((s) => s.timeSlot);
  const minAge = useFiltersStore((s) => s.minAge);

  const filteredFilms = useMemo(() => {
    let result = films;

    if (searchQuery) {
      result = result.filter((film) => matchesSearch(film.title, searchQuery));
    }

    if (selectedCinemas.length > 0) {
      result = result.filter((film) =>
        film.showtimes.some((st) => selectedCinemas.includes(st.cinemaId)),
      );
    }

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

    if (dayFilter !== 'all') {
      result = result
        .map((film) => ({
          ...film,
          showtimes: film.showtimes.filter((st) => matchesDay(st.datetime, dayFilter)),
        }))
        .filter((film) => film.showtimes.length > 0);
    }

    if (timeSlot !== 'all') {
      result = result
        .map((film) => ({
          ...film,
          showtimes: film.showtimes.filter((st) => matchesTimeSlot(st.time, timeSlot)),
        }))
        .filter((film) => film.showtimes.length > 0);
    }

    if (minTime) {
      result = result
        .map((film) => ({
          ...film,
          showtimes: film.showtimes.filter((st) => st.time >= minTime),
        }))
        .filter((film) => film.showtimes.length > 0);
    }

    if (minAge > 0) {
      result = result.filter((film) => (film.filmAge ?? 0) >= minAge);
    }

    if (minRating !== null) {
      result = result.filter((film) => (film.rating ?? 0) >= minRating);
    }

    return result;
  }, [films, searchQuery, selectedCinemas, version, minTime, minRating, dayFilter, timeSlot, minAge]);

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
