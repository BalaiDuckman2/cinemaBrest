import { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { TabNavigator } from './TabNavigator';
import { AuthNavigator } from './AuthNavigator';
import { FilmDetailScreen } from '../screens/FilmDetailScreen';
import { useAuthStore } from '../stores/useAuthStore';
import { getPendingAction, clearPendingAction } from '../components/auth/AuthGateSheet';
import { apiClient } from '../services/api';
import { showToast } from '../components/Toast';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationBanner } from '../components/NotificationBanner';

export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
  Film: { filmId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- React Navigation linking config requires nested screens type
const linking: import('@react-navigation/native').LinkingOptions<any> = {
  prefixes: ['reeltime://', 'https://reeltime.app'],
  config: {
    screens: {
      Main: {
        screens: {
          Films: 'films',
          Calendrier: 'watchlist',
          Profil: 'profile',
        },
      },
      Film: 'film/:filmId',
      Auth: 'auth',
    },
  },
};

interface RootNavigatorProps {
  onReady?: () => void;
}

function RootNavigatorContent() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const pendingActionProcessed = useRef(false);
  const { banner, dismissBanner, navigateToFilm } = useNotifications();

  // Execute pending watchlist action after login
  useEffect(() => {
    if (!isAuthenticated || pendingActionProcessed.current) return;

    (async () => {
      const pending = await getPendingAction();
      if (!pending) return;
      pendingActionProcessed.current = true;

      try {
        await apiClient('/api/v1/me/watchlist', {
          method: 'POST',
          body: pending,
        });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('Ajoute au calendrier');
      } catch {
        // Silently fail - the user can add it again
      } finally {
        await clearPendingAction();
      }
    })();
  }, [isAuthenticated]);

  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="Film"
          component={FilmDetailScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
      {banner && (
        <NotificationBanner
          title={banner.title}
          body={banner.body}
          onPress={banner.filmId ? () => { navigateToFilm(banner.filmId!); dismissBanner(); } : undefined}
          onDismiss={dismissBanner}
        />
      )}
    </>
  );
}

export function RootNavigator({ onReady }: RootNavigatorProps) {
  const isLoading = useAuthStore((s) => s.isLoading);
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#FFF8E1',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#D32F2F" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking} onReady={onReady}>
      <RootNavigatorContent />
    </NavigationContainer>
  );
}
