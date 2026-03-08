import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type DayFilter = 'all' | 'weekday' | 'weekend' | '0' | '1' | '2' | '3' | '4' | '5' | '6';
export type TimeSlotFilter = 'all' | 'morning' | 'afternoon' | 'evening' | 'night';
export type MinAgeFilter = 0 | 1 | 5 | 10 | 20 | 30 | 50;

export interface FiltersState {
  searchQuery: string;
  selectedCinemas: string[];
  version: 'VO' | 'VF' | 'VOST' | null;
  minTime: string | null;
  minRating: number | null;
  dayFilter: DayFilter;
  timeSlot: TimeSlotFilter;
  minAge: MinAgeFilter;
  recentSearches: string[];

  setSearchQuery: (query: string) => void;
  toggleCinema: (cinemaId: string) => void;
  setVersion: (version: 'VO' | 'VF' | 'VOST' | null) => void;
  setMinTime: (time: string | null) => void;
  setMinRating: (rating: number | null) => void;
  setDayFilter: (day: DayFilter) => void;
  setTimeSlot: (slot: TimeSlotFilter) => void;
  setMinAge: (age: MinAgeFilter) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  removeRecentSearch: (query: string) => void;
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
      dayFilter: 'all',
      timeSlot: 'all',
      minAge: 0,
      recentSearches: [],

      setSearchQuery: (query) => set({ searchQuery: query }),

      toggleCinema: (cinemaId) =>
        set((state) => ({
          selectedCinemas: state.selectedCinemas.includes(cinemaId)
            ? state.selectedCinemas.filter((id) => id !== cinemaId)
            : [...state.selectedCinemas, cinemaId],
        })),

      setVersion: (version) => set({ version }),

      setMinTime: (time) => set({ minTime: time }),

      setMinRating: (rating) => set({ minRating: rating }),

      setDayFilter: (day) => set({ dayFilter: day }),

      setTimeSlot: (slot) => set({ timeSlot: slot }),

      setMinAge: (age) => set({ minAge: age }),

      addRecentSearch: (query) =>
        set((state) => ({
          recentSearches: [
            query,
            ...state.recentSearches.filter((s) => s !== query),
          ].slice(0, 10),
        })),

      clearRecentSearches: () => set({ recentSearches: [] }),

      removeRecentSearch: (query) =>
        set((state) => ({
          recentSearches: state.recentSearches.filter((s) => s !== query),
        })),

      resetAll: () =>
        set({
          searchQuery: '',
          selectedCinemas: [],
          version: null,
          minTime: null,
          minRating: null,
          dayFilter: 'all',
          timeSlot: 'all',
          minAge: 0,
        }),
    }),
    {
      name: 'reeltime-filters',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        selectedCinemas: state.selectedCinemas,
        version: state.version,
        minTime: state.minTime,
        minRating: state.minRating,
        dayFilter: state.dayFilter,
        timeSlot: state.timeSlot,
        minAge: state.minAge,
        recentSearches: state.recentSearches,
      }),
    },
  ),
);
