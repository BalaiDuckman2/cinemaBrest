import { useCallback, useState } from 'react';
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
import * as Haptics from 'expo-haptics';
import { queryKeys } from '../services/queryKeys';
import { fetchFilmDetail } from '../api/filmsApi';
import { FilmInfo } from '../components/FilmInfo';
import { FilmShowtimes } from '../components/FilmShowtimes';
import { showToast } from '../components/Toast';
import { useWatchlist } from '../hooks/useWatchlist';
import { useAuthStore } from '../stores/useAuthStore';
import { AuthGateSheet, type PendingWatchlistAction } from '../components/auth/AuthGateSheet';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { ShowtimeEntry } from '../types';

export function FilmDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Film'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { filmId } = route.params;

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isInWatchlist, findWatchlistItem, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingWatchlistAction | undefined>();

  const { data: film, isLoading, isError } = useQuery({
    queryKey: queryKeys.films.detail(filmId),
    queryFn: () => fetchFilmDetail(filmId),
  });

  const checkInWatchlist = useCallback(
    (cinemaName: string, date: string, time: string): boolean => {
      if (!film) return false;
      return isInWatchlist(film.title, cinemaName, date, time);
    },
    [film, isInWatchlist],
  );

  const handleToggleWatchlist = useCallback(
    async (showtime: ShowtimeEntry) => {
      if (!film) return;

      if (!isAuthenticated) {
        setPendingAction({
          filmTitle: film.title,
          cinemaName: showtime.cinemaName,
          date: showtime.date,
          time: showtime.time,
          version: showtime.version,
          bookingUrl: showtime.bookingUrl ?? undefined,
          posterUrl: film.posterUrl ?? undefined,
        });
        setShowAuthGate(true);
        return;
      }

      const existing = findWatchlistItem(film.title, showtime.cinemaName, showtime.date, showtime.time);

      if (existing) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        await removeFromWatchlist(existing.id);
        showToast('Retire du calendrier');
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const success = await addToWatchlist({
          filmTitle: film.title,
          cinemaName: showtime.cinemaName,
          date: showtime.date,
          time: showtime.time,
          version: showtime.version,
          bookingUrl: showtime.bookingUrl ?? undefined,
          posterUrl: film.posterUrl ?? undefined,
        });
        if (success) {
          showToast('Ajoute au calendrier');
        } else {
          showToast("Erreur lors de l'ajout");
        }
      }
    },
    [film, isAuthenticated, findWatchlistItem, addToWatchlist, removeFromWatchlist],
  );

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
          <FilmShowtimes
            showtimes={film.showtimes}
            filmTitle={film.title}
            filmPosterUrl={film.posterUrl}
            isInWatchlist={checkInWatchlist}
            onToggleWatchlist={handleToggleWatchlist}
          />
        </ScrollView>
      )}

      <AuthGateSheet
        visible={showAuthGate}
        onClose={() => setShowAuthGate(false)}
        pendingAction={pendingAction}
      />
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
