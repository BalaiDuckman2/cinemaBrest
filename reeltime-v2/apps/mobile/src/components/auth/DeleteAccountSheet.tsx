import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { apiClient } from '../../services/api';
import { useAuthStore } from '../../stores/useAuthStore';

interface DeleteAccountSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function DeleteAccountSheet({ visible, onClose }: DeleteAccountSheetProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const logout = useAuthStore((s) => s.logout);

  const canDelete = confirmText === 'SUPPRIMER';

  const handleDelete = async () => {
    if (!canDelete) return;
    setIsDeleting(true);

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await apiClient<void>('/api/v1/me', {
        method: 'DELETE',
        body: { confirm: true },
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await logout();
      handleClose();
      Alert.alert('Compte supprime', 'Votre compte a ete supprime avec succes.');
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'Impossible de supprimer le compte. Veuillez reessayer.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(26, 26, 26, 0.6)',
          }}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={handleClose}
          />

          <View
            style={{
              backgroundColor: '#FFF8E1',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 24,
              paddingBottom: 40,
            }}
          >
            {/* Handle bar */}
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: '#D7CCC8',
                borderRadius: 2,
                alignSelf: 'center',
                marginBottom: 20,
              }}
            />

            <Text
              style={{
                fontFamily: 'PlayfairDisplay-Bold',
                fontSize: 22,
                color: '#D32F2F',
                marginBottom: 12,
              }}
            >
              Supprimer mon compte
            </Text>

            {/* Warning box */}
            <View
              style={{
                backgroundColor: '#FFEBEE',
                borderRadius: 8,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: '#FFCDD2',
              }}
            >
              <Text
                style={{
                  fontFamily: 'CrimsonText-Regular',
                  fontSize: 14,
                  color: '#1A1A1A',
                  lineHeight: 20,
                }}
              >
                Cette action est irreversible. Toutes vos donnees seront
                definitivement supprimees : profil, seances sauvegardees et
                alertes.
              </Text>
            </View>

            <Text
              style={{
                fontFamily: 'BebasNeue-Regular',
                fontSize: 12,
                color: '#8D6E63',
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              TAPEZ SUPPRIMER POUR CONFIRMER
            </Text>

            <TextInput
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder="SUPPRIMER"
              autoCapitalize="characters"
              autoCorrect={false}
              style={{
                backgroundColor: '#EFEBE9',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontFamily: 'CrimsonText-Regular',
                fontSize: 16,
                color: '#1A1A1A',
                borderWidth: 1,
                borderColor: '#D7CCC8',
                marginBottom: 20,
              }}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={handleClose}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  backgroundColor: '#EFEBE9',
                  borderRadius: 8,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'BebasNeue-Regular',
                    fontSize: 16,
                    color: '#8D6E63',
                    letterSpacing: 2,
                  }}
                >
                  ANNULER
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDelete}
                disabled={!canDelete || isDeleting}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  backgroundColor: '#D32F2F',
                  borderRadius: 8,
                  paddingVertical: 14,
                  alignItems: 'center',
                  opacity: canDelete && !isDeleting ? 1 : 0.4,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'BebasNeue-Regular',
                    fontSize: 16,
                    color: '#FFFFFF',
                    letterSpacing: 2,
                  }}
                >
                  {isDeleting ? 'SUPPRESSION...' : 'CONFIRMER'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
