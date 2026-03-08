import { ScrollView, Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFiltersStore } from '../../stores/useFiltersStore';

interface ChipData {
  label: string;
  onRemove: () => void;
}

interface ActiveFilterChipsProps {
  cinemaNames: Map<string, string>;
}

export function ActiveFilterChips({ cinemaNames }: ActiveFilterChipsProps) {
  const selectedCinemas = useFiltersStore((s) => s.selectedCinemas);
  const version = useFiltersStore((s) => s.version);
  const minTime = useFiltersStore((s) => s.minTime);
  const minRating = useFiltersStore((s) => s.minRating);
  const toggleCinema = useFiltersStore((s) => s.toggleCinema);
  const setVersion = useFiltersStore((s) => s.setVersion);
  const setMinTime = useFiltersStore((s) => s.setMinTime);
  const setMinRating = useFiltersStore((s) => s.setMinRating);

  const chips: ChipData[] = [];

  for (const cinemaId of selectedCinemas) {
    const name = cinemaNames.get(cinemaId) ?? cinemaId;
    chips.push({ label: name, onRemove: () => toggleCinema(cinemaId) });
  }
  if (version) {
    chips.push({ label: version, onRemove: () => setVersion(null) });
  }
  if (minTime) {
    chips.push({ label: `Apres ${minTime}`, onRemove: () => setMinTime(null) });
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
});
