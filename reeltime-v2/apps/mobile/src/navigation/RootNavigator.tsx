import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { FilmDetailScreen } from '../screens/FilmDetailScreen';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationBanner } from '../components/NotificationBanner';

export type RootStackParamList = {
  Main: undefined;
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
        },
      },
      Film: 'film/:filmId',
    },
  },
};

interface RootNavigatorProps {
  onReady?: () => void;
}

function RootNavigatorContent() {
  const { banner, dismissBanner, navigateToFilm } = useNotifications();

  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
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
  return (
    <NavigationContainer linking={linking} onReady={onReady}>
      <RootNavigatorContent />
    </NavigationContainer>
  );
}
