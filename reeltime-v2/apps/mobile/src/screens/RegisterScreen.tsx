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

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterScreen({ navigation }: Props) {
  const register = useAuthStore((s) => s.register);
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Inline validation state
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const emailError = emailTouched && email.trim() && !EMAIL_REGEX.test(email.trim())
    ? 'Format email invalide'
    : '';
  const passwordError = passwordTouched && password && password.length < 8
    ? '8 caracteres minimum'
    : '';

  const canSubmit =
    EMAIL_REGEX.test(email.trim()) &&
    password.length >= 8 &&
    !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;

    setError('');
    setSubmitting(true);

    try {
      await register(email.trim(), password, name.trim() || undefined);

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
        if (err.code === 'EMAIL_ALREADY_EXISTS') {
          setError('Cette adresse email est deja utilisee');
        } else if (err.code === 'VALIDATION_ERROR' && err.details?.length) {
          setError(err.details.map((d) => d.message).join('. '));
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
              Inscription
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
              Creez votre compte ReelTime
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

          {/* Name (optional) */}
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
              NOM (OPTIONNEL)
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Votre nom"
              placeholderTextColor="#8D6E63"
              autoCapitalize="words"
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
              onBlur={() => setEmailTouched(true)}
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
                borderColor: emailError ? '#C62828' : '#D7CCC8',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            />
            {emailError ? (
              <Text
                style={{
                  fontFamily: 'CrimsonText-Regular',
                  fontSize: 13,
                  color: '#C62828',
                  marginTop: 4,
                }}
              >
                {emailError}
              </Text>
            ) : null}
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
              onBlur={() => setPasswordTouched(true)}
              placeholder="8 caracteres minimum"
              placeholderTextColor="#8D6E63"
              secureTextEntry
              style={{
                fontFamily: 'CrimsonText-Regular',
                fontSize: 16,
                color: '#1A1A1A',
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: passwordError ? '#C62828' : '#D7CCC8',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            />
            {passwordError ? (
              <Text
                style={{
                  fontFamily: 'CrimsonText-Regular',
                  fontSize: 13,
                  color: '#C62828',
                  marginTop: 4,
                }}
              >
                {passwordError}
              </Text>
            ) : null}
          </View>

          {/* Submit button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!canSubmit}
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
                S'INSCRIRE
              </Text>
            )}
          </TouchableOpacity>

          {/* Login link */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={{ alignItems: 'center' }}
          >
            <Text
              style={{
                fontFamily: 'CrimsonText-Regular',
                fontSize: 15,
                color: '#8D6E63',
              }}
            >
              Deja un compte ?{' '}
              <Text style={{ color: '#D32F2F', fontFamily: 'CrimsonText-SemiBold' }}>
                Se connecter
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
