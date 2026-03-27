import { useMemo, forwardRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { CinemaChip } from './CinemaChip';
import { VersionChip } from './VersionChip';
import { TimeSlider } from './TimeSlider';
import { RatingSlider } from './RatingSlider';
import { useFiltersStore } from '../../stores/useFiltersStore';
import { useCinemas } from '../../hooks/useCinemas';
import { DEPARTMENTS, getShortName } from '../../utils/cinemaConstants';
import type { DayFilter, TimeSlotFilter, MinAgeFilter } from '../../stores/useFiltersStore';

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
  { value: 'afternoon', label: 'Apres-midi' },
  { value: 'evening', label: 'Soiree' },
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

export const FilterSheet = forwardRef<BottomSheet>(
  function FilterSheet(_props, ref) {
    const snapPoints = useMemo(() => ['70%', '92%'], []);
    const { data: cinemas = [] } = useCinemas();
    const selectedCinemas = useFiltersStore((s) => s.selectedCinemas);
    const setSelectedCinemas = useFiltersStore((s) => s.setSelectedCinemas);
    const selectedDepartment = useFiltersStore((s) => s.selectedDepartment);
    const setDepartment = useFiltersStore((s) => s.setDepartment);
    const selectedCity = useFiltersStore((s) => s.selectedCity);
    const setCity = useFiltersStore((s) => s.setCity);
    const dayFilter = useFiltersStore((s) => s.dayFilter);
    const setDayFilter = useFiltersStore((s) => s.setDayFilter);
    const timeSlot = useFiltersStore((s) => s.timeSlot);
    const setTimeSlot = useFiltersStore((s) => s.setTimeSlot);
    const minAge = useFiltersStore((s) => s.minAge);
    const setMinAge = useFiltersStore((s) => s.setMinAge);

    const availableCities = selectedDepartment
      ? DEPARTMENTS.find((d) => d.label === selectedDepartment)?.cities ?? []
      : DEPARTMENTS.flatMap((d) => d.cities);

    const visibleCinemas = cinemas.filter((cinema) => {
      if (selectedCity) return cinema.city === selectedCity;
      if (selectedDepartment) return availableCities.includes(cinema.city);
      return true;
    });

    const handleDepartmentChange = useCallback((value: string) => {
      const dept = value === 'all' ? null : value;
      setDepartment(dept);
      setCity(null);

      if (!dept) {
        setSelectedCinemas([]);
        return;
      }

      const deptCities = DEPARTMENTS.find((d) => d.label === dept)?.cities ?? [];
      const deptCinemaIds = cinemas.filter((c) => deptCities.includes(c.city)).map((c) => c.id);
      setSelectedCinemas(deptCinemaIds);
    }, [cinemas, setDepartment, setCity, setSelectedCinemas]);

    const handleCityChange = useCallback((value: string) => {
      const city = value === 'all' ? null : value;
      setCity(city);

      if (!city) {
        if (selectedDepartment) {
          const deptCities = DEPARTMENTS.find((d) => d.label === selectedDepartment)?.cities ?? [];
          const deptCinemaIds = cinemas.filter((c) => deptCities.includes(c.city)).map((c) => c.id);
          setSelectedCinemas(deptCinemaIds);
        } else {
          setSelectedCinemas([]);
        }
        return;
      }

      const cityCinemaIds = cinemas.filter((c) => c.city === city).map((c) => c.id);
      setSelectedCinemas(cityCinemaIds);
    }, [cinemas, selectedDepartment, setCity, setSelectedCinemas]);

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

          {/* Department chips */}
          <Text style={styles.sectionLabel}>DÉPARTEMENT</Text>
          <View style={styles.wrapRow}>
            <FilterChip
              label="Tous"
              isSelected={selectedDepartment === null}
              onPress={() => handleDepartmentChange('all')}
            />
            {DEPARTMENTS.map((dept) => (
              <FilterChip
                key={dept.label}
                label={dept.label}
                isSelected={selectedDepartment === dept.label}
                onPress={() => handleDepartmentChange(selectedDepartment === dept.label ? 'all' : dept.label)}
              />
            ))}
          </View>

          {/* City chips */}
          <Text style={[styles.sectionLabel, styles.sectionSpacing]}>VILLE</Text>
          <View style={styles.wrapRow}>
            <FilterChip
              label="Toutes"
              isSelected={selectedCity === null}
              onPress={() => handleCityChange('all')}
            />
            {availableCities.map((city) => (
              <FilterChip
                key={city}
                label={city}
                isSelected={selectedCity === city}
                onPress={() => handleCityChange(selectedCity === city ? 'all' : city)}
              />
            ))}
          </View>

          {/* Cinema chips */}
          <Text style={[styles.sectionLabel, styles.sectionSpacing]}>CINÉMAS</Text>
          <View style={styles.wrapRow}>
            {visibleCinemas.map((cinema) => (
              <CinemaChip
                key={cinema.id}
                cinemaId={cinema.id}
                cinemaName={getShortName(cinema.name, cinema.city)}
              />
            ))}
          </View>

          {/* Version chips */}
          <Text style={[styles.sectionLabel, styles.sectionSpacing]}>VERSION</Text>
          <View style={styles.wrapRow}>
            <VersionChip version={null} label="Tous" />
            <VersionChip version="VO" label="VO" />
            <VersionChip version="VF" label="VF" />
            <VersionChip version="VOST" label="VOST" />
          </View>

          {/* Day filter chips */}
          <Text style={[styles.sectionLabel, styles.sectionSpacing]}>JOUR</Text>
          <View style={styles.wrapRow}>
            {DAY_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                isSelected={dayFilter === opt.value}
                onPress={() => setDayFilter(dayFilter === opt.value ? 'all' : opt.value)}
              />
            ))}
          </View>

          {/* Time slot chips */}
          <Text style={[styles.sectionLabel, styles.sectionSpacing]}>CRENEAU</Text>
          <View style={styles.wrapRow}>
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
          <View style={styles.wrapRow}>
            {AGE_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                isSelected={minAge === opt.value}
                onPress={() => setMinAge(minAge === opt.value ? 0 : opt.value)}
              />
            ))}
          </View>

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
    backgroundColor: '#D7CCC8',
    width: 40,
    height: 4,
    borderRadius: 2,
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
  wrapRow: {
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
    borderWidth: 1.5,
    borderColor: 'rgba(141,110,99,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
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
