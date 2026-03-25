import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { queryKeys } from '../services/queryKeys';
import { fetchFilmDetail } from '../api/filmsApi';
import { FilmInfo } from '../components/FilmInfo';
import { FilmShowtimes } from '../components/FilmShowtimes';
import type { RootStackParamList } from '../navigation/RootNavigator';

export function FilmDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Film'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { filmId } = route.params;

  const { data: film, isLoading, isError } = useQuery({
    queryKey: queryKeys.films.detail(filmId),
    queryFn: () => fetchFilmDetail(filmId),
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Vintage header with close button */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="close" size={24} color="#FFF8E1" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {film?.title ?? 'Film'}
        </Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.headerGoldLine} />

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D32F2F" />
        </View>
      )}

      {isError && (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#D32F2F" />
          <Text style={styles.errorText}>Film introuvable</Text>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </Pressable>
        </View>
      )}

      {film && (
        <ScrollView>
          <FilmInfo film={film} />
          <FilmShowtimes showtimes={film.showtimes} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#D32F2F',
  },
  headerGoldLine: {
    height: 2,
    backgroundColor: '#F9A825',
  },
  headerTitle: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 18,
    color: '#FFF8E1',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
    letterSpacing: 0.5,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  errorText: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 16,
    color: '#8D6E63',
  },
  backButton: {
    backgroundColor: '#D32F2F',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButtonText: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 16,
    color: '#FFF8E1',
    letterSpacing: 0.5,
  },
});
