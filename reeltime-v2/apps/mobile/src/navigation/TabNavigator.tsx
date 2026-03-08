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
        tabBarActiveTintColor: '#FFD54F',
        tabBarInactiveTintColor: 'rgba(141,110,99,0.6)',
        tabBarStyle: {
          backgroundColor: '#1A1A1A',
          borderTopColor: 'rgba(93,64,55,0.4)',
          borderTopWidth: 1,
          height: 56,
          paddingBottom: 4,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontFamily: 'BebasNeue-Regular',
          fontSize: 11,
          letterSpacing: 0.5,
        },
      }}
    >
      <Tab.Screen
        name="Films"
        component={FilmsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'film' : 'film-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Calendrier"
        component={WatchlistScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />
          ),
          tabBarBadge: badgeCount,
          tabBarBadgeStyle: badgeCount
            ? {
                backgroundColor: '#D32F2F',
                color: '#FFF8E1',
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
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
