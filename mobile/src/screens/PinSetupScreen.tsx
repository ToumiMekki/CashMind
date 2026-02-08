import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Lock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { i18n } from '../i18n';
import { setPin, AUTH } from '../services/authService';
import { PressableScale } from '../components/ui/PressableScale';
import type { ThemeTokens } from '../theme/tokens';

const KEYPAD = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [null, 0, 'back'],
] as const;

function makeStyles(t: ThemeTokens) {
  return {
    container: {
      flex: 1,
      backgroundColor: t.background,
      paddingHorizontal: 28,
    },
    top: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    iconWrap: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: t.primary10,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: '800' as const,
      color: t.textPrimary,
      marginBottom: 6,
      textAlign: 'center' as const,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 15,
      color: t.textSecondary,
      textAlign: 'center' as const,
    },
    dots: {
      flexDirection: 'row' as const,
      gap: 14,
      marginTop: 28,
      marginBottom: 8,
      justifyContent: 'center' as const,
    },
    dot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: t.borderLight,
    },
    dotFilled: { backgroundColor: t.primary },
    keypad: {
      paddingBottom: 24,
      alignItems: 'center' as const,
    },
    keyRow: {
      flexDirection: 'row' as const,
      gap: 16,
      marginBottom: 14,
    },
    key: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: t.surface,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      shadowColor: t.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    keyText: {
      fontSize: 26,
      fontWeight: '600' as const,
      color: t.textPrimary,
    },
    error: {
      fontSize: 14,
      color: t.danger,
      marginTop: 8,
      textAlign: 'center' as const,
    },
    cancelWrap: { paddingVertical: 20, alignItems: 'center' as const },
    cancelBtn: { paddingVertical: 8, paddingHorizontal: 20 },
    cancelText: { fontSize: 16, fontWeight: '500' as const, color: t.textMuted },
  };
}

type Step = 'create' | 'confirm';

export function PinSetupScreen({
  onComplete,
  onCancel,
  requireCurrentPin,
  currentPin,
}: {
  onComplete: () => void;
  onCancel?: () => void;
  requireCurrentPin?: boolean;
  currentPin?: string;
}) {
  const tokens = useTheme();
  const insets = useSafeAreaInsets();
  const styles = StyleSheet.create(makeStyles(tokens) as Record<string, object>);

  const [step, setStep] = useState<Step>('create');
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [error, setError] = useState('');

  const displayPin = step === 'create' ? pin1 : pin2;
  const dotCount = displayPin.length;

  const handleKey = useCallback(
    (n: number) => {
      setError('');
      if (step === 'create') {
        const next = pin1 + String(n);
        if (next.length <= AUTH.PIN_LENGTH) {
          setPin1(next);
          if (next.length === AUTH.PIN_LENGTH) setStep('confirm');
        }
      } else {
        const next = pin2 + String(n);
        if (next.length <= AUTH.PIN_LENGTH) {
          setPin2(next);
          if (next.length === AUTH.PIN_LENGTH) {
            if (next !== pin1) {
              setError(i18n.t('auth.pinMismatch'));
              setPin2('');
            } else {
              setPin(pin1, requireCurrentPin ? currentPin : undefined).then((r) => {
                if (r.success) onComplete();
                else setError(r.error === 'STORAGE_ERROR' ? i18n.t('auth.storageError') : (r.error || i18n.t('auth.error')));
              });
            }
          }
        }
      }
    },
    [step, pin1, pin2, requireCurrentPin, currentPin, onComplete]
  );

  const handleBack = useCallback(() => {
    setError('');
    if (step === 'create') {
      setPin1((p) => p.slice(0, -1));
    } else {
      if (pin2.length > 0) {
        setPin2((p) => p.slice(0, -1));
      } else {
        setStep('create');
        setPin1((p) => p.slice(0, -1));
      }
    }
  }, [step, pin2.length]);

  const title =
    step === 'create'
      ? requireCurrentPin
        ? i18n.t('auth.enterNewPin')
        : i18n.t('auth.createPin')
      : i18n.t('auth.confirmPin');
  const subtitle = step === 'create' ? i18n.t('auth.pinHint') : i18n.t('auth.reenterPin');

  return (
    <View style={[styles.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom }]}>
      <View style={styles.top}>
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.iconWrap}>
          <Lock size={40} color={tokens.primary} />
        </Animated.View>
        <Animated.Text entering={FadeIn.delay(200)} style={styles.title}>
          {title}
        </Animated.Text>
        <Animated.Text entering={FadeIn.delay(250)} style={styles.subtitle}>
          {subtitle}
        </Animated.Text>

        <View style={styles.dots}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={[styles.dot, i < dotCount && styles.dotFilled]} />
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.keypad}>
        {KEYPAD.map((row, ri) => (
          <View key={ri} style={styles.keyRow}>
            {row.map((item, ci) =>
              item === null ? (
                <View key={`${ri}-${ci}`} style={[styles.key, { opacity: 0 }]} />
              ) : item === 'back' ? (
                <PressableScale key={`${ri}-${ci}`} style={styles.key} onPress={handleBack}>
                  <Text style={styles.keyText}>⌫</Text>
                </PressableScale>
              ) : (
                <PressableScale
                  key={`${ri}-${ci}`}
                  style={styles.key}
                  onPress={() => handleKey(item)}
                >
                  <Text style={styles.keyText}>{item}</Text>
                </PressableScale>
              )
            )}
          </View>
        ))}
      </Animated.View>

      {onCancel && (
        <View style={styles.cancelWrap}>
          <Pressable style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>{i18n.t('auth.cancel')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
