import { useEffect, useRef, useCallback, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

interface InAppNotification {
  title: string;
  body: string;
  filmId?: string;
}

export function useNotifications() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const notificationListener = useRef<Notifications.EventSubscription>(undefined);
  const responseListener = useRef<Notifications.EventSubscription>(undefined);
  const [banner, setBanner] = useState<InAppNotification | null>(null);

  const dismissBanner = useCallback(() => setBanner(null), []);

  const navigateToFilm = useCallback(
    (filmId: string) => {
      navigation.navigate('Film', { filmId });
    },
    [navigation],
  );

  useEffect(() => {
    try {
      // Foreground notification - show in-app banner
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          const { title, body } = notification.request.content;
          const data = notification.request.content.data as
            | { filmId?: string }
            | undefined;

          setBanner({
            title: title ?? '',
            body: body ?? '',
            filmId: data?.filmId,
          });

          // Auto-dismiss after 5 seconds
          setTimeout(() => setBanner(null), 5000);
        });

      // Notification tap (background/killed)
      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data as
            | { filmId?: string }
            | undefined;
          if (data?.filmId) {
            navigateToFilm(data.filmId);
          }
        });
    } catch {
      // Notifications not available in Expo Go
    }

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [navigateToFilm]);

  return { banner, dismissBanner, navigateToFilm };
}
