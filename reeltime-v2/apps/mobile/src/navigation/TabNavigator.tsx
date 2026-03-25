import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { FilmsScreen } from '../screens/FilmsScreen';

const Tab = createBottomTabNavigator();

export function TabNavigator() {
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
    </Tab.Navigator>
  );
}
