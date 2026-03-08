import { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import type { FilmListItem, ShowtimeEntry } from '../types';
import { FilmInfo } from './FilmInfo';
import { FilmShowtimes } from './FilmShowtimes';
import { showToast } from './Toast';
import { useWatchlist } from '../hooks/useWatchlist';
import { useAuthStore } from '../stores/useAuthStore';
import { AuthGateSheet, type PendingWatchlistAction } from './auth/AuthGateSheet';

interface FilmBottomSheetProps {
  film: FilmListItem | null;
  onClose: () => void;
}

export function FilmBottomSheet({ film, onClose }: FilmBottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['85%'], []);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isInWatchlist, findWatchlistItem, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingWatchlistAction | undefined>();

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose],
  );

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
          showToast('Erreur lors de l\'ajout');
        }
      }
    },
    [film, isAuthenticated, findWatchlistItem, addToWatchlist, removeFromWatchlist],
  );

  // Expand/close based on film prop
  useEffect(() => {
    if (film) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [film]);

  return (
    <>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onChange={handleSheetChanges}
        backgroundStyle={{ backgroundColor: '#FFF8E1', borderTopWidth: 3, borderTopColor: '#D32F2F', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
        handleIndicatorStyle={{ backgroundColor: '#D7CCC8', width: 40, height: 4, borderRadius: 2 }}
      >
        {film && (
          <BottomSheetScrollView>
            <FilmInfo film={film} />
            <FilmShowtimes
              showtimes={film.showtimes}
              filmTitle={film.title}
              filmPosterUrl={film.posterUrl}
              isInWatchlist={checkInWatchlist}
              onToggleWatchlist={handleToggleWatchlist}
            />
          </BottomSheetScrollView>
        )}
      </BottomSheet>

      <AuthGateSheet
        visible={showAuthGate}
        onClose={() => setShowAuthGate(false)}
        pendingAction={pendingAction}
      />
    </>
  );
}
