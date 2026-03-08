import { useFiltersStore } from '../../stores/useFiltersStore';

// Get the initial state to reset between tests
const initialState = useFiltersStore.getState();

describe('useFiltersStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useFiltersStore.setState({
      searchQuery: '',
      selectedCinemas: [],
      version: null,
      minTime: null,
      minRating: null,
      dayFilter: 'all',
      timeSlot: 'all',
      minAge: 0,
      recentSearches: [],
    });
  });

  describe('initial state', () => {
    it('has empty searchQuery', () => {
      expect(useFiltersStore.getState().searchQuery).toBe('');
    });

    it('has empty selectedCinemas', () => {
      expect(useFiltersStore.getState().selectedCinemas).toEqual([]);
    });

    it('has null version', () => {
      expect(useFiltersStore.getState().version).toBeNull();
    });

    it('has null minTime', () => {
      expect(useFiltersStore.getState().minTime).toBeNull();
    });

    it('has null minRating', () => {
      expect(useFiltersStore.getState().minRating).toBeNull();
    });

    it('has "all" dayFilter', () => {
      expect(useFiltersStore.getState().dayFilter).toBe('all');
    });

    it('has "all" timeSlot', () => {
      expect(useFiltersStore.getState().timeSlot).toBe('all');
    });

    it('has 0 minAge', () => {
      expect(useFiltersStore.getState().minAge).toBe(0);
    });

    it('has empty recentSearches', () => {
      expect(useFiltersStore.getState().recentSearches).toEqual([]);
    });
  });

  describe('setSearchQuery', () => {
    it('updates searchQuery', () => {
      useFiltersStore.getState().setSearchQuery('Batman');
      expect(useFiltersStore.getState().searchQuery).toBe('Batman');
    });

    it('can set to empty string', () => {
      useFiltersStore.getState().setSearchQuery('test');
      useFiltersStore.getState().setSearchQuery('');
      expect(useFiltersStore.getState().searchQuery).toBe('');
    });
  });

  describe('toggleCinema', () => {
    it('adds cinema when not selected', () => {
      useFiltersStore.getState().toggleCinema('cinema-1');
      expect(useFiltersStore.getState().selectedCinemas).toEqual(['cinema-1']);
    });

    it('removes cinema when already selected', () => {
      useFiltersStore.getState().toggleCinema('cinema-1');
      useFiltersStore.getState().toggleCinema('cinema-1');
      expect(useFiltersStore.getState().selectedCinemas).toEqual([]);
    });

    it('handles multiple cinemas', () => {
      useFiltersStore.getState().toggleCinema('cinema-1');
      useFiltersStore.getState().toggleCinema('cinema-2');
      expect(useFiltersStore.getState().selectedCinemas).toEqual(['cinema-1', 'cinema-2']);
    });

    it('removes only the toggled cinema', () => {
      useFiltersStore.getState().toggleCinema('cinema-1');
      useFiltersStore.getState().toggleCinema('cinema-2');
      useFiltersStore.getState().toggleCinema('cinema-1');
      expect(useFiltersStore.getState().selectedCinemas).toEqual(['cinema-2']);
    });
  });

  describe('setVersion', () => {
    it('sets to VO', () => {
      useFiltersStore.getState().setVersion('VO');
      expect(useFiltersStore.getState().version).toBe('VO');
    });

    it('sets to VF', () => {
      useFiltersStore.getState().setVersion('VF');
      expect(useFiltersStore.getState().version).toBe('VF');
    });

    it('sets to VOST', () => {
      useFiltersStore.getState().setVersion('VOST');
      expect(useFiltersStore.getState().version).toBe('VOST');
    });

    it('sets to null to clear', () => {
      useFiltersStore.getState().setVersion('VO');
      useFiltersStore.getState().setVersion(null);
      expect(useFiltersStore.getState().version).toBeNull();
    });
  });

  describe('setDayFilter', () => {
    it('sets to weekday', () => {
      useFiltersStore.getState().setDayFilter('weekday');
      expect(useFiltersStore.getState().dayFilter).toBe('weekday');
    });

    it('sets to weekend', () => {
      useFiltersStore.getState().setDayFilter('weekend');
      expect(useFiltersStore.getState().dayFilter).toBe('weekend');
    });

    it('sets to specific day', () => {
      useFiltersStore.getState().setDayFilter('3');
      expect(useFiltersStore.getState().dayFilter).toBe('3');
    });

    it('resets to all', () => {
      useFiltersStore.getState().setDayFilter('weekend');
      useFiltersStore.getState().setDayFilter('all');
      expect(useFiltersStore.getState().dayFilter).toBe('all');
    });
  });

  describe('setTimeSlot', () => {
    it('sets to morning', () => {
      useFiltersStore.getState().setTimeSlot('morning');
      expect(useFiltersStore.getState().timeSlot).toBe('morning');
    });

    it('sets to afternoon', () => {
      useFiltersStore.getState().setTimeSlot('afternoon');
      expect(useFiltersStore.getState().timeSlot).toBe('afternoon');
    });

    it('sets to evening', () => {
      useFiltersStore.getState().setTimeSlot('evening');
      expect(useFiltersStore.getState().timeSlot).toBe('evening');
    });

    it('sets to night', () => {
      useFiltersStore.getState().setTimeSlot('night');
      expect(useFiltersStore.getState().timeSlot).toBe('night');
    });
  });

  describe('setMinAge', () => {
    it('sets min age', () => {
      useFiltersStore.getState().setMinAge(10);
      expect(useFiltersStore.getState().minAge).toBe(10);
    });

    it('resets to 0', () => {
      useFiltersStore.getState().setMinAge(20);
      useFiltersStore.getState().setMinAge(0);
      expect(useFiltersStore.getState().minAge).toBe(0);
    });
  });

  describe('setMinTime', () => {
    it('sets min time', () => {
      useFiltersStore.getState().setMinTime('14:00');
      expect(useFiltersStore.getState().minTime).toBe('14:00');
    });

    it('clears with null', () => {
      useFiltersStore.getState().setMinTime('14:00');
      useFiltersStore.getState().setMinTime(null);
      expect(useFiltersStore.getState().minTime).toBeNull();
    });
  });

  describe('setMinRating', () => {
    it('sets min rating', () => {
      useFiltersStore.getState().setMinRating(3.5);
      expect(useFiltersStore.getState().minRating).toBe(3.5);
    });

    it('clears with null', () => {
      useFiltersStore.getState().setMinRating(4.0);
      useFiltersStore.getState().setMinRating(null);
      expect(useFiltersStore.getState().minRating).toBeNull();
    });
  });

  describe('recentSearches', () => {
    it('addRecentSearch adds a search', () => {
      useFiltersStore.getState().addRecentSearch('Batman');
      expect(useFiltersStore.getState().recentSearches).toEqual(['Batman']);
    });

    it('addRecentSearch moves duplicate to front', () => {
      useFiltersStore.getState().addRecentSearch('Batman');
      useFiltersStore.getState().addRecentSearch('Spider-Man');
      useFiltersStore.getState().addRecentSearch('Batman');
      expect(useFiltersStore.getState().recentSearches).toEqual(['Batman', 'Spider-Man']);
    });

    it('addRecentSearch limits to 10 entries', () => {
      for (let i = 0; i < 15; i++) {
        useFiltersStore.getState().addRecentSearch(`search-${i}`);
      }
      expect(useFiltersStore.getState().recentSearches).toHaveLength(10);
      expect(useFiltersStore.getState().recentSearches[0]).toBe('search-14');
    });

    it('removeRecentSearch removes a specific search', () => {
      useFiltersStore.getState().addRecentSearch('Batman');
      useFiltersStore.getState().addRecentSearch('Spider-Man');
      useFiltersStore.getState().removeRecentSearch('Batman');
      expect(useFiltersStore.getState().recentSearches).toEqual(['Spider-Man']);
    });

    it('clearRecentSearches empties the list', () => {
      useFiltersStore.getState().addRecentSearch('Batman');
      useFiltersStore.getState().addRecentSearch('Spider-Man');
      useFiltersStore.getState().clearRecentSearches();
      expect(useFiltersStore.getState().recentSearches).toEqual([]);
    });
  });

  describe('resetAll', () => {
    it('resets all filters to defaults', () => {
      // Set various filters
      useFiltersStore.getState().setSearchQuery('Batman');
      useFiltersStore.getState().toggleCinema('cinema-1');
      useFiltersStore.getState().setVersion('VO');
      useFiltersStore.getState().setMinTime('14:00');
      useFiltersStore.getState().setMinRating(3.5);
      useFiltersStore.getState().setDayFilter('weekend');
      useFiltersStore.getState().setTimeSlot('evening');
      useFiltersStore.getState().setMinAge(10);

      // Reset
      useFiltersStore.getState().resetAll();

      const state = useFiltersStore.getState();
      expect(state.searchQuery).toBe('');
      expect(state.selectedCinemas).toEqual([]);
      expect(state.version).toBeNull();
      expect(state.minTime).toBeNull();
      expect(state.minRating).toBeNull();
      expect(state.dayFilter).toBe('all');
      expect(state.timeSlot).toBe('all');
      expect(state.minAge).toBe(0);
    });

    it('does not reset recentSearches', () => {
      useFiltersStore.getState().addRecentSearch('Batman');
      useFiltersStore.getState().resetAll();
      // resetAll does not include recentSearches in its reset
      expect(useFiltersStore.getState().recentSearches).toEqual(['Batman']);
    });
  });
});
