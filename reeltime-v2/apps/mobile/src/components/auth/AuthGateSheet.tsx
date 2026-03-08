import { useRef, useMemo, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RootStackParamList } from '../../navigation/RootNavigator';

const PENDING_WATCHLIST_KEY = '@reeltime/pendingWatchlistAction';

export interface PendingWatchlistAction {
  filmTitle: string;
  cinemaName: string;
  date: string;
  time: string;
  version: string;
  bookingUrl?: string;
  posterUrl?: string;
}

export async function savePendingAction(action: PendingWatchlistAction): Promise<void> {
  await AsyncStorage.setItem(PENDING_WATCHLIST_KEY, JSON.stringify(action));
}

export async function getPendingAction(): Promise<PendingWatchlistAction | null> {
  const raw = await AsyncStorage.getItem(PENDING_WATCHLIST_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingWatchlistAction;
  } catch {
    return null;
  }
}

export async function clearPendingAction(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_WATCHLIST_KEY);
}

interface AuthGateSheetProps {
  visible: boolean;
  onClose: () => void;
  pendingAction?: PendingWatchlistAction;
}

export function AuthGateSheet({ visible, onClose, pendingAction }: AuthGateSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['32%'], []);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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

  const handleNavigate = useCallback(
    async (screen: 'Login' | 'Register') => {
      if (pendingAction) {
        await savePendingAction(pendingAction);
      }
      onClose();
      bottomSheetRef.current?.close();
      navigation.navigate('Auth', { screen } as never);
    },
    [pendingAction, onClose, navigation],
  );

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onChange={handleSheetChanges}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Connectez-vous</Text>
        <Text style={styles.subtitle}>pour sauvegarder des seances</Text>

        <Pressable
          onPress={() => handleNavigate('Login')}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.primaryButtonText}>SE CONNECTER</Text>
        </Pressable>

        <Pressable
          onPress={() => handleNavigate('Register')}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>CREER UN COMPTE</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#FFF8E1',
  },
  handle: {
    backgroundColor: '#8D6E63',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 22,
    color: '#1A1A1A',
  },
  subtitle: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 16,
    color: '#8D6E63',
    marginTop: 4,
    marginBottom: 20,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#D32F2F',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 18,
    color: '#FFF8E1',
  },
  secondaryButton: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#8D6E63',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 18,
    color: '#8D6E63',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
