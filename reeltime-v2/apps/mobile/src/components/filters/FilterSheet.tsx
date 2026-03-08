import { useMemo, forwardRef, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { CinemaChip } from './CinemaChip';
import { VersionChip } from './VersionChip';
import { TimeSlider } from './TimeSlider';
import { RatingSlider } from './RatingSlider';
import { useFiltersStore } from '../../stores/useFiltersStore';
import type { DayFilter, TimeSlotFilter, MinAgeFilter } from '../../stores/useFiltersStore';

interface Cinema {
  id: string;
  name: string;
}

interface FilterSheetProps {
  cinemas: Cinema[];
}

const DAY_OPTIONS: { value: DayFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'weekday', label: 'Semaine' },
  { value: 'weekend', label: 'Weekend' },
  { value: '0', label: 'Lun' },
  { value: '1', label: 'Mar' },
  { value: '2', label: 'Mer' },
  { value: '3', label: 'Jeu' },
  { value: '4', label: 'Ven' },
  { value: '5', label: 'Sam' },
  { value: '6', label: 'Dim' },
];

const AGE_OPTIONS: { value: MinAgeFilter; label: string }[] = [
  { value: 0, label: 'Tous' },
  { value: 1, label: '+1 an' },
  { value: 5, label: '+5 ans' },
  { value: 10, label: '+10 ans' },
  { value: 20, label: '+20 ans' },
  { value: 30, label: '+30 ans' },
  { value: 50, label: '+50 ans' },
];

const TIME_SLOT_OPTIONS: { value: TimeSlotFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'morning', label: 'Matin' },
  { value: 'afternoon', label: 'Après-midi' },
  { value: 'evening', label: 'Soirée' },
  { value: 'night', label: 'Nuit' },
];

function FilterChip({ label, isSelected, onPress }: { label: string; isSelected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filterChip, isSelected && styles.filterChipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
    >
      <Text style={[styles.filterChipLabel, isSelected && styles.filterChipLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export const FilterSheet = forwardRef<BottomSheet, FilterSheetProps>(
  function FilterSheet({ cinemas }, ref) {
    const snapPoints = useMemo(() => ['60%', '90%'], []);
    const dayFilter = useFiltersStore((s) => s.dayFilter);
    const setDayFilter = useFiltersStore((s) => s.setDayFilter);
    const timeSlot = useFiltersStore((s) => s.timeSlot);
    const setTimeSlot = useFiltersStore((s) => s.setTimeSlot);
    const minAge = useFiltersStore((s) => s.minAge);
    const setMinAge = useFiltersStore((s) => s.setMinAge);

    const handleSheetChanges = useCallback((_index: number) => {
      // No-op, filters apply instantly
    }, []);

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onChange={handleSheetChanges}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Filtres</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Cinema chips */}
          <Text style={styles.sectionLabel}>CINEMAS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {cinemas.map((cinema) => (
              <CinemaChip
                key={cinema.id}
                cinemaId={cinema.id}
                cinemaName={cinema.name}
              />
            ))}
          </ScrollView>

          {/* Version chips */}
          <Text style={[styles.sectionLabel, styles.sectionSpacing]}>VERSION</Text>
          <View style={styles.versionRow}>
            <VersionChip version={null} label="Tous" />
            <VersionChip version="VO" label="VO" />
            <VersionChip version="VF" label="VF" />
            <VersionChip version="VOST" label="VOST" />
          </View>

          {/* Day filter chips */}
          <Text style={[styles.sectionLabel, styles.sectionSpacing]}>JOUR</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {DAY_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                isSelected={dayFilter === opt.value}
                onPress={() => setDayFilter(dayFilter === opt.value ? 'all' : opt.value)}
              />
            ))}
          </ScrollView>

          {/* Time slot chips */}
          <Text style={[styles.sectionLabel, styles.sectionSpacing]}>CRÉNEAU</Text>
          <View style={styles.versionRow}>
            {TIME_SLOT_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                isSelected={timeSlot === opt.value}
                onPress={() => setTimeSlot(timeSlot === opt.value ? 'all' : opt.value)}
              />
            ))}
          </View>

          {/* Age filter chips */}
          <Text style={[styles.sectionLabel, styles.sectionSpacing]}>AGE DU FILM</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {AGE_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                isSelected={minAge === opt.value}
                onPress={() => setMinAge(minAge === opt.value ? 0 : opt.value)}
              />
            ))}
          </ScrollView>

          {/* Time slider */}
          <View style={styles.sectionSpacing}>
            <TimeSlider />
          </View>

          {/* Rating slider */}
          <View style={styles.sliderSpacing}>
            <RatingSlider />
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#EFEBE9',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 4,
    borderTopColor: '#D32F2F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  handleIndicator: {
    backgroundColor: '#FFD54F',
    width: 48,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  divider: {
    height: 2,
    backgroundColor: '#8D6E63',
    opacity: 0.3,
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 14,
    color: '#D32F2F',
    letterSpacing: 1,
    marginBottom: 10,
  },
  sectionSpacing: {
    marginTop: 20,
  },
  sliderSpacing: {
    marginTop: 12,
  },
  chipsRow: {
    paddingRight: 8,
  },
  versionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#FFF8E1',
    borderWidth: 2,
    borderColor: '#8D6E63',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: '#D32F2F',
    borderColor: '#D32F2F',
  },
  filterChipLabel: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 13,
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  filterChipLabelActive: {
    color: '#FFF8E1',
  },
});
