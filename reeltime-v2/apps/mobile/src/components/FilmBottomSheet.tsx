import { useRef, useCallback, useMemo, useEffect } from 'react';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import type { FilmListItem } from '../types';
import { FilmInfo } from './FilmInfo';
import { FilmShowtimes } from './FilmShowtimes';

interface FilmBottomSheetProps {
  film: FilmListItem | null;
  onClose: () => void;
}

export function FilmBottomSheet({ film, onClose }: FilmBottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['85%'], []);

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

  // Expand/close based on film prop
  useEffect(() => {
    if (film) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [film]);

  return (
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
          <FilmShowtimes showtimes={film.showtimes} />
        </BottomSheetScrollView>
      )}
    </BottomSheet>
  );
}
