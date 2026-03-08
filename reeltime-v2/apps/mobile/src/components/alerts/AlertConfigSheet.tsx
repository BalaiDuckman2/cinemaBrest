import { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useAlerts, type AlertCriteria } from '../../hooks/useAlerts';

interface CinemaOption {
  id: string;
  name: string;
}

interface AlertConfigSheetProps {
  initialFilmTitle?: string;
  cinemas?: CinemaOption[];
  onCreated?: () => void;
}

const VERSION_OPTIONS = [
  { value: null, label: 'Toutes' },
  { value: 'VF' as const, label: 'VF' },
  { value: 'VO' as const, label: 'VO' },
  { value: 'VOST' as const, label: 'VOST' },
];

const TIME_OPTIONS = [
  { value: null, label: 'Pas de filtre' },
  ...Array.from({ length: 25 }, (_, i) => {
    const hours = Math.floor(i / 2) + 10;
    const minutes = i % 2 === 0 ? '00' : '30';
    if (hours > 22) return null;
    const time = `${String(hours).padStart(2, '0')}:${minutes}`;
    return { value: time, label: time };
  }).filter(Boolean) as Array<{ value: string | null; label: string }>,
];

export function AlertConfigSheet({
  initialFilmTitle = '',
  cinemas = [],
  onCreated,
}: AlertConfigSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['60%', '85%'], []);
  const { createAlert, isCreating } = useAlerts();

  const [filmTitle, setFilmTitle] = useState(initialFilmTitle);
  const [selectedCinema, setSelectedCinema] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<'VF' | 'VO' | 'VOST' | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const canSubmit = filmTitle.trim().length >= 1 && !isCreating;

  const handleClose = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const handleCreate = useCallback(async () => {
    if (!canSubmit) return;

    const criteria: AlertCriteria = {};
    if (selectedCinema) criteria.cinemaId = selectedCinema;
    if (selectedVersion) criteria.version = selectedVersion;
    if (selectedTime) criteria.minTime = selectedTime;

    try {
      const response = await createAlert({
        filmTitle: filmTitle.trim(),
        criteria: Object.keys(criteria).length > 0 ? criteria : undefined,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Alerte creee', 'Vous serez notifie quand ce film sera disponible.');

      if (response.data.immediateMatch) {
        setTimeout(() => {
          Alert.alert('Info', response.data.matchMessage ?? "Ce film est deja a l'affiche !");
        }, 500);
      }

      handleClose();
      onCreated?.();
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', "Impossible de creer l'alerte. Reessayez.");
    }
  }, [canSubmit, filmTitle, selectedCinema, selectedVersion, selectedTime, createAlert, handleClose, onCreated]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: '#FFF8E1' }}
      handleIndicatorStyle={{ backgroundColor: '#8D6E63' }}
    >
      <BottomSheetView style={{ flex: 1, paddingHorizontal: 20 }}>
        <Text
          style={{
            fontFamily: 'PlayfairDisplay-Bold',
            fontSize: 24,
            color: '#1A1A1A',
            marginBottom: 20,
          }}
        >
          Creer une alerte
        </Text>

        {/* Film title */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontFamily: 'BebasNeue-Regular',
              fontSize: 13,
              color: '#5D4037',
              marginBottom: 6,
              letterSpacing: 1,
            }}
          >
            TITRE DU FILM
          </Text>
          <TextInput
            value={filmTitle}
            onChangeText={setFilmTitle}
            placeholder="Titre du film..."
            placeholderTextColor="#8D6E63"
            style={{
              fontFamily: 'CrimsonText-Regular',
              fontSize: 16,
              color: '#1A1A1A',
              backgroundColor: '#FFFFFF',
              borderWidth: 2,
              borderColor: '#D7CCC8',
              borderRadius: 8,
              paddingHorizontal: 14,
              paddingVertical: 10,
            }}
          />
        </View>

        {/* Cinema chips */}
        {cinemas.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontFamily: 'BebasNeue-Regular',
                fontSize: 13,
                color: '#5D4037',
                marginBottom: 6,
                letterSpacing: 1,
              }}
            >
              CINEMA (OPTIONNEL)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {cinemas.map((cinema) => {
                  const isSelected = selectedCinema === cinema.id;
                  return (
                    <TouchableOpacity
                      key={cinema.id}
                      onPress={() =>
                        setSelectedCinema(isSelected ? null : cinema.id)
                      }
                      style={{
                        backgroundColor: isSelected ? '#D32F2F' : '#EFEBE9',
                        paddingHorizontal: 14,
                        paddingVertical: 6,
                        borderRadius: 20,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'BebasNeue-Regular',
                          fontSize: 13,
                          color: isSelected ? '#FFFFFF' : '#5D4037',
                          letterSpacing: 0.5,
                        }}
                      >
                        {cinema.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Version selector */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontFamily: 'BebasNeue-Regular',
              fontSize: 13,
              color: '#5D4037',
              marginBottom: 6,
              letterSpacing: 1,
            }}
          >
            VERSION
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {VERSION_OPTIONS.map((option) => {
              const isActive = selectedVersion === option.value;
              return (
                <TouchableOpacity
                  key={option.label}
                  onPress={() => setSelectedVersion(option.value)}
                  style={{
                    backgroundColor: isActive ? '#FFD54F' : '#EFEBE9',
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    borderRadius: 20,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'BebasNeue-Regular',
                      fontSize: 13,
                      color: isActive ? '#1A1A1A' : '#5D4037',
                      letterSpacing: 0.5,
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Time selector */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontFamily: 'BebasNeue-Regular',
              fontSize: 13,
              color: '#5D4037',
              marginBottom: 6,
              letterSpacing: 1,
            }}
          >
            HEURE MINIMUM
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {TIME_OPTIONS.map((option) => {
                const isActive = selectedTime === option.value;
                return (
                  <TouchableOpacity
                    key={option.label}
                    onPress={() => setSelectedTime(option.value)}
                    style={{
                      backgroundColor: isActive ? '#FFD54F' : '#EFEBE9',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'BebasNeue-Regular',
                        fontSize: 12,
                        color: isActive ? '#1A1A1A' : '#5D4037',
                      }}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Create button */}
        <TouchableOpacity
          onPress={handleCreate}
          disabled={!canSubmit}
          activeOpacity={0.8}
          style={{
            backgroundColor: canSubmit ? '#D32F2F' : '#BDBDBD',
            borderRadius: 8,
            paddingVertical: 14,
            alignItems: 'center',
          }}
        >
          {isCreating ? (
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
              CREER L'ALERTE
            </Text>
          )}
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}
