// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    clear: jest.fn(() => Promise.resolve()),
  },
  __esModule: true,
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
  NotificationFeedbackType: { Success: 'Success', Warning: 'Warning', Error: 'Error' },
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'undetermined' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'ExponentPushToken[mock]' })),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  AndroidImportance: { MAX: 5 },
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
  default: {
    call: jest.fn(),
    createAnimatedComponent: jest.fn((component: unknown) => component),
  },
  useSharedValue: jest.fn((init: unknown) => ({ value: init })),
  useAnimatedStyle: jest.fn(() => ({})),
  withTiming: jest.fn((val: unknown) => val),
  withSpring: jest.fn((val: unknown) => val),
}));

// Mock @gorhom/bottom-sheet
jest.mock('@gorhom/bottom-sheet', () => ({
  default: 'BottomSheet',
  BottomSheetView: 'BottomSheetView',
  BottomSheetScrollView: 'BottomSheetScrollView',
  BottomSheetBackdrop: 'BottomSheetBackdrop',
}));

// Mock react-native
jest.mock('react-native', () => ({
  Platform: { OS: 'ios', select: jest.fn((obj: Record<string, unknown>) => obj.ios) },
  Dimensions: { get: jest.fn(() => ({ width: 375, height: 812 })) },
  StyleSheet: { create: jest.fn((styles: unknown) => styles) },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  Image: 'Image',
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
  ActivityIndicator: 'ActivityIndicator',
}));

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  })),
  useRoute: jest.fn(() => ({
    params: {},
  })),
}));
