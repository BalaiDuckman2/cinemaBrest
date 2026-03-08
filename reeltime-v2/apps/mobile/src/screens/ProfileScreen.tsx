import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
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

  // Not authenticated - show login prompt
  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF8E1' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Ionicons name="person-circle-outline" size={80} color="#8D6E63" />
          <Text
            style={{
              fontFamily: 'PlayfairDisplay-SemiBold',
              fontSize: 22,
              color: '#1A1A1A',
              marginTop: 16,
              textAlign: 'center',
            }}
          >
            Connectez-vous
          </Text>
          <Text
            style={{
              fontFamily: 'CrimsonText-Regular',
              fontSize: 16,
              color: '#8D6E63',
              marginTop: 8,
              textAlign: 'center',
              lineHeight: 22,
            }}
          >
            Accedez a votre calendrier et vos films sauvegardes
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Auth')}
            activeOpacity={0.8}
            style={{
              backgroundColor: '#D32F2F',
              borderRadius: 8,
              paddingVertical: 14,
              paddingHorizontal: 40,
              marginTop: 24,
            }}
          >
            <Text
              style={{
                fontFamily: 'BebasNeue-Regular',
                fontSize: 18,
                color: '#FFFFFF',
                letterSpacing: 2,
              }}
            >
              SE CONNECTER
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Authenticated - show profile + alerts
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF8E1' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginTop: 4, marginBottom: 24 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: '#D32F2F',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontFamily: 'PlayfairDisplay-Bold',
                fontSize: 28,
                color: '#FFFFFF',
              }}
            >
              {(user.name ?? user.email)[0].toUpperCase()}
            </Text>
          </View>
          <Text
            style={{
              fontFamily: 'PlayfairDisplay-Bold',
              fontSize: 22,
              color: '#1A1A1A',
            }}
          >
            {user.name ?? 'Cinephile'}
          </Text>
        </View>

        {/* Info card */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 20,
            borderWidth: 1,
            borderColor: '#D7CCC8',
            marginBottom: 24,
          }}
        >
          <InfoRow label="EMAIL" value={user.email} />
          <View style={{ height: 1, backgroundColor: '#EFEBE9', marginVertical: 14 }} />
          <InfoRow label="NOM" value={user.name ?? 'Non renseigne'} />
          <View style={{ height: 1, backgroundColor: '#EFEBE9', marginVertical: 14 }} />
          <InfoRow label="MEMBRE DEPUIS" value={formatDate(user.createdAt)} />
        </View>

        {/* Alerts section */}
        <AlertsSection />

        {/* Bottom actions */}
        <View style={{ marginTop: 16, gap: 12 }}>
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.8}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 8,
              borderWidth: 2,
              borderColor: '#D32F2F',
              paddingVertical: 14,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
            <Text
              style={{
                fontFamily: 'BebasNeue-Regular',
                fontSize: 18,
                color: '#D32F2F',
                letterSpacing: 2,
              }}
            >
              SE DECONNECTER
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowDeleteSheet(true)}
            activeOpacity={0.8}
            style={{
              paddingVertical: 10,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: 'CrimsonText-Regular',
                fontSize: 14,
                color: '#8D6E63',
                textDecorationLine: 'underline',
              }}
            >
              Supprimer mon compte
            </Text>
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
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
        <Ionicons name="notifications-outline" size={22} color="#1A1A1A" />
        <Text style={{ fontFamily: 'PlayfairDisplay-SemiBold', fontSize: 18, color: '#1A1A1A' }}>
          Mes alertes
        </Text>
        {activeCount > 0 && (
          <View
            style={{
              backgroundColor: '#D32F2F',
              borderRadius: 10,
              minWidth: 20,
              height: 20,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 6,
            }}
          >
            <Text style={{ fontFamily: 'BebasNeue-Regular', fontSize: 12, color: '#FFFFFF' }}>
              {activeCount}
            </Text>
          </View>
        )}
      </View>

      {isLoading && (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#D32F2F" />
        </View>
      )}

      {!isLoading && alerts.length === 0 && (
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 20,
            borderWidth: 1,
            borderColor: '#D7CCC8',
            alignItems: 'center',
          }}
        >
          <Ionicons name="notifications-off-outline" size={32} color="#8D6E63" />
          <Text
            style={{
              fontFamily: 'CrimsonText-Regular',
              fontSize: 14,
              color: '#8D6E63',
              marginTop: 8,
              textAlign: 'center',
            }}
          >
            Aucune alerte configuree
          </Text>
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
            <View
              key={alert.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 14,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: '#D7CCC8',
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontFamily: 'PlayfairDisplay-SemiBold', fontSize: 15, color: '#1A1A1A' }}
                    numberOfLines={1}
                  >
                    {alert.filmTitle}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(alert)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ marginLeft: 8 }}
                >
                  <Ionicons name="trash-outline" size={18} color="#D32F2F" />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6, flexWrap: 'wrap' }}>
                <View style={{ backgroundColor: colors.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ fontFamily: 'BebasNeue-Regular', fontSize: 10, color: colors.text, letterSpacing: 0.5 }}>
                    {statusLabel(alert.status)}
                  </Text>
                </View>
                {chips.map((chip) => (
                  <View key={chip} style={{ backgroundColor: '#EFEBE9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                    <Text style={{ fontFamily: 'BebasNeue-Regular', fontSize: 10, color: '#5D4037', letterSpacing: 0.5 }}>
                      {chip}
                    </Text>
                  </View>
                ))}
                <Text style={{ fontFamily: 'CrimsonText-Regular', fontSize: 11, color: '#8D6E63', marginLeft: 'auto' }}>
                  {formatShortDate(alert.createdAt)}
                </Text>
              </View>
            </View>
          );
        })}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text
        style={{
          fontFamily: 'BebasNeue-Regular',
          fontSize: 12,
          color: '#8D6E63',
          letterSpacing: 1,
          marginBottom: 4,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: 'CrimsonText-Regular',
          fontSize: 16,
          color: '#1A1A1A',
        }}
      >
        {value}
      </Text>
    </View>
  );
}
