import { toMinutes, type ChainCandidate } from './chaining';
import type { ShowtimeEntry } from '../types/components';

export type VersionFilter = 'all' | 'VF' | 'VO';

export const SOIREE_VERSION_OPTIONS: { value: VersionFilter; label: string }[] = [
  { value: 'all', label: 'Toutes versions' },
  { value: 'VF', label: 'VF' },
  { value: 'VO', label: 'VO/VOST' },
];

export type CandidateSort = 'chain' | 'time' | 'rating' | 'cinema';

export const CANDIDATE_SORT_OPTIONS: { value: CandidateSort; label: string }[] = [
  // Nommé d'après ce qu'il fait : même cinéma d'abord, puis le moins de temps mort.
  { value: 'chain', label: 'Meilleur enchaînement' },
  { value: 'time', label: 'Heure de début' },
  { value: 'rating', label: 'Note Letterboxd' },
  { value: 'cinema', label: 'Cinéma' },
];

/** `VO` englobe les séances sous-titrées, comme le filtre de l'affiche. */
export function matchesVersion(version: ShowtimeEntry['version'], filter: VersionFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'VF') return version === 'VF';
  return version === 'VO' || version === 'VOST';
}

/** Aucune salle cochée signifie « toutes », jamais « aucune ». */
export function matchesCinemas(cinemaId: string, selected: string[]): boolean {
  return selected.length === 0 || selected.includes(cinemaId);
}

export interface CandidateFilters {
  version: VersionFilter;
  cinemas: string[];
  /** Ne garder que les séances jouées dans la salle du film d'ancrage. */
  sameCinemaOnly: boolean;
}

export function filterCandidates(
  candidates: ChainCandidate[],
  filters: CandidateFilters,
): ChainCandidate[] {
  return candidates.filter((c) => {
    if (!matchesVersion(c.showtime.version, filters.version)) return false;
    if (!matchesCinemas(c.showtime.cinemaId, filters.cinemas)) return false;
    if (filters.sameCinemaOnly && !c.sameCinema) return false;
    return true;
  });
}

export function sortCandidates(
  candidates: ChainCandidate[],
  sort: CandidateSort,
): ChainCandidate[] {
  // `findChainable` classe déjà même-cinéma d'abord puis par temps mort.
  if (sort === 'chain') return candidates;
  const sorted = [...candidates];
  if (sort === 'time') {
    sorted.sort((a, b) => toMinutes(a.showtime.time) - toMinutes(b.showtime.time));
  } else if (sort === 'rating') {
    sorted.sort((a, b) => (b.film.letterboxdRating ?? -1) - (a.film.letterboxdRating ?? -1));
  } else {
    sorted.sort((a, b) => {
      const byCinema = a.showtime.cinemaName.localeCompare(b.showtime.cinemaName, 'fr');
      return byCinema !== 0 ? byCinema : toMinutes(a.showtime.time) - toMinutes(b.showtime.time);
    });
  }
  return sorted;
}
