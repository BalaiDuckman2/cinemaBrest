import { useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  SectionList,
  Pressable,
  Image,
  Linking,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useWatchlist, type WatchlistItem } from '../hooks/useWatchlist';
import { useAuthStore } from '../stores/useAuthStore';
import { EmptyState } from '../components/EmptyState';
import { showToast } from '../components/Toast';

const DAYS_FR_FULL = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS_FR_FULL = [
  'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
];

function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return `${DAYS_FR_FULL[date.getDay()]} ${date.getDate()} ${MONTHS_FR_FULL[date.getMonth()]}`;
}

const VERSION_COLORS: Record<string, { bg: string; text: string }> = {
  VF: { bg: 'rgba(211,47,47,0.15)', text: '#D32F2F' },
  VO: { bg: 'rgba(255,213,79,0.2)', text: '#1A1A1A' },
  VOST: { bg: 'rgba(141,110,99,0.15)', text: '#8D6E63' },
};

interface Section {
  title: string;
  data: WatchlistItem[];
}

function groupByDate(items: WatchlistItem[]): Section[] {
  const groups: Record<string, WatchlistItem[]> = {};
  for (const item of items) {
    if (!groups[item.date]) groups[item.date] = [];
    groups[item.date].push(item);
  }

  return Object.keys(groups)
    .sort()
    .map((date) => ({
      title: formatDateLong(date),
      data: groups[date].sort((a, b) => a.time.localeCompare(b.time)),
    }));
}

function WatchlistItemRow({
  item,
  onRemove,
}: {
  item: WatchlistItem;
  onRemove: (id: string) => void;
}) {
  const swipeableRef = useRef<Swipeable>(null);
  const colors = VERSION_COLORS[item.version] ?? { bg: 'rgba(239,235,233,0.5)', text: '#1A1A1A' };

  const handlePress = () => {
    if (item.bookingUrl) {
      Linking.openURL(item.bookingUrl).catch(() => {});
    }
  };

  const handleRemove = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    swipeableRef.current?.close();
    onRemove(item.id);
  };

  const renderRightActions = (_progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const translateX = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
      extrapolate: 'clamp',
    });
    return (
      <Animated.View style={[styles.deleteAction, { transform: [{ translateX }] }]}>
        <Pressable onPress={handleRemove} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={22} color="#FFF8E1" />
          <Text style={styles.deleteText}>SUPPRIMER</Text>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} overshootRight={false}>
      <Pressable
        onPress={handlePress}
        disabled={!item.bookingUrl}
        style={({ pressed }) => [styles.itemRow, pressed && styles.itemPressed]}
      >
        {item.posterUrl ? (
          <Image
            source={{ uri: item.posterUrl }}
            style={styles.poster}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.poster, styles.posterPlaceholder]}>
            <Ionicons name="film-outline" size={20} color="#8D6E63" />
          </View>
        )}
        <View style={styles.itemContent}>
          <Text style={styles.filmTitle} numberOfLines={1}>
            {item.filmTitle}
          </Text>
          <Text style={styles.cinemaName} numberOfLines={1}>
            {item.cinemaName}
          </Text>
          <View style={styles.timeRow}>
            <Text style={styles.time}>{item.time}</Text>
            <View style={[styles.versionBadge, { backgroundColor: colors.bg }]}>
              <Text style={[styles.versionText, { color: colors.text }]}>
                {item.version}
              </Text>
            </View>
          </View>
        </View>
        {item.bookingUrl && (
          <Ionicons name="open-outline" size={16} color="#8D6E63" style={styles.linkIcon} />
        )}
      </Pressable>
    </Swipeable>
  );
}

function UnauthenticatedState() {
  const navigation = useNavigation<BottomTabNavigationProp<Record<string, undefined>>>();

  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={48} color="rgba(141,110,99,0.4)" />
      <Text style={styles.emptyTitle}>Mon Calendrier</Text>
      <Text style={styles.emptySubtitle}>
        Connectez-vous pour sauvegarder des seances
      </Text>
      <Pressable
        onPress={() => {
          const nav = navigation.getParent();
          nav?.navigate('Auth' as never);
        }}
        style={({ pressed }) => [styles.authButton, pressed && styles.authButtonPressed]}
      >
        <Text style={styles.authButtonText}>SE CONNECTER</Text>
      </Pressable>
    </View>
  );
}

export function WatchlistScreen() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { items, isLoading, removeWithUndo, refetch, isRefetching } = useWatchlist();
  const navigation = useNavigation<BottomTabNavigationProp<Record<string, undefined>>>();

  const sections = useMemo(() => groupByDate(items), [items]);

  const handleRemove = useCallback(
    (id: string) => {
      const undo = removeWithUndo(id);
      showToast('Retire du calendrier', undo);
    },
    [removeWithUndo],
  );

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <UnauthenticatedState />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D32F2F" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>MON CALENDRIER</Text>
          <Text style={styles.headerSubtitle}>
            {items.length} {items.length === 1 ? 'seance' : 'seances'}
          </Text>
        </View>

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <WatchlistItemRow item={item} onRemove={handleRemove} />
          )}
          ListEmptyComponent={
            <EmptyState message="Votre calendrier est vide. Appuyez longtemps sur une seance pour l'ajouter." />
          }
          contentContainerStyle={sections.length === 0 ? styles.emptyList : undefined}
          onRefresh={refetch}
          refreshing={isRefetching}
          stickySectionHeadersEnabled
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8E1',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#F9A825',
    backgroundColor: '#D32F2F',
  },
  headerTitle: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 26,
    color: '#FFF8E1',
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 13,
    color: 'rgba(255,248,225,0.7)',
    marginTop: 2,
  },
  sectionHeader: {
    backgroundColor: '#EFEBE9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(141,110,99,0.12)',
  },
  sectionTitle: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 14,
    color: '#D32F2F',
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF8E1',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239,235,233,0.5)',
  },
  itemPressed: {
    backgroundColor: 'rgba(239,235,233,0.5)',
  },
  poster: {
    width: 48,
    height: 72,
    borderRadius: 6,
    backgroundColor: 'rgba(239,235,233,0.5)',
  },
  posterPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
  },
  filmTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 16,
    color: '#1A1A1A',
  },
  cinemaName: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 13,
    color: '#8D6E63',
    marginTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  time: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 18,
    color: '#1A1A1A',
  },
  versionBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  versionText: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 11,
  },
  linkIcon: {
    marginLeft: 8,
  },
  deleteAction: {
    width: 80,
    backgroundColor: '#D32F2F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 11,
    color: '#FFF8E1',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 32,
    color: '#1A1A1A',
  },
  emptySubtitle: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 16,
    color: '#8D6E63',
    textAlign: 'center',
  },
  emptyList: {
    flexGrow: 1,
  },
  authButton: {
    backgroundColor: '#D32F2F',
    borderRadius: 10,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 16,
  },
  authButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  authButtonText: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 18,
    color: '#FFF8E1',
  },
});
