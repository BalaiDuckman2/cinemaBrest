import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useFiltersStore } from '../../stores/useFiltersStore';

const MIN_HOUR = 10;
const MAX_HOUR = 22;
const STEP = 0.5; // 30-min steps

function hourToLabel(value: number): string {
  const h = Math.floor(value);
  const m = value % 1 === 0.5 ? '30' : '00';
  return `${String(h).padStart(2, '0')}:${m}`;
}

function timeToValue(time: string | null): number {
  if (!time) return MIN_HOUR;
  const [h, m] = time.split(':').map(Number);
  return h + (m >= 30 ? 0.5 : 0);
}

export function TimeSlider() {
  const minTime = useFiltersStore((s) => s.minTime);
  const setMinTime = useFiltersStore((s) => s.setMinTime);

  const value = timeToValue(minTime);
  const isActive = minTime !== null;

  const handleChange = (v: number) => {
    if (v <= MIN_HOUR) {
      setMinTime(null);
    } else {
      setMinTime(hourToLabel(v));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>HORAIRE MINIMUM</Text>
        <Text style={[styles.value, isActive && styles.valueActive]}>
          {isActive ? `Apres ${minTime}` : 'Tous'}
        </Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={MIN_HOUR}
        maximumValue={MAX_HOUR}
        step={STEP}
        value={value}
        onValueChange={handleChange}
        minimumTrackTintColor="#D32F2F"
        maximumTrackTintColor="rgba(141,110,99,0.2)"
        thumbTintColor="#D32F2F"
      />
      <View style={styles.labels}>
        <Text style={styles.tick}>{hourToLabel(MIN_HOUR)}</Text>
        <Text style={styles.tick}>{hourToLabel(MAX_HOUR)}</Text>
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
