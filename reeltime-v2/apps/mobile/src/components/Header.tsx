import { View, Text, StyleSheet } from 'react-native';

export function Header() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🎬</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>REELTIME</Text>
          <Text style={styles.subtitle}>Vos seances cine en temps reel</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#FFD54F',
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
    fontSize: 22,
  },
  title: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 24,
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
});
