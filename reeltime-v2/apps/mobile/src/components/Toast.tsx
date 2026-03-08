import { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';

interface ToastMessage {
  id: number;
  text: string;
  onUndo?: () => void;
}

let toastId = 0;
const listeners: Array<(toast: ToastMessage) => void> = [];

export function showToast(text: string, onUndo?: () => void) {
  const toast: ToastMessage = { id: ++toastId, text, onUndo };
  for (const listener of listeners) {
    listener(toast);
  }
}

export function ToastContainer() {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const translateY = useRef(new Animated.Value(100)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const dismiss = useCallback(() => {
    Animated.timing(translateY, {
      toValue: 100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setToast(null);
    });
  }, [translateY]);

  useEffect(() => {
    const listener = (newToast: ToastMessage) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast(newToast);
      translateY.setValue(100);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
      timerRef.current = setTimeout(dismiss, 5000);
    };

    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx >= 0) listeners.splice(idx, 1);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [translateY, dismiss]);

  if (!toast) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }] },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.text} numberOfLines={2}>{toast.text}</Text>
        {toast.onUndo && (
          <Pressable
            onPress={() => {
              toast.onUndo?.();
              dismiss();
            }}
            style={styles.undoButton}
          >
            <Text style={styles.undoText}>ANNULER</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  content: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,213,79,0.15)',
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  text: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 15,
    color: '#FFF8E1',
    flex: 1,
  },
  undoButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,213,79,0.2)',
    borderRadius: 6,
  },
  undoText: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 14,
    color: '#FFD54F',
  },
});
