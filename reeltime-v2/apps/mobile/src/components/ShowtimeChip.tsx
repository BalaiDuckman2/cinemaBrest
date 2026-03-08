import { Pressable, Text, View, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ShowtimeEntry } from '../types';

interface ShowtimeChipProps {
  showtime: ShowtimeEntry;
  compact?: boolean;
  saved?: boolean;
  onLongPress?: () => void;
}

export function ShowtimeChip({ showtime, compact = false, saved = false, onLongPress }: ShowtimeChipProps) {
  const handlePress = () => {
    if (showtime.bookingUrl) {
      Linking.openURL(showtime.bookingUrl).catch(() => {
        // URL may be malformed, silently ignore
      });
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      delayLongPress={500}
      disabled={!showtime.bookingUrl && !onLongPress}
      style={({ pressed }) => [
        styles.chip,
        saved && styles.chipSaved,
        pressed && styles.chipPressed,
      ]}
    >
      <Text style={[styles.time, saved && styles.timeSaved]}>
        {showtime.time}
      </Text>
      {showtime.version ? (
        <Text style={[styles.version, saved && styles.versionSaved]}>
          {showtime.version}
        </Text>
      ) : null}
      {saved && (
        <View style={styles.bookmarkIcon}>
          <Ionicons name="bookmark" size={10} color="#1A1A1A" />
        </View>
      )}
      {/* Ticket hole */}
      <View style={[styles.ticketHole, saved && styles.ticketHoleSaved]} />
      {!compact && (
        <Text style={styles.cinema} numberOfLines={1}>
          {showtime.cinemaName}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: '#D32F2F',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFD54F',
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  chipSaved: {
    backgroundColor: '#F9A825',
    borderColor: '#FFD54F',
  },
  chipPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.85,
  },
  time: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 15,
    color: '#FFF8E1',
    letterSpacing: 0.5,
  },
  timeSaved: {
    color: '#1A1A1A',
  },
  version: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 9,
    color: 'rgba(255,248,225,0.9)',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  versionSaved: {
    color: 'rgba(26,26,26,0.7)',
  },
  bookmarkIcon: {
    position: 'absolute',
    top: 2,
    left: 3,
  },
  ticketHole: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    backgroundColor: '#FFF8E1',
    borderBottomLeftRadius: 8,
  },
  ticketHoleSaved: {
    backgroundColor: '#FFF8E1',
  },
  cinema: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 11,
    color: 'rgba(255,248,225,0.8)',
    marginTop: 2,
  },
});
