import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  AppState,
  type AppStateStatus,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Fingerprint, Unlock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { i18n } from '../i18n';
import {
  authenticateWithBiometric,
  verifyPin,
  getAuthState,
  AUTH,
  type BiometricType,
} from '../services/authService';
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
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: t.primary10,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: 28,
    },
    title: {
      fontSize: 26,
      fontWeight: '800' as const,
      color: t.textPrimary,
      marginBottom: 6,
      textAlign: 'center' as const,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 16,
      color: t.textSecondary,
      textAlign: 'center' as const,
    },
    dots: {
      flexDirection: 'row' as const,
      gap: 14,
      marginTop: 32,
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
    bioWrap: {
      alignItems: 'center' as const,
      paddingVertical: 20,
    },
    bioBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderRadius: 28,
      backgroundColor: t.primary10,
    },
    bioText: { fontSize: 16, fontWeight: '600' as const, color: t.primary },
    error: {
      fontSize: 14,
      color: t.danger,
      marginTop: 8,
      textAlign: 'center' as const,
    },
    lockout: {
      fontSize: 14,
      color: t.textMuted,
      marginTop: 8,
      textAlign: 'center' as const,
    },
  };
}

function getBiometricLabel(type: BiometricType): string {
  if (type === 'FaceID') return i18n.t('auth.useFaceId');
  if (type === 'TouchID') return i18n.t('auth.useTouchId');
  return i18n.t('auth.useBiometric');
}

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const tokens = useTheme();
  const insets = useSafeAreaInsets();
  const styles = StyleSheet.create(makeStyles(tokens) as Record<string, object>);

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioType, setBioType] = useState<BiometricType>(null);
  const [failures, setFailures] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(0);

  const tryBiometric = useCallback(async (showErrorOnFail = false) => {
    setError('');
    setLoading(true);
    try {
      const ok = await authenticateWithBiometric();
      if (ok) {
        onUnlock();
      } else if (showErrorOnFail) {
        setError(i18n.t('auth.biometricFailed'));
      }
    } catch {
      if (showErrorOnFail) setError(i18n.t('auth.biometricFailed'));
    } finally {
      setLoading(false);
    }
  }, [onUnlock]);

  useEffect(() => {
    getAuthState().then((s) => {
      setBioAvailable(!!(s.biometricEnabled && s.biometricAvailable));
      setBioType(s.biometricType ?? null);
    });
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active' && bioAvailable && !loading) tryBiometric(false);
    });
    return () => sub.remove();
  }, [bioAvailable, loading, tryBiometric]);

  const handleKey = useCallback(
    (n: number) => {
      if (lockoutUntil > Date.now()) return;
      setError('');
      const next = pin + String(n);
      if (next.length <= AUTH.PIN_LENGTH) {
        setPin(next);
        if (next.length === AUTH.PIN_LENGTH) {
          setLoading(true);
          verifyPin(next).then((ok) => {
            setLoading(false);
            if (ok) onUnlock();
            else {
              setPin('');
              const f = failures + 1;
              setFailures(f);
              setError(i18n.t('auth.wrongPin'));
              if (f >= AUTH.MAX_FAILURES) {
                setLockoutUntil(Date.now() + AUTH.LOCKOUT_SECONDS * 1000);
              }
            }
          });
        }
      }
    },
    [pin, failures, lockoutUntil, onUnlock]
  );

  const handleBack = useCallback(() => {
    if (lockoutUntil > Date.now()) return;
    setPin((p) => p.slice(0, -1));
    setError('');
  }, [lockoutUntil]);

  const isLockedOut = lockoutUntil > Date.now();
  const lockoutSec = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom }]}>
      <View style={styles.top}>
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.iconWrap}>
          <Unlock size={44} color={tokens.primary} />
        </Animated.View>
        <Animated.Text entering={FadeIn.delay(200)} style={styles.title}>
          {i18n.t('auth.unlockApp')}
        </Animated.Text>
        <Animated.Text entering={FadeIn.delay(250)} style={styles.subtitle}>
          {i18n.t('auth.enterPin')}
        </Animated.Text>

        <View style={styles.dots}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled]} />
          ))}
        </View>

        {loading && (
          <ActivityIndicator size="small" color={tokens.primary} style={{ marginTop: 12 }} />
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {isLockedOut ? (
          <Text style={styles.lockout}>{i18n.t('auth.tryAgainIn', { seconds: lockoutSec })}</Text>
        ) : null}
      </View>

      <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.keypad}>
        {KEYPAD.map((row, ri) => (
          <View key={ri} style={styles.keyRow}>
            {row.map((item, ci) =>
              item === null ? (
                <View key={`${ri}-${ci}`} style={[styles.key, { opacity: 0 }]} />
              ) : item === 'back' ? (
                <PressableScale
                  key={`${ri}-${ci}`}
                  style={styles.key}
                  onPress={handleBack}
                  disabled={loading || isLockedOut}
                >
                  <Text style={styles.keyText}>⌫</Text>
                </PressableScale>
              ) : (
                <PressableScale
                  key={`${ri}-${ci}`}
                  style={styles.key}
                  onPress={() => handleKey(item)}
                  disabled={loading || isLockedOut}
                >
                  <Text style={styles.keyText}>{item}</Text>
                </PressableScale>
              )
            )}
          </View>
        ))}
      </Animated.View>

      {bioAvailable && (
        <Animated.View entering={FadeIn.delay(400)} style={styles.bioWrap}>
          <PressableScale
            style={styles.bioBtn}
            onPress={() => tryBiometric(true)}
            disabled={loading || isLockedOut}
          >
            <Fingerprint size={24} color={tokens.primary} />
            <Text style={styles.bioText}>{getBiometricLabel(bioType)}</Text>
          </PressableScale>
        </Animated.View>
      )}
    </View>
  );
}
