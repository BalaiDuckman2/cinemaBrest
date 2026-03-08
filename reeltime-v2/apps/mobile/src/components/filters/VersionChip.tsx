import { Pressable, Text, StyleSheet } from 'react-native';
import { useFiltersStore } from '../../stores/useFiltersStore';

interface VersionChipProps {
  version: 'VO' | 'VF' | 'VOST' | null;
  label: string;
}

export function VersionChip({ version: chipVersion, label }: VersionChipProps) {
  const currentVersion = useFiltersStore((s) => s.version);
  const setVersion = useFiltersStore((s) => s.setVersion);
  const isSelected = currentVersion === chipVersion;

  return (
    <Pressable
      onPress={() => setVersion(isSelected ? null : chipVersion)}
      style={[styles.chip, isSelected && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={label}
    >
      <Text style={[styles.label, isSelected && styles.labelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF8E1',
    borderWidth: 2,
    borderColor: '#8D6E63',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: '#D32F2F',
    borderColor: '#D32F2F',
  },
  label: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 14,
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  labelActive: {
    color: '#FFF8E1',
  },
});
