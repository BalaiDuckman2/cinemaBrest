import { Pressable, Image, Text, View, StyleSheet, Dimensions } from 'react-native';
import type { FilmListItem } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 12;
const CARD_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP) / 2;
const POSTER_HEIGHT = CARD_WIDTH * 1.5; // 2:3 aspect ratio

interface FilmCardProps {
  film: FilmListItem;
  onPress: (film: FilmListItem) => void;
}

export function FilmCard({ film, onPress }: FilmCardProps) {
  return (
    <Pressable
      onPress={() => onPress(film)}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.posterContainer}>
        {film.posterUrl ? (
          <Image
            source={{ uri: film.posterUrl }}
            style={styles.poster}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.posterPlaceholder}>
            <Text style={styles.posterPlaceholderText}>🎬</Text>
          </View>
        )}

        {/* Dark overlay at bottom for text readability */}
        <View style={styles.darkOverlay} />

        {/* Title on overlay */}
        <View style={styles.overlayTextContainer}>
          <Text style={styles.overlayTitle} numberOfLines={2}>
            {film.title}
          </Text>
          {film.year > 0 && (
            <Text style={styles.overlayYear}>{film.year}</Text>
          )}
        </View>

        {/* Rating badge */}
        {film.rating != null && (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>{film.rating.toFixed(1)}</Text>
          </View>
        )}

        {/* Ticket corner notch */}
        <View style={styles.cornerNotch} />
      </View>

      {/* Perforation line */}
      <View style={styles.perforation} />
    </Pressable>
  );
}

export { CARD_WIDTH };

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 10,
    backgroundColor: '#FFF8E1',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(141,110,99,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  posterContainer: {
    width: '100%',
    height: POSTER_HEIGHT,
    position: 'relative',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(141,110,99,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterPlaceholderText: {
    fontSize: 40,
  },
  darkOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    // Smoother gradient effect with layered opacity
    backgroundColor: 'rgba(26,26,26,0.75)',
  },
  overlayTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  overlayTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 13,
    color: '#FFF8E1',
    lineHeight: 17,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  overlayYear: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 11,
    color: '#FFD54F',
    marginTop: 3,
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(211,47,47,0.92)',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FFD54F',
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingText: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 13,
    color: '#FFF8E1',
  },
  cornerNotch: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 14,
    height: 14,
    backgroundColor: '#FFF8E1',
    borderBottomLeftRadius: 14,
  },
  perforation: {
    height: 3,
    backgroundColor: '#D7CCC8',
  },
});
