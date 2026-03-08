import { Pressable, Text, StyleSheet } from 'react-native';
import { useFiltersStore } from '../../stores/useFiltersStore';

interface CinemaChipProps {
  cinemaId: string;
  cinemaName: string;
}

export function CinemaChip({ cinemaId, cinemaName }: CinemaChipProps) {
  const selectedCinemas = useFiltersStore((s) => s.selectedCinemas);
  const toggleCinema = useFiltersStore((s) => s.toggleCinema);
  const isSelected = selectedCinemas.includes(cinemaId);

  return (
    <Pressable
      onPress={() => toggleCinema(cinemaId)}
      style={[styles.chip, isSelected && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={cinemaName}
    >
      <Text style={[styles.label, isSelected && styles.labelActive]} numberOfLines={1}>
        {cinemaName}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFF8E1',
    borderWidth: 1.5,
    borderColor: 'rgba(141,110,99,0.3)',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: '#D32F2F',
    borderColor: '#D32F2F',
  },
  label: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 12,
    color: '#1A1A1A',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  labelActive: {
    color: '#FFF8E1',
  },
});
