import { useRef } from 'react';
import { View, Text, TouchableOpacity, PanResponder, StyleSheet } from 'react-native';

interface WeekNavigatorProps {
  weekOffset: number;
  weekLabel: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}

export function WeekNavigator({
  weekOffset,
  weekLabel,
  onPrevWeek,
  onNextWeek,
  onToday,
}: WeekNavigatorProps) {
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) {
          onNextWeek();
        } else if (gestureState.dx > 50) {
          onPrevWeek();
        }
      },
    }),
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.row}>
        <TouchableOpacity onPress={onPrevWeek} style={styles.arrowButton} hitSlop={12}>
          <Text style={styles.arrowText}>{'\u2190'}</Text>
        </TouchableOpacity>

        <View style={styles.periodBadge}>
          <Text style={styles.periodText}>{weekLabel}</Text>
        </View>

        <TouchableOpacity onPress={onNextWeek} style={styles.arrowButton} hitSlop={12}>
          <Text style={styles.arrowText}>{'\u2192'}</Text>
        </TouchableOpacity>
      </View>

      {weekOffset !== 0 && (
        <TouchableOpacity onPress={onToday} style={styles.todayButton} hitSlop={8}>
          <Text style={styles.todayText}>Aujourd&apos;hui</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EFEBE9',
    borderWidth: 2,
    borderColor: '#8D6E63',
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrowButton: {
    backgroundColor: '#FFF8E1',
    borderWidth: 2,
    borderColor: '#8D6E63',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  arrowText: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 16,
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  periodBadge: {
    flex: 1,
    backgroundColor: '#D32F2F',
    borderWidth: 2,
    borderColor: '#B71C1C',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  periodText: {
    fontFamily: 'CrimsonText-SemiBold',
    fontSize: 14,
    color: '#FFF8E1',
    textAlign: 'center',
  },
  todayButton: {
    backgroundColor: '#F9A825',
    borderWidth: 2,
    borderColor: '#FFD54F',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  todayText: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 14,
    color: '#1A1A1A',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
