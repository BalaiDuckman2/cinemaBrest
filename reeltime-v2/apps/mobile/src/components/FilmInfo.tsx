import { View, Text, Image, Pressable, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { FilmListItem } from '../types';

interface FilmInfoProps {
  film: FilmListItem;
}

export function FilmInfo({ film }: FilmInfoProps) {
  const handleLetterboxd = () => {
    if (film.letterboxdUrl) {
      Linking.openURL(film.letterboxdUrl).catch(() => {});
    }
  };

  return (
    <View style={styles.container}>
      {/* Header row: poster + info */}
      <View style={styles.headerRow}>
        {film.posterUrl && (
          <Image
            source={{ uri: film.posterUrl }}
            style={styles.poster}
            resizeMode="cover"
          />
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{film.title}</Text>

          {/* Year + Director */}
          <Text style={styles.meta}>
            {film.year > 0 ? film.year : ''}
            {film.director ? (film.year > 0 ? ' \u00B7 ' : '') + film.director : ''}
          </Text>

          {/* Film age badge */}
          {film.filmAge != null && film.filmAge > 0 && (
            <View style={styles.ageBadge}>
              <Text style={styles.ageBadgeText}>
                Il y a {film.filmAge} ans
              </Text>
            </View>
          )}

          {/* Rating */}
          {film.rating != null && (
            <View style={styles.ratingRow}>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>{film.rating.toFixed(1)}</Text>
              </View>
            </View>
          )}

          {/* Letterboxd link */}
          {film.letterboxdUrl && (
            <Pressable onPress={handleLetterboxd} style={styles.letterboxdLink}>
              <Text style={styles.letterboxdText}>Voir sur Letterboxd</Text>
              <Ionicons name="open-outline" size={12} color="#D32F2F" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Genres */}
      {film.genres.length > 0 && (
        <View style={styles.genresRow}>
          {film.genres.map((genre) => (
            <View key={genre} style={styles.genrePill}>
              <Text style={styles.genreText}>{genre}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 14,
  },
  poster: {
    width: 100,
    height: 150,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(141,110,99,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 22,
    color: '#1A1A1A',
    lineHeight: 26,
  },
  meta: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 14,
    color: '#8D6E63',
    marginTop: 4,
  },
  ageBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: 'rgba(255,213,79,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,213,79,0.4)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ageBadgeText: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 11,
    color: '#8D6E63',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  ratingRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  ratingBadge: {
    backgroundColor: '#D32F2F',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD54F',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  ratingText: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 14,
    color: '#FFF8E1',
  },
  letterboxdLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  letterboxdText: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 13,
    color: '#D32F2F',
    textDecorationLine: 'underline',
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
  },
  genrePill: {
    backgroundColor: '#EFEBE9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(141,110,99,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  genreText: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 12,
    color: '#5D4037',
  },
});
