import { ScrollView, Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFiltersStore } from '../../stores/useFiltersStore';
import { useCinemas } from '../../hooks/useCinemas';
import { DEPARTMENTS } from '../../utils/cinemaConstants';

interface ChipData {
  label: string;
  onRemove: () => void;
}

const DAY_LABELS: Record<string, string> = {
  weekday: 'Semaine',
  weekend: 'Weekend',
  '0': 'Lundi',
  '1': 'Mardi',
  '2': 'Mercredi',
  '3': 'Jeudi',
  '4': 'Vendredi',
  '5': 'Samedi',
  '6': 'Dimanche',
};

const TIME_LABELS: Record<string, string> = {
  morning: 'Matin',
  afternoon: 'Après-midi',
  evening: 'Soirée',
  night: 'Nuit',
};

interface ActiveFilterChipsProps {
  cinemaNames: Map<string, string>;
}

export function ActiveFilterChips({ cinemaNames }: ActiveFilterChipsProps) {
  const { data: cinemas = [] } = useCinemas();
  const selectedCinemas = useFiltersStore((s) => s.selectedCinemas);
  const selectedDepartment = useFiltersStore((s) => s.selectedDepartment);
  const selectedCity = useFiltersStore((s) => s.selectedCity);
  const version = useFiltersStore((s) => s.version);
  const dayFilter = useFiltersStore((s) => s.dayFilter);
  const timeSlot = useFiltersStore((s) => s.timeSlot);
  const minAge = useFiltersStore((s) => s.minAge);
  const minTime = useFiltersStore((s) => s.minTime);
  const minRating = useFiltersStore((s) => s.minRating);
  const setSelectedCinemas = useFiltersStore((s) => s.setSelectedCinemas);
  const setDepartment = useFiltersStore((s) => s.setDepartment);
  const setCity = useFiltersStore((s) => s.setCity);
  const setVersion = useFiltersStore((s) => s.setVersion);
  const setDayFilter = useFiltersStore((s) => s.setDayFilter);
  const setTimeSlot = useFiltersStore((s) => s.setTimeSlot);
  const setMinAge = useFiltersStore((s) => s.setMinAge);
  const setMinTime = useFiltersStore((s) => s.setMinTime);
  const setMinRating = useFiltersStore((s) => s.setMinRating);
  const resetAll = useFiltersStore((s) => s.resetAll);

  const chips: ChipData[] = [];

  if (version) {
    chips.push({ label: version === 'VF' ? 'VF' : 'VO/VOST', onRemove: () => setVersion(null) });
  }
  if (dayFilter !== 'all') {
    chips.push({ label: DAY_LABELS[dayFilter] ?? dayFilter, onRemove: () => setDayFilter('all') });
  }
  if (timeSlot !== 'all') {
    chips.push({ label: TIME_LABELS[timeSlot] ?? timeSlot, onRemove: () => setTimeSlot('all') });
  }
  if (minAge !== 0) {
    chips.push({ label: `+${minAge} ans`, onRemove: () => setMinAge(0) });
  }
  if (selectedDepartment !== null) {
    chips.push({
      label: selectedDepartment,
      onRemove: () => {
        setDepartment(null);
        setCity(null);
        setSelectedCinemas([]);
      },
    });
  }
  if (selectedCity !== null) {
    chips.push({
      label: selectedCity,
      onRemove: () => {
        setCity(null);
        if (selectedDepartment) {
          const deptCities = DEPARTMENTS.find((d) => d.label === selectedDepartment)?.cities ?? [];
          const deptCinemaIds = cinemas.filter((c) => deptCities.includes(c.city)).map((c) => c.id);
          setSelectedCinemas(deptCinemaIds);
        } else {
          setSelectedCinemas([]);
        }
      },
    });
  }
  if (selectedCinemas.length > 0 && selectedDepartment === null) {
    const label = selectedCinemas.length === 1
      ? cinemaNames.get(selectedCinemas[0]) ?? '1 cinéma'
      : `${selectedCinemas.length} cinémas`;
    chips.push({ label, onRemove: () => setSelectedCinemas([]) });
  }
  if (minTime) {
    chips.push({ label: `Après ${minTime}`, onRemove: () => setMinTime(null) });
  }
  if (minRating !== null) {
    chips.push({ label: `Note >= ${minRating.toFixed(1)}`, onRemove: () => setMinRating(null) });
  }

  if (chips.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {chips.map((chip, i) => (
        <Pressable
          key={`${chip.label}-${i}`}
          onPress={chip.onRemove}
          style={styles.chip}
          accessibilityRole="button"
          accessibilityLabel={`Retirer le filtre ${chip.label}`}
        >
          <Text style={styles.label}>{chip.label}</Text>
          <View style={styles.iconWrap}>
            <Ionicons name="close" size={12} color="#D32F2F" />
          </View>
        </Pressable>
      ))}
      <Pressable onPress={resetAll} style={styles.clearChip} accessibilityRole="button">
        <Text style={styles.clearLabel}>Tout effacer</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(211,47,47,0.12)',
    borderRadius: 16,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    gap: 4,
  },
  label: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 13,
    color: '#D32F2F',
  },
  iconWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(211,47,47,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D32F2F',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearLabel: {
    fontFamily: 'CrimsonText-SemiBold',
    fontSize: 13,
    color: '#FFF8E1',
  },
});
