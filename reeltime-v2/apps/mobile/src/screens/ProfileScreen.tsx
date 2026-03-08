import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useAuthStore } from '../stores/useAuthStore';
import { useAlerts, type AlertItem } from '../hooks/useAlerts';
import { DeleteAccountSheet } from '../components/auth/DeleteAccountSheet';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);

  function handleLogout() {
    Alert.alert(
      'Deconnexion',
      'Etes-vous sur de vouloir vous deconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se deconnecter',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await logout();
          },
        },
      ],
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.unauthContainer}>
          <View style={styles.unauthIconBg}>
            <Ionicons name="person-outline" size={40} color="#D32F2F" />
          </View>
          <Text style={styles.unauthTitle}>Connectez-vous</Text>
          <Text style={styles.unauthSubtitle}>
            Accedez a votre calendrier et vos films sauvegardes
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Auth')}
            activeOpacity={0.8}
            style={styles.authButton}
          >
            <Text style={styles.authButtonText}>SE CONNECTER</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(user.name ?? user.email)[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileName}>{user.name ?? 'Cinephile'}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <InfoRow icon="mail-outline" label="EMAIL" value={user.email} />
          <View style={styles.divider} />
          <InfoRow icon="person-outline" label="NOM" value={user.name ?? 'Non renseigne'} />
          <View style={styles.divider} />
          <InfoRow icon="calendar-outline" label="MEMBRE DEPUIS" value={formatDate(user.createdAt)} />
        </View>

        {/* Alerts section */}
        <AlertsSection />

        {/* Bottom actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.8}
            style={styles.logoutButton}
          >
            <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
            <Text style={styles.logoutButtonText}>SE DECONNECTER</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowDeleteSheet(true)}
            activeOpacity={0.8}
            style={styles.deleteLink}
          >
            <Text style={styles.deleteLinkText}>Supprimer mon compte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <DeleteAccountSheet
        visible={showDeleteSheet}
        onClose={() => setShowDeleteSheet(false)}
      />
    </SafeAreaView>
  );
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

function statusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case 'active':
      return { bg: '#E8F5E9', text: '#2E7D32' };
    case 'triggered':
      return { bg: '#FFF8E1', text: '#F57F17' };
    case 'expired':
      return { bg: '#EFEBE9', text: '#8D6E63' };
    default:
      return { bg: '#EFEBE9', text: '#8D6E63' };
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Actif';
    case 'triggered':
      return 'Declenche';
    case 'expired':
      return 'Expire';
    default:
      return status;
  }
}

function AlertsSection() {
  const { alerts, isLoading, deleteAlert } = useAlerts();

  function handleDelete(alert: AlertItem) {
    Alert.alert(
      'Supprimer cette alerte ?',
      `L'alerte pour "${alert.filmTitle}" sera supprimee.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            try {
              await deleteAlert(alert.id);
            } catch {
              Alert.alert('Erreur', "Impossible de supprimer l'alerte.");
            }
          },
        },
      ],
    );
  }

  const activeCount = alerts.filter((a) => a.status === 'active').length;

  return (
    <View style={alertStyles.container}>
      <View style={alertStyles.headerRow}>
        <View style={alertStyles.headerLeft}>
          <Ionicons name="notifications-outline" size={20} color="#D32F2F" />
          <Text style={alertStyles.headerTitle}>Mes alertes</Text>
        </View>
        {activeCount > 0 && (
          <View style={alertStyles.badge}>
            <Text style={alertStyles.badgeText}>{activeCount}</Text>
          </View>
        )}
      </View>

      {isLoading && (
        <View style={alertStyles.loadingContainer}>
          <ActivityIndicator size="small" color="#D32F2F" />
        </View>
      )}

      {!isLoading && alerts.length === 0 && (
        <View style={alertStyles.emptyCard}>
          <Ionicons name="notifications-off-outline" size={28} color="rgba(141,110,99,0.4)" />
          <Text style={alertStyles.emptyText}>Aucune alerte configuree</Text>
        </View>
      )}

      {!isLoading &&
        alerts.map((alert) => {
          const colors = statusColor(alert.status);
          const chips: string[] = [];
          if (alert.criteria.cinemaId) chips.push(alert.criteria.cinemaId);
          if (alert.criteria.version) chips.push(alert.criteria.version);
          if (alert.criteria.minTime) chips.push(`>= ${alert.criteria.minTime}`);

          return (
            <View key={alert.id} style={alertStyles.alertCard}>
              <View style={alertStyles.alertHeader}>
                <Text style={alertStyles.alertTitle} numberOfLines={1}>
                  {alert.filmTitle}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDelete(alert)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={alertStyles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={16} color="#D32F2F" />
                </TouchableOpacity>
              </View>
              <View style={alertStyles.chipsRow}>
                <View style={[alertStyles.statusChip, { backgroundColor: colors.bg }]}>
                  <Text style={[alertStyles.chipText, { color: colors.text }]}>
                    {statusLabel(alert.status)}
                  </Text>
                </View>
                {chips.map((chip) => (
                  <View key={chip} style={alertStyles.criteriaChip}>
                    <Text style={alertStyles.criteriaChipText}>{chip}</Text>
                  </View>
                ))}
                <Text style={alertStyles.dateText}>
                  {formatShortDate(alert.createdAt)}
                </Text>
              </View>
            </View>
          );
        })}
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color="#8D6E63" style={styles.infoIcon} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8E1',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  // Unauthenticated state
  unauthContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  unauthIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(211,47,47,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  unauthTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 24,
    color: '#1A1A1A',
    textAlign: 'center',
  },
  unauthSubtitle: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 16,
    color: '#8D6E63',
    textAlign: 'center',
    lineHeight: 22,
  },
  authButton: {
    backgroundColor: '#D32F2F',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 16,
  },
  authButtonText: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 18,
    color: '#FFF8E1',
    letterSpacing: 2,
  },
  // Profile header
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#FFD54F',
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarText: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 30,
    color: '#FFF8E1',
  },
  profileName: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 22,
    color: '#1A1A1A',
  },
  profileEmail: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 14,
    color: '#8D6E63',
    marginTop: 2,
  },
  // Info card
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(215,204,200,0.6)',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 11,
    color: '#8D6E63',
    letterSpacing: 1,
    marginBottom: 2,
  },
  infoValue: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 16,
    color: '#1A1A1A',
  },
  divider: {
    height: 1,
    backgroundColor: '#EFEBE9',
    marginVertical: 14,
  },
  // Actions
  actionsContainer: {
    marginTop: 16,
    gap: 12,
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D32F2F',
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  logoutButtonText: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 18,
    color: '#D32F2F',
    letterSpacing: 2,
  },
  deleteLink: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteLinkText: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 14,
    color: '#8D6E63',
    textDecorationLine: 'underline',
  },
});

const alertStyles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 18,
    color: '#1A1A1A',
  },
  badge: {
    backgroundColor: '#D32F2F',
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 12,
    color: '#FFF8E1',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(215,204,200,0.6)',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 14,
    color: '#8D6E63',
    textAlign: 'center',
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(215,204,200,0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  alertTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 15,
    color: '#1A1A1A',
    flex: 1,
  },
  deleteButton: {
    marginLeft: 8,
    padding: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
    flexWrap: 'wrap',
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  chipText: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  criteriaChip: {
    backgroundColor: '#EFEBE9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  criteriaChipText: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 10,
    color: '#5D4037',
    letterSpacing: 0.5,
  },
  dateText: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 11,
    color: '#8D6E63',
    marginLeft: 'auto',
  },
});
