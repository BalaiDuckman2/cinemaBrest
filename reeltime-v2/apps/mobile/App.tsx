import './global.css';

import { useEffect, useCallback } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootNavigator } from './src/navigation';
import { ToastContainer } from './src/components/Toast';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
    },
  },
});

export default function App() {
  const [fontsLoaded] = useFonts({
    'BebasNeue-Regular': require('./assets/fonts/BebasNeue-Regular.ttf'),
    'PlayfairDisplay-Regular': require('./assets/fonts/PlayfairDisplay-Regular.ttf'),
    'PlayfairDisplay-SemiBold': require('./assets/fonts/PlayfairDisplay-SemiBold.ttf'),
    'PlayfairDisplay-Bold': require('./assets/fonts/PlayfairDisplay-Bold.ttf'),
    'CrimsonText-Regular': require('./assets/fonts/CrimsonText-Regular.ttf'),
    'CrimsonText-Italic': require('./assets/fonts/CrimsonText-Italic.ttf'),
    'CrimsonText-SemiBold': require('./assets/fonts/CrimsonText-SemiBold.ttf'),
  });

  const hideSplash = useCallback(async () => {
    try {
      await SplashScreen.hideAsync();
    } catch {
      // Splash screen already hidden
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      hideSplash();
    }
  }, [fontsLoaded, hideSplash]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigator onReady={hideSplash} />
      <ToastContainer />
      <StatusBar style="light" />
    </QueryClientProvider>
  );
}
