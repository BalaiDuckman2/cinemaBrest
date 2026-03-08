import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiClient } from './api';

// Configure how notifications are shown when the app is in the foreground
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // expo-notifications not available in Expo Go SDK 53+
}

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.warn('Push notifications require a physical device');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    // Android: configure notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('alertes-films', {
        name: 'Alertes films',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D32F2F',
      });
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: projectId ?? undefined,
    });

    return token.data;
  } catch {
    console.warn('Push notifications not available in this environment');
    return null;
  }
}

export async function sendTokenToServer(token: string): Promise<void> {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';

  try {
    await apiClient('/api/v1/me/devices', {
      method: 'POST',
      body: { token, platform },
    });
  } catch {
    // Non-blocking: token registration failure shouldn't disrupt the app
    console.warn('Failed to register device token with server');
  }
}

export async function registerAndSendPushToken(): Promise<void> {
  const token = await registerForPushNotifications();
  if (token) {
    await sendTokenToServer(token);
  }
}
