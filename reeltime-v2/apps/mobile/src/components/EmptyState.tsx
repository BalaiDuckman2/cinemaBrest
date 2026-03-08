import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  message?: string;
}

export function EmptyState({ message = 'Aucun film trouve pour cette semaine' }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="film-outline" size={48} color="rgba(141,110,99,0.4)" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  text: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 16,
    color: '#8D6E63',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
