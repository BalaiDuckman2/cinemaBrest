import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TimeRange } from '../utils/timeRange';

export type SortOption = 'popularity' | 'alphabetical' | 'year-desc' | 'year-asc' | 'showtimes' | 'letterboxd';
export type MinAgeFilter = 0 | 1 | 5 | 10 | 20 | 30 | 50;
export type ViewMode = 'grid' | 'planning';

/** Tri appliqué par défaut partout : la note Letterboxd fait remonter les bons films. */
export const DEFAULT_SORT: SortOption = 'letterboxd';

interface FiltersState {
  searchQuery: string;
  selectedCinemas: string[];
  selectedCity: string | null;
  version: 'VO' | 'VF' | 'VOST' | null;
  minRating: number | null;
  sort: SortOption;
  /** Specific date (YYYY-MM-DD) selected in the day strip; null = whole week. Transient. */
  selectedDate: string | null;
  /** Plage horaire choisie au slider ; null = plage complète, aucun filtre. Transitoire. */
  timeRange: TimeRange | null;
  minAge: MinAgeFilter;
  viewMode: ViewMode;
  /** Mode « Ce soir » : overlay transitoire (aujourd'hui, séances >= max(18h, maintenant)). Jamais persisté. */
  ceSoirMode: boolean;
  setSearchQuery: (q: string) => void;
  toggleCinema: (cinemaId: string) => void;
  setSelectedCinemas: (ids: string[]) => void;
  setCity: (city: string | null) => void;
  setVersion: (v: 'VO' | 'VF' | 'VOST' | null) => void;
  setMinRating: (r: number | null) => void;
  setSort: (s: SortOption) => void;
  setSelectedDate: (d: string | null) => void;
  setTimeRange: (r: TimeRange | null) => void;
  setMinAge: (a: MinAgeFilter) => void;
  setViewMode: (m: ViewMode) => void;
  setCeSoirMode: (v: boolean) => void;
  resetAll: () => void;
}

/** Sous-ensemble réellement écrit dans le localStorage (cf. `partialize`). */
type PersistedFilters = Pick<
  FiltersState,
  'selectedCinemas' | 'selectedCity' | 'version' | 'minRating' | 'sort' | 'minAge' | 'viewMode'
>;

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      searchQuery: '',
      selectedCinemas: [],
      selectedCity: null,
      version: null,
      minRating: null,
      sort: DEFAULT_SORT,
      selectedDate: null,
      timeRange: null,
      minAge: 0,
      viewMode: 'grid',
      ceSoirMode: false,
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      toggleCinema: (cinemaId) =>
        set((state) => ({
          selectedCinemas: state.selectedCinemas.includes(cinemaId)
            ? state.selectedCinemas.filter((id) => id !== cinemaId)
            : [...state.selectedCinemas, cinemaId],
        })),
      setSelectedCinemas: (selectedCinemas) => set({ selectedCinemas }),
      setCity: (selectedCity) => set({ selectedCity }),
      setVersion: (version) => set({ version }),
      setMinRating: (minRating) => set({ minRating }),
      setSort: (sort) => set({ sort }),
      setSelectedDate: (selectedDate) => set({ selectedDate }),
      setTimeRange: (timeRange) => set({ timeRange }),
      setMinAge: (minAge) => set({ minAge }),
      setViewMode: (viewMode) => set({ viewMode }),
      setCeSoirMode: (ceSoirMode) => set({ ceSoirMode }),
      resetAll: () =>
        set({ searchQuery: '', selectedCinemas: [], selectedCity: null, version: null, minRating: null, sort: DEFAULT_SORT, selectedDate: null, timeRange: null, minAge: 0, ceSoirMode: false }),
    }),
    {
      name: 'reeltime-filters',
      // v1 : le tri par défaut passe de « Popularité » à « Letterboxd ». Sans
      // cette migration, l'ancien défaut persisté resterait figé pour tous ceux
      // qui n'ont jamais touché au sélecteur de tri.
      version: 1,
      migrate: (persisted, fromVersion) => {
        const state = persisted as PersistedFilters;
        if (fromVersion < 1 && state?.sort === 'popularity') {
          return { ...state, sort: DEFAULT_SORT };
        }
        return state;
      },
      // `timeRange` en est volontairement absent : les bornes se recalculent à
      // chaque jour, restaurer la plage d'hier produirait un filtre invisible.
      partialize: (state) => ({
        selectedCinemas: state.selectedCinemas,
        selectedCity: state.selectedCity,
        version: state.version,
        minRating: state.minRating,
        sort: state.sort,
        minAge: state.minAge,
        viewMode: state.viewMode,
      }),
    },
  ),
);
