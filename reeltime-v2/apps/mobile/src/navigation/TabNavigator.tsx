import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { FilmsScreen } from '../screens/FilmsScreen';
import { WatchlistScreen } from '../screens/WatchlistScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useWatchlist } from '../hooks/useWatchlist';
import { useAuthStore } from '../stores/useAuthStore';

const Tab = createBottomTabNavigator();

function useCalendarBadge(): number | undefined {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { items } = useWatchlist();
  if (!isAuthenticated || items.length === 0) return undefined;
  return items.length;
}

export function TabNavigator() {
  const badgeCount = useCalendarBadge();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#D32F2F',
        tabBarInactiveTintColor: '#8D6E63',
        tabBarStyle: {
          backgroundColor: '#1A1A1A',
          borderTopColor: '#5D4037',
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontFamily: 'CrimsonText-Regular',
          fontSize: 11,
        },
      }}
    >
      <Tab.Screen
        name="Films"
        component={FilmsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="film-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Calendrier"
        component={WatchlistScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
          tabBarBadge: badgeCount,
          tabBarBadgeStyle: badgeCount
            ? {
                backgroundColor: '#D32F2F',
                fontFamily: 'BebasNeue-Regular',
                fontSize: 10,
                minWidth: 18,
                height: 18,
                lineHeight: 18,
              }
            : undefined,
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
