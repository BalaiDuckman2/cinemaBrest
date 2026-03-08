import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorState({
  message = 'Impossible de charger les films',
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={48} color="#D32F2F" />
      <Text style={styles.text}>{message}</Text>
      <TouchableOpacity style={styles.button} onPress={onRetry}>
        <Text style={styles.buttonText}>Reessayer</Text>
      </TouchableOpacity>
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
    fontFamily: 'CrimsonText-Regular',
    fontSize: 15,
    color: '#8D6E63',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  button: {
    backgroundColor: '#D32F2F',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 8,
  },
  buttonText: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 16,
    color: '#FFF8E1',
    letterSpacing: 0.5,
  },
});
