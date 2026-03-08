import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SortOption = 'popularity' | 'alphabetical' | 'year-desc' | 'year-asc' | 'showtimes';
export type DayFilter = 'all' | 'weekday' | 'weekend' | '0' | '1' | '2' | '3' | '4' | '5' | '6';
export type TimeSlotFilter = 'all' | 'morning' | 'afternoon' | 'evening' | 'night';
export type MinAgeFilter = 0 | 1 | 5 | 10 | 20 | 30 | 50;

interface FiltersState {
  searchQuery: string;
  selectedCinemas: string[];
  version: 'VO' | 'VF' | 'VOST' | null;
  minTime: string | null;
  minRating: number | null;
  sort: SortOption;
  dayFilter: DayFilter;
  timeSlot: TimeSlotFilter;
  minAge: MinAgeFilter;
  setSearchQuery: (q: string) => void;
  toggleCinema: (cinemaId: string) => void;
  setVersion: (v: 'VO' | 'VF' | 'VOST' | null) => void;
  setMinTime: (t: string | null) => void;
  setMinRating: (r: number | null) => void;
  setSort: (s: SortOption) => void;
  setDayFilter: (d: DayFilter) => void;
  setTimeSlot: (t: TimeSlotFilter) => void;
  setMinAge: (a: MinAgeFilter) => void;
  resetAll: () => void;
}

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      searchQuery: '',
      selectedCinemas: [],
      version: null,
      minTime: null,
      minRating: null,
      sort: 'popularity',
      dayFilter: 'all',
      timeSlot: 'all',
      minAge: 0,
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      toggleCinema: (cinemaId) =>
        set((state) => ({
          selectedCinemas: state.selectedCinemas.includes(cinemaId)
            ? state.selectedCinemas.filter((id) => id !== cinemaId)
            : [...state.selectedCinemas, cinemaId],
        })),
      setVersion: (version) => set({ version }),
      setMinTime: (minTime) => set({ minTime }),
      setMinRating: (minRating) => set({ minRating }),
      setSort: (sort) => set({ sort }),
      setDayFilter: (dayFilter) => set({ dayFilter }),
      setTimeSlot: (timeSlot) => set({ timeSlot }),
      setMinAge: (minAge) => set({ minAge }),
      resetAll: () =>
        set({ searchQuery: '', selectedCinemas: [], version: null, minTime: null, minRating: null, sort: 'popularity', dayFilter: 'all', timeSlot: 'all', minAge: 0 }),
    }),
    {
      name: 'reeltime-filters',
      partialize: (state) => ({
        selectedCinemas: state.selectedCinemas,
        version: state.version,
        minTime: state.minTime,
        minRating: state.minRating,
        sort: state.sort,
        dayFilter: state.dayFilter,
        timeSlot: state.timeSlot,
        minAge: state.minAge,
      }),
    },
  ),
);
