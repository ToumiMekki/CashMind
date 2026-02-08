import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
} from 'react-native';
import { X, ArrowDownRight, ArrowUpRight, Trash2, Plus, Calendar, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../stores/useAppStore';
import { i18n } from '../i18n';
import { radius } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useBalancePrivacy } from '../hooks/useBalancePrivacy';
import { PressableScale } from '../components/ui/PressableScale';
import {
  getDebtById,
  updateDebt,
  deleteDebt,
  addPaymentToDebt,
} from '../repositories/debtRepository';
import { getTransactionById } from '../repositories/transactionRepository';
import { playSound } from '../services/soundManager';
import { formatDateShort, formatTime } from '../utils/format';
import type { Debt } from '../database/types';
import type { ThemeTokens } from '../theme/tokens';

function makeStyles(t: ThemeTokens) {
  return {
    container: { flex: 1, backgroundColor: t.background },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: t.surface,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    headerTitle: { fontSize: 18, fontWeight: '700' as const, color: t.textPrimary },
    closeBtn: { padding: 6 },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 32 },
    summaryCard: {
      backgroundColor: t.surface,
      borderRadius: radius.md,
      padding: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: t.border,
    },
    summaryHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 14,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    summaryIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: 12,
    },
    summaryIconOwe: { backgroundColor: t.dangerLight },
    summaryIconOwed: { backgroundColor: t.successLight },
    summaryInfo: { flex: 1, minWidth: 0 },
    summaryPerson: {
      fontSize: 18,
      fontWeight: '800' as const,
      color: t.textPrimary,
      marginBottom: 4,
    },
    summaryDescription: {
      fontSize: 13,
      color: t.textMuted,
    },
    summaryRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    summaryRowLast: {
      marginBottom: 0,
      paddingBottom: 0,
      borderBottomWidth: 0,
    },
    summaryLabel: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: t.textSecondary,
    },
    summaryValue: {
      fontSize: 16,
      fontWeight: '800' as const,
      color: t.textPrimary,
      fontVariant: ['tabular-nums'] as ('tabular-nums')[],
    },
    summaryValueOwe: { color: t.danger },
    summaryValueOwed: { color: t.success },
    progressContainer: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: t.border,
    },
    progressBar: {
      height: 4,
      backgroundColor: t.borderLight,
      borderRadius: 2,
      overflow: 'hidden' as const,
      marginTop: 8,
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700' as const,
      color: t.textPrimary,
      marginBottom: 12,
    },
    paymentCard: {
      backgroundColor: t.surface,
      borderRadius: radius.md,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: t.border,
    },
    paymentRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    paymentLabel: {
      fontSize: 12,
      color: t.textSecondary,
    },
    paymentValue: {
      fontSize: 15,
      fontWeight: '800' as const,
      color: t.textPrimary,
      fontVariant: ['tabular-nums'] as ('tabular-nums')[],
    },
    paymentDate: {
      fontSize: 11,
      color: t.textMuted,
      marginTop: 8,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
    },
    addPaymentCard: {
      backgroundColor: t.surface,
      borderRadius: radius.md,
      padding: 14,
      marginBottom: 16,
      borderWidth: 1.5,
      borderStyle: 'dashed' as const,
      borderColor: t.border,
    },
    addPaymentTitle: {
      fontSize: 14,
      fontWeight: '700' as const,
      color: t.textPrimary,
      marginBottom: 12,
    },
    amountInput: {
      backgroundColor: t.background,
      borderWidth: 1.5,
      borderColor: t.border,
      borderRadius: radius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 20,
      fontWeight: '800' as const,
      color: t.textPrimary,
      fontVariant: ['tabular-nums'] as ('tabular-nums')[],
      marginBottom: 10,
    },
    addPaymentBtn: {
      backgroundColor: t.primary,
      paddingVertical: 12,
      borderRadius: radius.md,
      alignItems: 'center' as const,
      flexDirection: 'row' as const,
      justifyContent: 'center' as const,
      gap: 6,
    },
    addPaymentBtnText: {
      fontSize: 14,
      fontWeight: '700' as const,
      color: t.white,
    },
    actionsRow: {
      flexDirection: 'row' as const,
      gap: 10,
      marginTop: 16,
    },
    actionBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: radius.md,
      alignItems: 'center' as const,
      flexDirection: 'row' as const,
      justifyContent: 'center' as const,
      gap: 6,
      borderWidth: 1.5,
    },
    deleteBtn: {
      borderColor: t.danger,
      backgroundColor: t.dangerLight,
    },
    deleteBtnText: {
      fontSize: 13,
      fontWeight: '700' as const,
      color: t.danger,
    },
    markPaidBtn: {
      borderColor: t.success,
      backgroundColor: t.successLight,
    },
    markPaidBtnText: {
      fontSize: 13,
      fontWeight: '700' as const,
      color: t.success,
    },
    emptyPayments: {
      backgroundColor: t.surface,
      borderRadius: radius.md,
      padding: 32,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderColor: t.border,
    },
    emptyText: {
      fontSize: 13,
      color: t.textMuted,
      marginTop: 8,
    },
    keyboardAccessory: {
      position: 'absolute' as const,
      left: 0,
      right: 0,
      borderTopWidth: 1,
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 8,
      zIndex: 1000,
    },
    doneButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    doneButtonText: {
      fontSize: 15,
      fontWeight: '700' as const,
    },
  };
}

export function DebtDetailsScreen() {
  const tokens = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => StyleSheet.create(makeStyles(tokens) as Record<string, object>), [tokens]);
  const language = useAppStore((s) => s.language);
  const { mask } = useBalancePrivacy();
  const setOverlay = useAppStore((s) => s.setOverlay);
  const selectedDebt = useAppStore((s) => s.selectedDebt);
  const refreshDebts = useAppStore((s) => s.refreshDebts);
  const addTransaction = useAppStore((s) => s.addTransaction);
  const wallets = useAppStore((s) => s.wallets);
  const activeWalletId = useAppStore((s) => s.activeWalletId);

  const activeWallet = useMemo(
    () => wallets.find((w) => w.id === activeWalletId),
    [wallets, activeWalletId]
  );
  const currency = activeWallet?.currency ?? 'DZD';

  const [debt, setDebt] = useState<Debt | null>(selectedDebt);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const paymentInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!selectedDebt) {
      setOverlay(null);
      return;
    }
    getDebtById(selectedDebt.id).then(setDebt).catch(() => setOverlay(null));
  }, [selectedDebt, setOverlay]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    paymentInputRef.current?.blur();
  };

  const handleAddPayment = useCallback(async () => {
    if (!debt || !activeWalletId) return;
    const amount = parseFloat(paymentAmount || '0');
    if (amount <= 0 || amount > debt.remainingAmount) {
      Alert.alert(i18n.t('debt.invalidAmount'));
      return;
    }

    setLoading(true);
    try {
      const isOwe = debt.type === 'owe';
      const result = await addTransaction({
        type: isOwe ? 'send' : 'receive',
        amount,
        receiver: isOwe ? debt.personName : undefined,
        sender: isOwe ? undefined : debt.personName,
        category: i18n.t('debt.debtPayment'),
        method: 'MANUAL',
      });

      if (result.success && result.transaction) {
        await addPaymentToDebt(debt.id, result.transaction.id, amount);
        const updatedDebt = await getDebtById(debt.id);
        setDebt(updatedDebt);
        setPaymentAmount('');
        await refreshDebts();
        playSound('transaction_validate_success');
      } else {
        throw new Error(result.error || 'Failed to create transaction');
      }
    } catch (err) {
      console.error('Failed to add payment:', err);
      Alert.alert(i18n.t('debt.paymentError'));
      playSound('transaction_error');
    } finally {
      setLoading(false);
    }
  }, [debt, paymentAmount, activeWalletId, addTransaction, refreshDebts]);

  const handleMarkPaid = useCallback(async () => {
    if (!debt) return;
    Alert.alert(
      i18n.t('debt.markPaidConfirm'),
      i18n.t('debt.markPaidMessage'),
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await updateDebt(debt.id, {
                remainingAmount: 0,
                status: 'paid',
              });
              const updatedDebt = await getDebtById(debt.id);
              setDebt(updatedDebt);
              await refreshDebts();
              playSound('transaction_validate_success');
            } catch (err) {
              console.error('Failed to mark as paid:', err);
              playSound('transaction_error');
            }
          },
        },
      ]
    );
  }, [debt, refreshDebts]);

  const handleDelete = useCallback(async () => {
    if (!debt) return;
    Alert.alert(
      i18n.t('debt.deleteDebt'),
      i18n.t('debt.deleteConfirm'),
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDebt(debt.id);
              await refreshDebts();
              setOverlay(null);
              playSound('transaction_validate_success');
            } catch (err) {
              console.error('Failed to delete debt:', err);
              playSound('transaction_error');
            }
          },
        },
      ]
    );
  }, [debt, refreshDebts, setOverlay]);

  if (!debt) return null;

  const isOwe = debt.type === 'owe';
  const progress = debt.originalAmount > 0 ? ((debt.originalAmount - debt.remainingAmount) / debt.originalAmount) * 100 : 0;
  const paidAmount = debt.originalAmount - debt.remainingAmount;
  const canAddPayment = debt.status !== 'paid' && parseFloat(paymentAmount || '0') > 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {keyboardHeight > 0 && (
        <View
          style={[
            styles.keyboardAccessory,
            {
              backgroundColor: tokens.surface,
              borderTopColor: tokens.border,
              bottom: keyboardHeight - (Platform.OS === 'ios' ? insets.bottom : 0),
            },
          ]}
        >
          <PressableScale
            style={[styles.doneButton, { backgroundColor: tokens.primary }]}
            onPress={dismissKeyboard}
            activeScale={0.97}
          >
            <Text style={[styles.doneButtonText, { color: tokens.white }]}>
              {i18n.t('businessPay.done')}
            </Text>
          </PressableScale>
        </View>
      )}

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>{i18n.t('debt.debtDetails')}</Text>
        <Pressable style={styles.closeBtn} onPress={() => setOverlay(null)}>
          <X size={20} color={tokens.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={[styles.summaryIcon, isOwe ? styles.summaryIconOwe : styles.summaryIconOwed]}>
              {isOwe ? (
                <ArrowUpRight size={22} color={tokens.danger} strokeWidth={2.5} />
              ) : (
                <ArrowDownRight size={22} color={tokens.success} strokeWidth={2.5} />
              )}
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryPerson}>{debt.personName}</Text>
              {debt.description && (
                <Text style={styles.summaryDescription}>{debt.description}</Text>
              )}
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{i18n.t('debt.originalAmount')}</Text>
            <Text style={styles.summaryValue}>
              {mask(debt.originalAmount)} {currency}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{i18n.t('debt.remainingAmount')}</Text>
            <Text
              style={[
                styles.summaryValue,
                isOwe ? styles.summaryValueOwe : styles.summaryValueOwed,
              ]}
            >
              {mask(debt.remainingAmount)} {currency}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{i18n.t('debt.paidAmount')}</Text>
            <Text style={styles.summaryValue}>
              {mask(paidAmount)} {currency}
            </Text>
          </View>

          {debt.status !== 'paid' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress}%`,
                      backgroundColor: isOwe ? tokens.danger : tokens.success,
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </View>

        {debt.status !== 'paid' && (
          <View style={styles.addPaymentCard}>
            <Text style={styles.addPaymentTitle}>{i18n.t('debt.addPayment')}</Text>
            <TextInput
              ref={paymentInputRef}
              style={styles.amountInput}
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              placeholder="0"
              placeholderTextColor={tokens.textMuted}
              keyboardType="decimal-pad"
              maxLength={14}
            />
            <PressableScale
              style={[styles.addPaymentBtn, !canAddPayment && { opacity: 0.5 }]}
              onPress={handleAddPayment}
              activeScale={0.97}
              disabled={!canAddPayment || loading}
            >
              <Plus size={16} color={tokens.white} />
              <Text style={styles.addPaymentBtnText}>{i18n.t('debt.recordPayment')}</Text>
            </PressableScale>
          </View>
        )}

        <Text style={styles.sectionTitle}>{i18n.t('debt.paymentHistory')}</Text>
        {debt.relatedTransactionIds && debt.relatedTransactionIds.length > 0 ? (
          <View>
            {debt.relatedTransactionIds.map((txId) => (
              <PaymentHistoryItem key={txId} transactionId={txId} currency={currency} mask={mask} styles={styles} tokens={tokens} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyPayments}>
            <Text style={styles.emptyText}>{i18n.t('debt.noPayments')}</Text>
          </View>
        )}

        <View style={styles.actionsRow}>
          {debt.status !== 'paid' && (
            <PressableScale
              style={styles.markPaidBtn}
              onPress={handleMarkPaid}
              activeScale={0.97}
            >
              <Check size={16} color={tokens.success} />
              <Text style={styles.markPaidBtnText}>{i18n.t('debt.markPaid')}</Text>
            </PressableScale>
          )}
          <PressableScale
            style={styles.deleteBtn}
            onPress={handleDelete}
            activeScale={0.97}
          >
            <Trash2 size={16} color={tokens.danger} />
            <Text style={styles.deleteBtnText}>{i18n.t('common.delete')}</Text>
          </PressableScale>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PaymentHistoryItem({
  transactionId,
  currency,
  mask,
  styles,
  tokens,
}: {
  transactionId: string;
  currency: string;
  mask: (v: number) => string;
  styles: ReturnType<typeof makeStyles>;
  tokens: ThemeTokens;
}) {
  const [transaction, setTransaction] = React.useState<any>(null);
  const language = useAppStore((s) => s.language);

  useEffect(() => {
    getTransactionById(transactionId).then(setTransaction).catch(() => setTransaction(null));
  }, [transactionId]);

  if (!transaction) return null;

  return (
    <View style={styles.paymentCard}>
      <View style={styles.paymentRow}>
        <Text style={styles.paymentLabel}>{i18n.t('debt.paymentAmount')}</Text>
        <Text style={styles.paymentValue}>
          {mask(transaction.amount)} {currency}
        </Text>
      </View>
      <View style={styles.paymentDate}>
        <Calendar size={11} color={tokens.textMuted} />
        <Text style={styles.paymentDate}>
          {formatDateShort(transaction.timestamp, language)} • {formatTime(transaction.timestamp, language)}
        </Text>
      </View>
    </View>
  );
}
