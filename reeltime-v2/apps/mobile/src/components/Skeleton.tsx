import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 12;
const CARD_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP) / 2;
const POSTER_HEIGHT = CARD_WIDTH * 1.5;

function PulsingView({ style }: { style: object }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={[style, { opacity }]} />;
}

export function FilmCardSkeleton() {
  return (
    <View style={styles.card}>
      <PulsingView style={styles.poster} />
      <View style={styles.info}>
        <PulsingView style={styles.titleLine} />
        <PulsingView style={styles.yearLine} />
      </View>
    </View>
  );
}

export function FilmGridSkeleton() {
  return (
    <View style={styles.grid}>
      {Array.from({ length: 8 }).map((_, i) => (
        <FilmCardSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#EFEBE9',
  },
  poster: {
    width: '100%',
    height: POSTER_HEIGHT,
    backgroundColor: 'rgba(141,110,99,0.15)',
  },
  info: {
    padding: 8,
    gap: 4,
  },
  titleLine: {
    width: '80%',
    height: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(141,110,99,0.15)',
  },
  yearLine: {
    width: '40%',
    height: 12,
    borderRadius: 4,
    backgroundColor: 'rgba(141,110,99,0.15)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    paddingHorizontal: CARD_PADDING,
    paddingTop: 12,
  },
});
