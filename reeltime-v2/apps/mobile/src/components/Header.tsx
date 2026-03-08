import { View, Text, StyleSheet } from 'react-native';

function FilmStripBorder() {
  const holes = Array.from({ length: 20 });
  return (
    <View style={stripStyles.strip}>
      {holes.map((_, i) => (
        <View key={i} style={stripStyles.hole} />
      ))}
    </View>
  );
}

const stripStyles = StyleSheet.create({
  strip: {
    height: 12,
    backgroundColor: '#1A1A1A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 6,
  },
  hole: {
    width: 7,
    height: 5,
    borderRadius: 1.5,
    backgroundColor: '#333',
  },
});

export function Header() {
  return (
    <View>
      <FilmStripBorder />
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.emoji}>🎬</Text>
          <View style={styles.textContainer}>
            <Text style={styles.title}>REELTIME</Text>
            <Text style={styles.subtitle}>Vos seances cine en temps reel</Text>
          </View>
        </View>
      </View>
      <View style={styles.goldLine} />
      <FilmStripBorder />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textContainer: {
    flex: 1,
  },
  emoji: {
    fontSize: 26,
  },
  title: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 28,
    color: '#FFF8E1',
    letterSpacing: 3,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 12,
    color: 'rgba(255,248,225,0.7)',
    marginTop: -2,
  },
  goldLine: {
    height: 3,
    backgroundColor: '#F9A825',
  },
});
