import { useMemo } from 'react';
import { useFiltersStore } from '../stores/filtersStore';
import type { FilmListItem } from '../types/components';
import type { TimeSlotFilter } from '../stores/filtersStore';

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function matchesSearch(title: string, query: string): boolean {
  return normalizeText(title).includes(normalizeText(query));
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
  const selectedDate = useFiltersStore((s) => s.selectedDate);
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
      result = result
        .map((film) => ({
          ...film,
          showtimes: film.showtimes.filter((st) => selectedCinemas.includes(st.cinemaId)),
        }))
        .filter((film) => film.showtimes.length > 0);
    }

    // Filter by version
    // For VF filter: also keep VO showtimes of films that have NO VF showtime
    // (these are French films where VO = French)
    if (version) {
      result = result
        .map((film) => {
          if (version === 'VO') {
            const voShowtimes = film.showtimes.filter((st) => st.version === 'VO' || st.version === 'VOST');
            if (voShowtimes.length > 0) {
              return { ...film, showtimes: voShowtimes };
            }
            // No VO/VOST at all → likely a French film where VF = original language, keep all
            return film;
          }
          // VF filter: keep VF, and also keep VO for films with no VF (French films)
          const vfShowtimes = film.showtimes.filter((st) => st.version === 'VF');
          if (vfShowtimes.length > 0) {
            return { ...film, showtimes: vfShowtimes };
          }
          // No VF at all → likely a French film, keep VO showtimes
          return film;
        })
        .filter((film) => film.showtimes.length > 0);
    }

    // Filter by specific date (day strip)
    if (selectedDate) {
      result = result
        .map((film) => ({
          ...film,
          showtimes: film.showtimes.filter((st) => st.datetime.slice(0, 10) === selectedDate),
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
        case 'letterboxd':
          return (b.letterboxdRating ?? -1) - (a.letterboxdRating ?? -1);
        case 'popularity':
        default:
          return (b.rating ?? 0) - (a.rating ?? 0);
      }
    });

    return result;
  }, [films, searchQuery, selectedCinemas, version, minTime, minRating, sort, selectedDate, timeSlot, minAge]);

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    (selectedCinemas.length > 0 ? 1 : 0) +
    (version ? 1 : 0) +
    (timeSlot !== 'all' ? 1 : 0) +
    (minAge > 0 ? 1 : 0) +
    (minTime ? 1 : 0) +
    (minRating !== null ? 1 : 0);

  return { filteredFilms, activeFilterCount, hasActiveFilters: activeFilterCount > 0 };
}
