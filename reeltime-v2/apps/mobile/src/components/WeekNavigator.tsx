import { useRef } from 'react';
import { View, Text, TouchableOpacity, PanResponder, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
          <Ionicons name="chevron-back" size={18} color="#5D4037" />
        </TouchableOpacity>

        <View style={styles.periodBadge}>
          <Text style={styles.periodText}>{weekLabel}</Text>
        </View>

        <TouchableOpacity onPress={onNextWeek} style={styles.arrowButton} hitSlop={12}>
          <Ionicons name="chevron-forward" size={18} color="#5D4037" />
        </TouchableOpacity>
      </View>

      {weekOffset !== 0 && (
        <TouchableOpacity onPress={onToday} style={styles.todayButton} hitSlop={8}>
          <Ionicons name="today-outline" size={14} color="#1A1A1A" style={{ marginRight: 4 }} />
          <Text style={styles.todayText}>Aujourd&apos;hui</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EFEBE9',
    borderWidth: 1.5,
    borderColor: 'rgba(141,110,99,0.3)',
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
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
    borderWidth: 1.5,
    borderColor: 'rgba(141,110,99,0.25)',
    borderRadius: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodBadge: {
    flex: 1,
    backgroundColor: '#D32F2F',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: '#B71C1C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9A825',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    shadowColor: '#F9A825',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  todayText: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 13,
    color: '#1A1A1A',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
