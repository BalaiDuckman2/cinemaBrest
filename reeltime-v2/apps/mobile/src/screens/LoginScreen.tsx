import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../stores/useAuthStore';
import { apiClient, ApiError } from '../services/api';
import { getPendingAction, clearPendingAction } from '../components/auth/AuthGateSheet';
import { showToast } from '../components/Toast';
import type { AuthStackParamList } from '../navigation/AuthNavigator';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const login = useAuthStore((s) => s.login);
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  async function handleSubmit() {
    if (!canSubmit || submitting) return;

    setError('');
    setSubmitting(true);

    try {
      await login(email.trim(), password);

      // Execute pending watchlist action if any
      const pendingAction = await getPendingAction();
      if (pendingAction) {
        try {
          await apiClient('/api/v1/me/watchlist', {
            method: 'POST',
            body: pendingAction,
          });
          await clearPendingAction();
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showToast('Ajoute au calendrier');
        } catch {
          await clearPendingAction();
        }
      }

      rootNavigation.goBack();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'INVALID_CREDENTIALS') {
          setError('Email ou mot de passe incorrect');
        } else if (err.status === 429) {
          setError('Trop de tentatives. Reessayez plus tard.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Erreur de connexion. Verifiez votre reseau.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF8E1' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <Text
              style={{
                fontFamily: 'PlayfairDisplay-Bold',
                fontSize: 32,
                color: '#1A1A1A',
                textAlign: 'center',
              }}
            >
              Connexion
            </Text>
            <Text
              style={{
                fontFamily: 'CrimsonText-Regular',
                fontSize: 16,
                color: '#8D6E63',
                marginTop: 8,
                textAlign: 'center',
              }}
            >
              Retrouvez votre compte ReelTime
            </Text>
          </View>

          {/* Error message */}
          {error ? (
            <View
              style={{
                backgroundColor: '#FFEBEE',
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: '#FFCDD2',
              }}
            >
              <Text
                style={{
                  fontFamily: 'CrimsonText-Regular',
                  fontSize: 14,
                  color: '#C62828',
                  textAlign: 'center',
                }}
              >
                {error}
              </Text>
            </View>
          ) : null}

          {/* Email */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontFamily: 'BebasNeue-Regular',
                fontSize: 14,
                color: '#5D4037',
                marginBottom: 6,
                letterSpacing: 1,
              }}
            >
              EMAIL
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="votre@email.com"
              placeholderTextColor="#8D6E63"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                fontFamily: 'CrimsonText-Regular',
                fontSize: 16,
                color: '#1A1A1A',
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#D7CCC8',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            />
          </View>

          {/* Password */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontFamily: 'BebasNeue-Regular',
                fontSize: 14,
                color: '#5D4037',
                marginBottom: 6,
                letterSpacing: 1,
              }}
            >
              MOT DE PASSE
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Votre mot de passe"
              placeholderTextColor="#8D6E63"
              secureTextEntry
              style={{
                fontFamily: 'CrimsonText-Regular',
                fontSize: 16,
                color: '#1A1A1A',
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#D7CCC8',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            />
          </View>

          {/* Submit button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!canSubmit || submitting}
            activeOpacity={0.8}
            style={{
              backgroundColor: canSubmit ? '#D32F2F' : '#BDBDBD',
              borderRadius: 8,
              paddingVertical: 14,
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
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
            )}
          </TouchableOpacity>

          {/* Register link */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={{ alignItems: 'center' }}
          >
            <Text
              style={{
                fontFamily: 'CrimsonText-Regular',
                fontSize: 15,
                color: '#8D6E63',
              }}
            >
              Pas de compte ?{' '}
              <Text style={{ color: '#D32F2F', fontFamily: 'CrimsonText-SemiBold' }}>
                S'inscrire
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
