import { useDeferredValue, useMemo } from 'react';
import { useFiltersStore } from '../stores/filtersStore';
import { localISODate, nowHHMM } from '../utils/dates';
import { computeTimeBounds, isInTimeRange, type TimeRange } from '../utils/timeRange';
import { cinemaIdsForCity } from '../utils/cinemaFilter';
import type { FilmListItem } from '../types/components';

interface Cinema {
  id: string;
  name: string;
  city: string;
}

export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function matchesSearch(title: string, query: string): boolean {
  return normalizeText(title).includes(normalizeText(query));
}

export function useFilteredFilms(films: FilmListItem[], cinemas: Cinema[]) {
  const searchQuery = useFiltersStore((s) => s.searchQuery);
  const selectedCinemas = useFiltersStore((s) => s.selectedCinemas);
  const selectedCity = useFiltersStore((s) => s.selectedCity);
  const version = useFiltersStore((s) => s.version);
  const minRating = useFiltersStore((s) => s.minRating);
  const sort = useFiltersStore((s) => s.sort);
  const selectedDate = useFiltersStore((s) => s.selectedDate);
  const timeRange = useFiltersStore((s) => s.timeRange);
  const minAge = useFiltersStore((s) => s.minAge);
  const ceSoirMode = useFiltersStore((s) => s.ceSoirMode);

  // Le filtrage remappe et retrie tout le catalogue. Le différer garde la
  // saisie fluide : React recalcule en tâche de fond sans bloquer la frappe.
  const deferredQuery = useDeferredValue(searchQuery);

  const memo = useMemo(() => {
    let result = films;

    // Search by title
    if (deferredQuery) {
      result = result.filter((film) => matchesSearch(film.title, deferredQuery));
    }

    // Ville et puces sont deux niveaux du même filtre : les puces cochées
    // priment, sinon la ville sélectionnée fournit la liste des cinémas.
    const effectiveCinemaIds =
      selectedCinemas.length > 0 ? selectedCinemas : cinemaIdsForCity(cinemas, selectedCity);

    if (effectiveCinemaIds) {
      result = result
        .map((film) => ({
          ...film,
          showtimes: film.showtimes.filter((st) => effectiveCinemaIds.includes(st.cinemaId)),
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

    // Âge et note portent sur le film entier, pas sur ses séances : les appliquer
    // avant le découpage horaire ne change pas le résultat, mais garantit que les
    // bornes du slider sont calculées sur les films réellement affichés.
    if (minAge > 0) {
      result = result.filter((film) => (film.filmAge ?? 0) >= minAge);
    }

    if (minRating !== null) {
      result = result.filter((film) => (film.rating ?? 0) >= minRating);
    }

    let bounds: TimeRange | null = null;

    if (ceSoirMode) {
      // "Ce soir" overlay: today only, from max(18:00, now). Remplace selectedDate
      // et le filtre horaire, qui est alors ignoré.
      const today = localISODate();
      const now = nowHHMM();
      const minStart = now > '18:00' ? now : '18:00';
      result = result
        .map((film) => ({
          ...film,
          showtimes: film.showtimes.filter(
            (st) => st.datetime.slice(0, 10) === today && st.time >= minStart,
          ),
        }))
        .filter((film) => film.showtimes.length > 0);
    } else {
      // Filter by specific date (day strip)
      if (selectedDate) {
        result = result
          .map((film) => ({
            ...film,
            showtimes: film.showtimes.filter((st) => st.datetime.slice(0, 10) === selectedDate),
          }))
          .filter((film) => film.showtimes.length > 0);
      }

      // Bornes calculées avant d'appliquer la plage : sinon le filtre
      // rétrécirait ses propres bornes à chaque rendu.
      bounds = computeTimeBounds(result);

      if (timeRange) {
        result = result
          .map((film) => ({
            ...film,
            showtimes: film.showtimes.filter((st) => isInTimeRange(st.time, timeRange)),
          }))
          .filter((film) => film.showtimes.length > 0);
      }
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

    return { films: result, timeBounds: bounds };
  }, [films, cinemas, deferredQuery, selectedCinemas, selectedCity, version, minRating, sort, selectedDate, timeRange, minAge, ceSoirMode]);

  const { films: filteredFilms, timeBounds } = memo;

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    (selectedCinemas.length > 0 ? 1 : 0) +
    (selectedCity !== null ? 1 : 0) +
    (version ? 1 : 0) +
    (ceSoirMode ? 1 : 0) +
    (!ceSoirMode && timeRange !== null ? 1 : 0) +
    (minAge > 0 ? 1 : 0) +
    (minRating !== null ? 1 : 0);

  return { filteredFilms, activeFilterCount, hasActiveFilters: activeFilterCount > 0, timeBounds };
}
