import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useFiltersStore } from '../../stores/useFiltersStore';

const MIN_RATING = 0;
const MAX_RATING = 5;
const STEP = 0.5;

function formatRating(value: number): string {
  return value.toFixed(1);
}

export function RatingSlider() {
  const minRating = useFiltersStore((s) => s.minRating);
  const setMinRating = useFiltersStore((s) => s.setMinRating);

  const value = minRating ?? MIN_RATING;
  const isActive = minRating !== null;

  const handleChange = (v: number) => {
    if (v <= MIN_RATING) {
      setMinRating(null);
    } else {
      setMinRating(v);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>NOTE MINIMUM</Text>
        <Text style={[styles.value, isActive && styles.valueActive]}>
          {isActive ? `>= ${formatRating(minRating)}` : 'Tous'}
        </Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={MIN_RATING}
        maximumValue={MAX_RATING}
        step={STEP}
        value={value}
        onValueChange={handleChange}
        minimumTrackTintColor="#D32F2F"
        maximumTrackTintColor="rgba(141,110,99,0.2)"
        thumbTintColor="#D32F2F"
      />
      <View style={styles.labels}>
        <Text style={styles.tick}>{formatRating(MIN_RATING)}</Text>
        <Text style={styles.tick}>{formatRating(MAX_RATING)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 14,
    color: '#8D6E63',
    letterSpacing: 0.5,
  },
  value: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 14,
    color: '#8D6E63',
  },
  valueActive: {
    color: '#D32F2F',
    fontFamily: 'CrimsonText-SemiBold',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  tick: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 12,
    color: 'rgba(141,110,99,0.6)',
  },
});
