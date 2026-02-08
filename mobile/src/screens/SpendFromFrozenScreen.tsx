import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { X, CreditCard } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../stores/useAppStore';
import { i18n } from '../i18n';
import { radius } from '../theme';
import { formatNumber } from '../utils/format';
import { useTheme } from '../hooks/useTheme';
import { useBalancePrivacy } from '../hooks/useBalancePrivacy';
import { PressableScale } from '../components/ui/PressableScale';
import type { ThemeTokens } from '../theme/tokens';

const PRESETS = [100, 500, 1000, 5000];

function makeSpendFromFrozenStyles(t: ThemeTokens) {
  return {
    root: { flex: 1, backgroundColor: t.background, maxWidth: 430, alignSelf: 'center' as const, width: '100%' as const },
    flex: { flex: 1 },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: t.surface,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    headerTitle: { fontSize: 20, fontWeight: '700' as const, color: t.textPrimary },
    closeButton: { padding: 8 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingVertical: 24, paddingBottom: 24 },
    balanceCard: { backgroundColor: t.primary10, borderRadius: radius.md, padding: 16, marginBottom: 24 },
    balanceLabel: { fontSize: 14, color: t.primary, marginBottom: 4 },
    balanceValue: { fontSize: 22, fontWeight: '700' as const, color: t.primary, fontVariant: ['tabular-nums'] },
    inputLabel: { fontSize: 14, fontWeight: '500' as const, color: t.textSecondary, marginBottom: 8 },
    inputRow: { position: 'relative' as const, marginBottom: 12 },
    amountInput: {
      backgroundColor: t.surface,
      borderWidth: 2,
      borderColor: t.border,
      borderRadius: radius.md,
      paddingHorizontal: 16,
      paddingVertical: 16,
      fontSize: 24,
      fontWeight: '700' as const,
      color: t.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    currencySuffix: { position: 'absolute' as const, top: 0, bottom: 0, left: 16, justifyContent: 'center' as const, fontSize: 16, color: t.textMuted },
    presets: { flexDirection: 'row' as const, gap: 8, marginBottom: 24 },
    presetButton: {
      flex: 1,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 12,
      paddingVertical: 8,
      alignItems: 'center' as const,
    },
    presetDisabled: { opacity: 0.5 },
    presetText: { fontSize: 14, fontWeight: '500' as const, color: t.textPrimary, fontVariant: ['tabular-nums'] },
    presetTextDisabled: { color: t.textMuted },
    errorBox: { backgroundColor: t.dangerLight, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: t.danger },
    errorText: { fontSize: 14, color: t.danger, textAlign: 'center' as const },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 16,
      backgroundColor: t.surface,
      borderTopWidth: 1,
      borderTopColor: t.border,
    },
    confirmButton: { backgroundColor: t.primary, paddingVertical: 16, borderRadius: radius.md, alignItems: 'center' as const },
    confirmButtonDisabled: { backgroundColor: t.border },
    confirmButtonText: { fontSize: 18, fontWeight: '700' as const, color: t.white },
    confirmButtonTextDisabled: { color: t.textMuted },
    successRoot: { flex: 1, backgroundColor: t.primary, maxWidth: 430, alignSelf: 'center' as const, width: '100%' as const },
    successGradient: { flex: 1, backgroundColor: t.primary, justifyContent: 'center' as const, alignItems: 'center' as const, paddingHorizontal: 24 },
    successIcon: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: t.white,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: 24,
    },
    successTitle: { fontSize: 28, fontWeight: '700' as const, color: t.white, textAlign: 'center' as const },
  };
}

export function SpendFromFrozenScreen() {
  const tokens = useTheme();
  const styles = useMemo(() => StyleSheet.create(makeSpendFromFrozenStyles(tokens) as Record<string, object>), [tokens]);
  const insets = useSafeAreaInsets();
  const language = useAppStore((s) => s.language);
  const totalFrozenBalance = useAppStore((s) => s.totalFrozenBalance);
  const setOverlay = useAppStore((s) => s.setOverlay);
  const spendFromFreeze = useAppStore((s) => s.spendFromFreeze);

  const [amount, setAmount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const frozen = totalFrozenBalance();
  const numAmount = parseFloat(amount) || 0;
  const isValid = numAmount > 0 && numAmount <= frozen;
  const wallets = useAppStore((s) => s.wallets);
  const activeWalletId = useAppStore((s) => s.activeWalletId);
  const activeWallet = useMemo(
    () => wallets.find((w) => w.id === activeWalletId),
    [wallets, activeWalletId]
  );
  const currency = activeWallet?.currency ?? i18n.t('wallet.currency');
  const { mask } = useBalancePrivacy();

  const handleConfirm = async () => {
    setError(null);
    if (!isValid) return;
    const result = await spendFromFreeze(numAmount);
    if (result.success === false) {
      setError(result.error ?? i18n.t('spendFromFreeze.insufficient'));
      return;
    }
    setShowSuccess(true);
    await new Promise((r) => setTimeout(r, 800));
    setOverlay(null);
  };

  if (showSuccess) {
    return (
      <View style={[styles.successRoot, { paddingTop: insets.top }]}>
        <View style={styles.successGradient}>
          <Animated.View entering={FadeInDown.duration(400)} style={styles.successIcon}>
            <CreditCard size={48} color={tokens.primary} />
          </Animated.View>
          <Text style={styles.successTitle}>{i18n.t('spendFromFreeze.success')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{i18n.t('spendFromFreeze.title')}</Text>
          <Pressable style={styles.closeButton} onPress={() => setOverlay(null)} hitSlop={12}>
            <X size={24} color={tokens.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>{i18n.t('wallet.frozenBalance')}</Text>
            <Text style={styles.balanceValue}>
              {mask(frozen)} {currency}
            </Text>
          </View>

          <Text style={styles.inputLabel}>{i18n.t('spendFromFreeze.amount')}</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={(t) => { setAmount(t); setError(null); }}
              placeholder="0"
              placeholderTextColor={tokens.textMuted}
              keyboardType="decimal-pad"
              maxLength={12}
            />
            <Text style={styles.currencySuffix}>{currency}</Text>
          </View>
          <View style={styles.presets}>
            {PRESETS.map((p) => (
              <Pressable
                key={p}
                style={[styles.presetButton, p > frozen && styles.presetDisabled]}
                onPress={() => p <= frozen && setAmount(String(p))}
                disabled={p > frozen}
              >
                <Text style={[styles.presetText, p > frozen && styles.presetTextDisabled]}>
                  {formatNumber(p, language)}
                </Text>
              </Pressable>
            ))}
          </View>

          {(error || (numAmount > frozen && numAmount > 0)) && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {error ?? i18n.t('spendFromFreeze.insufficient')}
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <PressableScale
            style={StyleSheet.flatten([styles.confirmButton, !isValid && styles.confirmButtonDisabled].filter(Boolean)) as import('react-native').ViewStyle}
            onPress={handleConfirm}
            disabled={!isValid}
          >
            <Text style={[styles.confirmButtonText, !isValid && styles.confirmButtonTextDisabled]}>
              {i18n.t('spendFromFreeze.confirm')}
            </Text>
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
