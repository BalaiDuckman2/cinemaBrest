import { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { useFiltersStore } from '../stores/useFiltersStore';
import { useFilms } from '../hooks/useFilms';
import { useWeekNavigation } from '../hooks/useWeekNavigation';
import { useFilteredFilms } from '../hooks/useFilteredFilms';
import { useCinemas } from '../hooks/useCinemas';
import { getShortName } from '../utils/cinemaConstants';
import { Header } from '../components/Header';
import { FilmCard } from '../components/FilmCard';
import { FilmBottomSheet } from '../components/FilmBottomSheet';
import { FilmGridSkeleton } from '../components/Skeleton';
import { WeekNavigator } from '../components/WeekNavigator';
import { FilterSheet } from '../components/filters/FilterSheet';
import { ActiveFilterChips } from '../components/filters/ActiveFilterChips';
import type { FilmListItem } from '../types';

export function FilmsScreen() {
  const { weekOffset, weekLabel, nextWeek, prevWeek, goToday } = useWeekNavigation();
  const { data, isLoading, isError, refetch, isRefetching } = useFilms(weekOffset);
  const films = data?.films ?? [];

  const { filteredFilms, activeFilterCount } = useFilteredFilms(films);

  const searchQuery = useFiltersStore((s) => s.searchQuery);
  const setSearchQuery = useFiltersStore((s) => s.setSearchQuery);
  const recentSearches = useFiltersStore((s) => s.recentSearches);
  const addRecentSearch = useFiltersStore((s) => s.addRecentSearch);
  const removeRecentSearch = useFiltersStore((s) => s.removeRecentSearch);
  const clearRecentSearches = useFiltersStore((s) => s.clearRecentSearches);
  const resetAll = useFiltersStore((s) => s.resetAll);

  const [isFocused, setIsFocused] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState<FilmListItem | null>(null);

  const filterSheetRef = useRef<BottomSheet>(null);
  const inputRef = useRef<TextInput>(null);

  const { data: cinemaList = [] } = useCinemas();

  const cinemaNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of cinemaList) map.set(c.id, getShortName(c.name, c.city));
    return map;
  }, [cinemaList]);

  const handleSearchSubmit = useCallback(() => {
    const trimmed = searchQuery.trim();
    if (trimmed) {
      addRecentSearch(trimmed);
    }
    Keyboard.dismiss();
  }, [searchQuery, addRecentSearch]);

  const handleRecentSearchTap = useCallback(
    (query: string) => {
      setSearchQuery(query);
      setIsFocused(false);
      Keyboard.dismiss();
    },
    [setSearchQuery],
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    inputRef.current?.focus();
  }, [setSearchQuery]);

  const handleOpenFilters = useCallback(() => {
    filterSheetRef.current?.snapToIndex(0);
  }, []);

  const handleFilmPress = useCallback((film: FilmListItem) => {
    setSelectedFilm(film);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSelectedFilm(null);
  }, []);

  const showRecentSearches = isFocused && searchQuery === '' && recentSearches.length > 0;

  const weekNavigator = (
    <WeekNavigator
      weekOffset={weekOffset}
      weekLabel={weekLabel}
      onPrevWeek={prevWeek}
      onNextWeek={nextWeek}
      onToday={goToday}
    />
  );

  const listHeader = (
    <View>
      {weekNavigator}
      <ActiveFilterChips cinemaNames={cinemaNames} />
    </View>
  );

  const listEmpty = isError ? (
    <View style={styles.emptyContainer}>
      <Ionicons name="alert-circle-outline" size={48} color="#D32F2F" />
      <Text style={styles.emptyText}>Impossible de charger les films</Text>
      <Pressable style={styles.resetButton} onPress={() => refetch()}>
        <Text style={styles.resetButtonText}>Reessayer</Text>
      </Pressable>
    </View>
  ) : isLoading ? (
    <FilmGridSkeleton />
  ) : (
    <View style={styles.emptyContainer}>
      <Ionicons name="film-outline" size={48} color="rgba(141,110,99,0.4)" />
      <Text style={styles.emptyText}>Aucune seance trouvee</Text>
      {activeFilterCount > 0 && (
        <Pressable style={styles.resetButton} onPress={resetAll}>
          <Text style={styles.resetButtonText}>Reinitialiser les filtres</Text>
        </Pressable>
      )}
    </View>
  );

  const renderItem = useCallback(
    ({ item }: { item: FilmListItem }) => (
      <FilmCard film={item} onPress={handleFilmPress} />
    ),
    [handleFilmPress],
  );

  const keyExtractor = useCallback((item: FilmListItem) => item.id, []);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <Header />

        {/* Search Bar */}
        <View style={styles.searchBarRow}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={18} color="#8D6E63" style={styles.searchIcon} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onSubmitEditing={handleSearchSubmit}
              placeholder="Rechercher un film..."
              placeholderTextColor="rgba(141,110,99,0.5)"
              returnKeyType="search"
              autoCorrect={false}
            />
            {searchQuery !== '' && (
              <Pressable onPress={handleClearSearch} style={styles.clearButton} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#8D6E63" />
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={handleOpenFilters}
            style={styles.filterButton}
            accessibilityLabel="Ouvrir les filtres"
          >
            <Ionicons name="options-outline" size={22} color="#1A1A1A" />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Recent Searches */}
        {showRecentSearches && (
          <View style={styles.recentContainer}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>RECHERCHES RECENTES</Text>
              <Pressable onPress={clearRecentSearches} hitSlop={8}>
                <Text style={styles.recentClear}>Effacer</Text>
              </Pressable>
            </View>
            {recentSearches.map((search) => (
              <View key={search} style={styles.recentItem}>
                <Pressable
                  onPress={() => handleRecentSearchTap(search)}
                  style={styles.recentItemContent}
                >
                  <Ionicons name="time-outline" size={16} color="rgba(141,110,99,0.5)" />
                  <Text style={styles.recentItemText}>{search}</Text>
                </Pressable>
                <Pressable onPress={() => removeRecentSearch(search)} hitSlop={8}>
                  <Ionicons name="close" size={16} color="rgba(141,110,99,0.4)" />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Film Grid */}
        {!showRecentSearches && (
          <FlatList
            data={filteredFilms}
            numColumns={2}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            columnWrapperStyle={styles.columnWrapper}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={listEmpty}
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            removeClippedSubviews
            maxToRenderPerBatch={8}
            windowSize={5}
            initialNumToRender={8}
            contentContainerStyle={styles.listContent}
          />
        )}

        {/* Filter Bottom Sheet */}
        <FilterSheet ref={filterSheetRef} />

        {/* Film Detail Bottom Sheet */}
        <FilmBottomSheet film={selectedFilm} onClose={handleCloseSheet} />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF8E1',
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(141,110,99,0.25)',
    height: 44,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'CrimsonText-Regular',
    fontSize: 16,
    color: '#1A1A1A',
    padding: 0,
  },
  clearButton: {
    marginLeft: 4,
    padding: 4,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFEBE9',
    borderWidth: 1.5,
    borderColor: 'rgba(141,110,99,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFD54F',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 11,
    color: '#1A1A1A',
  },
  recentContainer: {
    backgroundColor: '#EFEBE9',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(141,110,99,0.15)',
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(141,110,99,0.1)',
  },
  recentTitle: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 13,
    color: '#8D6E63',
    letterSpacing: 0.5,
  },
  recentClear: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 13,
    color: '#D32F2F',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(141,110,99,0.06)',
  },
  recentItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  recentItemText: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 15,
    color: '#1A1A1A',
  },
  columnWrapper: {
    gap: 12,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 16,
    color: '#8D6E63',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  resetButton: {
    backgroundColor: '#D32F2F',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 8,
  },
  resetButtonText: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 16,
    color: '#FFF8E1',
    letterSpacing: 0.5,
  },
});
