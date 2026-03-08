import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NotificationBannerProps {
  title: string;
  body: string;
  onPress?: () => void;
  onDismiss: () => void;
}

export function NotificationBanner({
  title,
  body,
  onPress,
  onDismiss,
}: NotificationBannerProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        top: insets.top + 8,
        left: 12,
        right: 12,
        zIndex: 9999,
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={{
          backgroundColor: '#1A1A1A',
          borderRadius: 12,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Ionicons
          name="notifications"
          size={24}
          color="#FFD54F"
          style={{ marginRight: 12 }}
        />
        <View style={{ flex: 1 }}>
          {title ? (
            <Text
              style={{
                fontFamily: 'BebasNeue-Regular',
                fontSize: 14,
                color: '#FFD54F',
                letterSpacing: 0.5,
              }}
              numberOfLines={1}
            >
              {title}
            </Text>
          ) : null}
          {body ? (
            <Text
              style={{
                fontFamily: 'CrimsonText-Regular',
                fontSize: 14,
                color: '#FFFFFF',
                marginTop: 2,
              }}
              numberOfLines={2}
            >
              {body}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={onDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ marginLeft: 8 }}
        >
          <Ionicons name="close" size={20} color="#8D6E63" />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}
