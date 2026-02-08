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
import { X, Check } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
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

function makeQuickPayStyles(t: ThemeTokens) {
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
    balanceLabel: { fontSize: 14, color: t.textSecondary, marginBottom: 4 },
    balanceValue: { fontSize: 24, fontWeight: '700' as const, color: t.primary, fontVariant: ['tabular-nums'] },
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
    receiverInput: {
      backgroundColor: t.surface,
      borderWidth: 2,
      borderColor: t.border,
      borderRadius: radius.md,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: t.textPrimary,
      marginBottom: 24,
    },
    errorBox: { backgroundColor: t.dangerLight, borderWidth: 1, borderColor: t.danger, borderRadius: 12, padding: 12, marginBottom: 16 },
    errorText: { fontSize: 14, color: t.danger },
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
    successTitle: { fontSize: 28, fontWeight: '700' as const, color: t.white, marginBottom: 8, textAlign: 'center' as const },
    successSubtitle: { fontSize: 16, color: t.primaryTint, textAlign: 'center' as const },
    modalOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: t.overlay,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: 24,
      zIndex: 100,
    },
    modal: { backgroundColor: t.surface, borderRadius: radius.lg, padding: 24, width: '100%' as const, maxWidth: 340 },
    modalTitle: { fontSize: 20, fontWeight: '700' as const, color: t.textPrimary, marginBottom: 8 },
    modalMessage: { fontSize: 16, color: t.textSecondary, marginBottom: 24 },
    modalSummary: { backgroundColor: t.borderLight, borderRadius: radius.md, padding: 16, marginBottom: 24 },
    modalSummaryRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 12 },
    modalSummaryLabel: { fontSize: 14, color: t.textSecondary },
    modalSummaryValue: { fontSize: 16, fontWeight: '600' as const, color: t.textPrimary, fontVariant: ['tabular-nums'] },
    modalButtons: { flexDirection: 'row' as const, gap: 12 },
    modalButtonCancel: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: t.borderLight,
      alignItems: 'center' as const,
    },
    modalButtonCancelText: { fontSize: 16, fontWeight: '500' as const, color: t.textSecondary },
    modalButtonConfirm: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: t.primary, alignItems: 'center' as const },
    modalButtonConfirmText: { fontSize: 16, fontWeight: '500' as const, color: t.white },
  };
}

export function QuickPaymentScreen() {
  const tokens = useTheme();
  const styles = useMemo(() => StyleSheet.create(makeQuickPayStyles(tokens) as Record<string, object>), [tokens]);
  const insets = useSafeAreaInsets();
  const language = useAppStore((s) => s.language);
  const availableBalance = useAppStore((s) => s.availableBalance);
  const setOverlay = useAppStore((s) => s.setOverlay);
  const addTransaction = useAppStore((s) => s.addTransaction);

  const [amount, setAmount] = useState('');
  const [receiver, setReceiver] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [spendError, setSpendError] = useState<string | null>(null);

  const available = availableBalance();
  const numAmount = parseFloat(amount) || 0;
  const isValid =
    numAmount > 0 && numAmount <= available && receiver.trim().length > 0;
  const wallets = useAppStore((s) => s.wallets);
  const activeWalletId = useAppStore((s) => s.activeWalletId);
  const activeWallet = useMemo(
    () => wallets.find((w) => w.id === activeWalletId),
    [wallets, activeWalletId]
  );
  const currency = activeWallet?.currency ?? i18n.t('wallet.currency');
  const { mask } = useBalancePrivacy();
  const showFrozenError = numAmount > 0 && numAmount > available;

  const handleConfirm = () => {
    setSpendError(null);
    if (isValid) setShowConfirm(true);
  };

  const handleFinalConfirm = async () => {
    setShowConfirm(false);
    setSpendError(null);
    setShowSuccess(true);
    await new Promise((r) => setTimeout(r, 500));
    const result = await addTransaction({
      amount: numAmount,
      type: 'send',
      receiver: receiver.trim(),
    });
    if (result.success === false) {
      playSound('transaction_error');
      setShowSuccess(false);
      setSpendError(result.error ?? i18n.t('quickPayment.insufficientBalance'));
      return;
    }
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
            {i18n.t('quickPayment.success')}
          </Text>
          <Text style={styles.successSubtitle}>
            {i18n.t('quickPayment.recorded')}
          </Text>
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
          <Text style={styles.headerTitle}>
            {i18n.t('quickPayment.title')}
          </Text>
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
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>
              {i18n.t('quickPayment.balance')}
            </Text>
            <Text style={styles.balanceValue}>
              {mask(available)} {currency}
            </Text>
          </View>

          <Text style={styles.inputLabel}>{i18n.t('quickPayment.amount')}</Text>
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

          <Text style={styles.inputLabel}>
            {i18n.t('quickPayment.receiver')}
          </Text>
          <TextInput
            style={styles.receiverInput}
            value={receiver}
            onChangeText={setReceiver}
            placeholder={i18n.t('quickPayment.receiverPlaceholder')}
            placeholderTextColor={tokens.textMuted}
            maxLength={100}
          />

          {(showFrozenError || spendError) && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {spendError ?? i18n.t('quickPayment.amountFrozenError')}
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
            <Text
              style={[
                styles.confirmButtonText,
                !isValid && styles.confirmButtonTextDisabled,
              ]}
            >
              {i18n.t('quickPayment.confirm')}
            </Text>
          </PressableScale>
        </View>
      </KeyboardAvoidingView>

      {showConfirm && (
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowConfirm(false)}
        >
          <Animated.View
            entering={FadeIn.duration(200)}
            style={styles.modal}
          >
            <Text style={styles.modalTitle}>
              {i18n.t('quickPayment.confirmTitle')}
            </Text>
            <Text style={styles.modalMessage}>
              {i18n.t('quickPayment.confirmMessage')}
            </Text>
            <View style={styles.modalSummary}>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>
                  {i18n.t('quickPayment.amount')}
                </Text>
                <Text style={styles.modalSummaryValue}>
                  {mask(numAmount)} {currency}
                </Text>
              </View>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>
                  {i18n.t('quickPayment.to')}
                </Text>
                <Text style={styles.modalSummaryValue}>{receiver}</Text>
              </View>
            </View>
            <View style={styles.modalButtons}>
              <PressableScale
                style={styles.modalButtonCancel}
                onPress={() => setShowConfirm(false)}
              >
                <Text style={styles.modalButtonCancelText}>
                  {i18n.t('quickPayment.cancel')}
                </Text>
              </PressableScale>
              <PressableScale
                style={styles.modalButtonConfirm}
                onPress={handleFinalConfirm}
              >
                <Text style={styles.modalButtonConfirmText}>
                  {i18n.t('quickPayment.confirm')}
                </Text>
              </PressableScale>
            </View>
          </Animated.View>
        </Pressable>
      )}
    </View>
  );
}
