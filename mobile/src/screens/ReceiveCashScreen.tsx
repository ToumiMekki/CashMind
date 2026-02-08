import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../stores/useAppStore';
import { playSound } from '../services/soundManager';
import { i18n } from '../i18n';
import { radius } from '../theme';
import { formatNumber } from '../utils/format';
import { useTheme } from '../hooks/useTheme';
import { useBalancePrivacy } from '../hooks/useBalancePrivacy';
import { PressableScale } from '../components/ui/PressableScale';
import type { ThemeTokens } from '../theme/tokens';

const PRESETS = [100, 500, 1000, 5000];

function makeReceiveStyles(t: ThemeTokens) {
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
    todayCard: {
      backgroundColor: t.successLight,
      borderWidth: 1,
      borderColor: t.success,
      borderRadius: radius.md,
      padding: 16,
      marginBottom: 24,
    },
    todayLabel: { fontSize: 14, color: t.success, marginBottom: 4 },
    todayValue: { fontSize: 24, fontWeight: '700' as const, color: t.success, fontVariant: ['tabular-nums'] },
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
    presetText: { fontSize: 14, fontWeight: '500' as const, color: t.textPrimary, fontVariant: ['tabular-nums'] },
    merchantIcon: {
      width: 128,
      height: 128,
      borderRadius: radius.lg,
      backgroundColor: t.primary,
      alignSelf: 'center' as const,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    merchantEmoji: { fontSize: 56 },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 16,
      backgroundColor: t.surface,
      borderTopWidth: 1,
      borderTopColor: t.border,
      gap: 12,
    },
    generateButton: { backgroundColor: t.accent, paddingVertical: 16, borderRadius: radius.md, alignItems: 'center' as const },
    generateButtonText: { fontSize: 18, fontWeight: '700' as const, color: t.primary },
    confirmButton: { backgroundColor: t.primary, paddingVertical: 16, borderRadius: radius.md, alignItems: 'center' as const },
    confirmButtonText: { fontSize: 18, fontWeight: '700' as const, color: t.white },
    buttonDisabled: { backgroundColor: t.border },
    buttonTextDisabled: { color: t.textMuted },
    qrContent: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const, paddingHorizontal: 24, paddingVertical: 24 },
    qrTitle: { fontSize: 16, color: t.textSecondary, textAlign: 'center' as const, marginBottom: 24 },
    qrBox: {
      backgroundColor: t.surface,
      padding: 24,
      borderRadius: radius.lg,
      marginBottom: 24,
      shadowColor: t.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    qrInner: {
      width: 256,
      height: 256,
      borderRadius: radius.md,
      backgroundColor: t.primary,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    qrEmoji: { fontSize: 48, marginBottom: 8 },
    qrAmount: { fontSize: 28, fontWeight: '700' as const, color: t.white, fontVariant: ['tabular-nums'] },
    qrCurrency: { fontSize: 16, color: t.primaryTint },
    qrReadyBox: {
      backgroundColor: t.accent10,
      borderWidth: 1,
      borderColor: t.accent30,
      borderRadius: radius.md,
      paddingHorizontal: 24,
      paddingVertical: 16,
      width: '100%' as const,
      maxWidth: 320,
    },
    qrReadyText: { fontSize: 14, color: t.textSecondary, textAlign: 'center' as const },
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
    successTitle: { fontSize: 28, fontWeight: '700' as const, color: t.white, marginBottom: 8, textAlign: 'center' as const },
    successSubtitle: { fontSize: 16, color: t.primaryTint, textAlign: 'center' as const },
  };
}

export function ReceiveCashScreen() {
  const tokens = useTheme();
  const styles = useMemo(() => StyleSheet.create(makeReceiveStyles(tokens) as Record<string, object>), [tokens]);
  const insets = useSafeAreaInsets();
  const language = useAppStore((s) => s.language);
  const transactions = useAppStore((s) => s.transactions);
  const setOverlay = useAppStore((s) => s.setOverlay);
  const addTransaction = useAppStore((s) => s.addTransaction);

  const [amount, setAmount] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const numAmount = parseFloat(amount) || 0;
  const isValid = numAmount > 0;
  const wallets = useAppStore((s) => s.wallets);
  const activeWalletId = useAppStore((s) => s.activeWalletId);
  const activeWallet = useMemo(
    () => wallets.find((w) => w.id === activeWalletId),
    [wallets, activeWalletId]
  );
  const currency = activeWallet?.currency ?? i18n.t('wallet.currency');
  const { mask } = useBalancePrivacy();

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const todayReceived = useMemo(
    () =>
      transactions
        .filter((tx) => tx.type === 'receive' && tx.timestamp >= todayStart)
        .reduce((sum, tx) => sum + tx.amount, 0),
    [transactions, todayStart]
  );

  const handleGenerateQR = () => {
    if (isValid) setShowQR(true);
  };

  const handleConfirm = async () => {
    if (!isValid) return;
    setShowSuccess(true);
    await new Promise((r) => setTimeout(r, 500));
    await addTransaction({
      amount: numAmount,
      type: 'receive',
      sender: language === 'ar' ? 'نقدي' : language === 'fr' ? 'Cash' : 'Cash',
    });
    playSound('transaction_validate_success');
    await new Promise((r) => setTimeout(r, 1000));
    setOverlay(null);
  };

  if (showSuccess) {
    return (
      <View style={[styles.successRoot, { paddingTop: insets.top }]}>
        <View style={styles.successGradient}>
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={styles.successIcon}
          >
            <Check size={48} color={tokens.primary} />
          </Animated.View>
          <Text style={styles.successTitle}>
            {i18n.t('receive.success')}
          </Text>
          <Text style={styles.successSubtitle}>
            {i18n.t('receive.recorded')}
          </Text>
        </View>
      </View>
    );
  }

  if (showQR) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{i18n.t('receive.title')}</Text>
          <Pressable
            style={styles.closeButton}
            onPress={() => setShowQR(false)}
            hitSlop={12}
          >
            <X size={24} color={tokens.textSecondary} />
          </Pressable>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.qrContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.qrTitle}>{i18n.t('receive.qrTitle')}</Text>
          <View style={styles.qrBox}>
            <View style={styles.qrInner}>
              <Text style={styles.qrEmoji}>💰</Text>
              <Text style={styles.qrAmount}>
                {mask(numAmount)}
              </Text>
              <Text style={styles.qrCurrency}>{currency}</Text>
            </View>
          </View>
          <View style={styles.qrReadyBox}>
            <Text style={styles.qrReadyText}>{i18n.t('receive.qrReady')}</Text>
          </View>
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <PressableScale
            style={styles.confirmButton}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>
              {i18n.t('receive.confirm')}
            </Text>
          </PressableScale>
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
          <Text style={styles.headerTitle}>{i18n.t('receive.title')}</Text>
          <Pressable
            style={styles.closeButton}
            onPress={() => setOverlay(null)}
            hitSlop={12}
          >
            <X size={24} color={tokens.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.todayCard}>
            <Text style={styles.todayLabel}>
              {i18n.t('receive.todayTotal')}
            </Text>
            <Text style={styles.todayValue}>
              {mask(todayReceived)} {currency}
            </Text>
          </View>

          <Text style={styles.inputLabel}>{i18n.t('receive.amount')}</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
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
                style={styles.presetButton}
                onPress={() => setAmount(String(p))}
              >
                <Text style={styles.presetText}>
                  {formatNumber(p, language)}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.merchantIcon}>
            <Text style={styles.merchantEmoji}>🏪</Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <PressableScale
            style={StyleSheet.flatten([styles.generateButton, !isValid && styles.buttonDisabled].filter(Boolean)) as import('react-native').ViewStyle}
            onPress={handleGenerateQR}
            disabled={!isValid}
          >
            <Text
              style={[
                styles.generateButtonText,
                !isValid && styles.buttonTextDisabled,
              ]}
            >
              {i18n.t('receive.generateQR')}
            </Text>
          </PressableScale>
          <PressableScale
            style={StyleSheet.flatten([styles.confirmButton, !isValid && styles.buttonDisabled].filter(Boolean)) as import('react-native').ViewStyle}
            onPress={handleConfirm}
            disabled={!isValid}
          >
            <Text
              style={[
                styles.confirmButtonText,
                !isValid && styles.buttonTextDisabled,
              ]}
            >
              {i18n.t('receive.confirm')}
            </Text>
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
