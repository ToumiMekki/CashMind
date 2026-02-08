import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Lock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { i18n } from '../i18n';
import { verifyPin, enableBiometric, clearAuth, AUTH } from '../services/authService';
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
      fontSize: 22,
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
    errorBox: {
      minHeight: 48,
      marginTop: 12,
      marginHorizontal: 16,
      paddingHorizontal: 16,
      paddingVertical: 10,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    error: {
      fontSize: 14,
      color: t.danger,
      textAlign: 'center' as const,
      lineHeight: 20,
    },
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
    cancelWrap: { paddingVertical: 20, alignItems: 'center' as const },
    cancelBtn: { paddingVertical: 8, paddingHorizontal: 20 },
    cancelText: { fontSize: 16, fontWeight: '500' as const, color: t.textMuted },
  };
}

export type VerifyPinAction = 'enableBiometric' | 'disablePin';

export function VerifyPinScreen({
  action,
  onSuccess,
  onCancel,
}: {
  action: VerifyPinAction;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const tokens = useTheme();
  const insets = useSafeAreaInsets();
  const styles = StyleSheet.create(makeStyles(tokens) as Record<string, object>);

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const title =
    action === 'enableBiometric'
      ? i18n.t('settings.enableBiometricBtn')
      : i18n.t('settings.disablePinConfirm');
  const subtitle =
    action === 'enableBiometric'
      ? i18n.t('auth.enterPinThenBiometric')
      : i18n.t('auth.enterPin');

  const handleKey = useCallback(
    (n: number) => {
      setError('');
      const next = pin + String(n);
      if (next.length <= AUTH.PIN_LENGTH) {
        setPin(next);
        if (next.length === AUTH.PIN_LENGTH) {
          verifyPin(next).then((ok) => {
            if (!ok) {
              setError(i18n.t('auth.wrongPin'));
              setPin('');
              return;
            }
            if (action === 'enableBiometric') {
              enableBiometric(next).then((r) => {
                if (r.success) onSuccess();
                else {
                  const msg: string =
                    r.error === 'USER_CANCELLED'
                      ? i18n.t('auth.setupCancelled')
                      : r.error === 'Biometric not available'
                        ? i18n.t('auth.biometricNotAvailable')
                        : r.error === 'STORAGE_ERROR' ||
                            /keystore|keychain|operation failed|storage/i.test(r.error ?? '')
                          ? i18n.t('auth.storageError')
                          : r.error ?? i18n.t('auth.error');
                  setError(msg);
                  setPin('');
                }
              });
            } else {
              clearAuth().then(() => onSuccess());
            }
          });
        }
      }
    },
    [pin, action, onSuccess]
  );

  const handleBack = useCallback(() => {
    setError('');
    setPin((p) => p.slice(0, -1));
  }, []);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom }]}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
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
            <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled]} />
          ))}
        </View>

        <View style={styles.errorBox}>
          {error ? (
            <Text style={styles.error} numberOfLines={3}>
              {error}
            </Text>
          ) : null}
        </View>
      </View>

      <Animated.View entering={FadeInDown.delay(300).springify()} style={[styles.keypad, { flexShrink: 0 }]}>
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

      <View style={styles.cancelWrap}>
        <Pressable style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>{i18n.t('auth.cancel')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
