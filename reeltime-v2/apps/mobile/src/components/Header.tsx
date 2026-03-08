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
    height: 14,
    backgroundColor: '#1A1A1A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 4,
  },
  hole: {
    width: 8,
    height: 6,
    borderRadius: 2,
    backgroundColor: '#2A2A2A',
  },
});

export function Header() {
  return (
    <View>
      <FilmStripBorder />
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.emoji}>🎬</Text>
          <View>
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
    paddingVertical: 14,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emoji: {
    fontSize: 28,
  },
  title: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 30,
    color: '#FFF8E1',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 13,
    color: 'rgba(255,248,225,0.8)',
  },
  goldLine: {
    height: 2,
    backgroundColor: '#F9A825',
  },
});
