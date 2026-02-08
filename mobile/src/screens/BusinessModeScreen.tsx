import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { RotateCcw, QrCode, ScanLine, LayoutGrid, X, Check } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../stores/useAppStore';
import { playSound } from '../services/soundManager';
import { i18n } from '../i18n';
import { useTheme } from '../hooks/useTheme';
import { AppContainer } from '../components/ui/AppContainer';
import { PressableScale } from '../components/ui/PressableScale';
import {
  buildBusinessPaymentRequest,
  businessPaymentRequestToJson,
} from '../utils/businessPaymentPayload';
import { generateBusinessPaymentId } from '../utils/transactionId';
import type { ThemeTokens } from '../theme/tokens';

const QUICK_AMOUNTS = [100, 500, 1000] as const;
const QR_SIZE = 140;

function makeStyles(t: ThemeTokens) {
  return {
    container: { flex: 1, backgroundColor: t.background },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
      backgroundColor: t.surface,
    },
    title: { fontSize: 18, fontWeight: '700' as const, color: t.textPrimary },
    headerRight: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
    iconBtn: { padding: 6 },
    content: { flex: 1, justifyContent: 'space-between' as const },
    amountSection: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 12,
      backgroundColor: t.surface,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    amountLabel: { fontSize: 12, fontWeight: '600' as const, color: t.textSecondary, marginBottom: 4 },
    amountInput: {
      fontSize: 32,
      fontWeight: '800' as const,
      color: t.textPrimary,
      paddingVertical: 4,
      fontVariant: ['tabular-nums'] as ('tabular-nums')[],
    },
    currencyLabel: { fontSize: 16, fontWeight: '600' as const, color: t.textMuted, marginTop: 2 },
    quickRow: { flexDirection: 'row' as const, gap: 8, marginTop: 10 },
    quickBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center' as const,
      backgroundColor: t.borderLight,
    },
    quickBtnText: { fontSize: 14, fontWeight: '700' as const, color: t.textPrimary, fontVariant: ['tabular-nums'] as ('tabular-nums')[] },
    qrSection: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    qrPlaceholder: {
      width: QR_SIZE + 20,
      height: QR_SIZE + 20,
      borderRadius: 12,
      backgroundColor: t.borderLight,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    qrPlaceholderText: { fontSize: 12, color: t.textMuted, textAlign: 'center' as const, marginTop: 8 },
    qrWrap: {
      padding: 10,
      backgroundColor: t.surface,
      borderRadius: 12,
      shadowColor: t.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
      borderWidth: 1,
      borderColor: t.border,
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 12,
      gap: 8,
    },
    footerRow: {
      flexDirection: 'column' as const,
      gap: 12,
    },
    confirmSimpleBtn: {
      width: '100%',
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: t.success,
      shadowColor: t.success,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    resetBtn: {
      width: '100%',
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: t.borderLight,
    },
    scanConfirmBtn: {
      width: '100%',
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: t.primary,
      shadowColor: t.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    footerBtnText: { fontSize: 15, fontWeight: '700' as const, letterSpacing: 0.2 },
    summarySection: { flex: 1, justifyContent: 'center' as const, padding: 20 },
    summaryCard: {
      backgroundColor: t.surface,
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: t.border,
      marginBottom: 16,
    },
    summaryLabel: { fontSize: 14, fontWeight: '600' as const, color: t.textSecondary, marginBottom: 8 },
    summaryValue: { fontSize: 28, fontWeight: '700' as const, color: t.textPrimary, fontVariant: ['tabular-nums'] as ('tabular-nums')[] },
    backBtn: {
      marginHorizontal: 24,
      marginTop: 16,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center' as const,
      backgroundColor: t.primary,
    },
    backBtnText: { fontSize: 16, fontWeight: '700' as const, color: t.white },
  };
}

type ViewMode = 'payment' | 'summary';

export function BusinessModeScreen() {
  const tokens = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => StyleSheet.create(makeStyles(tokens) as Record<string, object>), [tokens]);

  const wallets = useAppStore((s) => s.wallets);
  const activeWalletId = useAppStore((s) => s.activeWalletId);
  const setOverlay = useAppStore((s) => s.setOverlay);
  const addTransaction = useAppStore((s) => s.addTransaction);
  const transactions = useAppStore((s) => s.transactions);

  const activeWallet = useMemo(
    () => wallets.find((w) => w.id === activeWalletId),
    [wallets, activeWalletId]
  );
  const [amount, setAmount] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('payment');

  const numAmount = parseFloat(amount || '0') || 0;
  const currency = activeWallet?.currency ?? 'DZD';
  const merchantName = activeWallet?.name ?? 'Merchant';

  const qrPayload = useMemo(() => {
    if (numAmount <= 0 || !activeWallet) return null;
    const paymentId = generateBusinessPaymentId();
    return buildBusinessPaymentRequest({
      merchantWalletId: activeWallet.id,
      merchantName,
      amount: numAmount,
      currency,
      paymentId,
    });
  }, [numAmount, activeWallet, merchantName, currency]);

  const qrValue = useMemo(() => {
    if (!qrPayload) return '';
    return businessPaymentRequestToJson(qrPayload);
  }, [qrPayload]);

  const handleQuick = useCallback((v: number) => {
    setAmount((prev) => {
      const n = parseFloat(prev || '0') || 0;
      return String(n + v);
    });
  }, []);

  const handleReset = useCallback(() => setAmount(''), []);

  const handleConfirmSimple = useCallback(async () => {
    if (numAmount <= 0) return;
    const result = await addTransaction({
      type: 'business_payment_receive',
      amount: numAmount,
      method: 'MANUAL',
    });
    if (result.success) {
      playSound('transaction_validate_success');
      setAmount('');
      setOverlay(null);
    } else {
      playSound('transaction_error');
    }
  }, [numAmount, addTransaction, setOverlay]);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const dailyStats = useMemo(() => {
    const today = transactions.filter(
      (tx) =>
        (tx.type === 'business_payment_receive' || tx.type === 'receive') &&
        tx.timestamp >= todayStart
    );
    const total = today.reduce((s, t) => s + t.amount, 0);
    return { totalIncomeToday: total, numberOfTransactions: today.length };
  }, [transactions, todayStart]);

  if (!activeWallet) return null;

  if (viewMode === 'summary') {
    return (
      <AppContainer>
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{i18n.t('businessMode.dailySummary')}</Text>
            <View style={styles.headerRight}>
              <Pressable style={styles.iconBtn} onPress={() => setViewMode('payment')}>
                <LayoutGrid size={24} color={tokens.primary} />
              </Pressable>
              <Pressable style={styles.iconBtn} onPress={() => setOverlay(null)}>
                <X size={24} color={tokens.textSecondary} />
              </Pressable>
            </View>
          </View>
          <View style={styles.content}>
            <View style={styles.summarySection}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{i18n.t('businessMode.totalIncomeToday')}</Text>
                <Text style={styles.summaryValue}>
                  {dailyStats.totalIncomeToday.toLocaleString()} {currency}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{i18n.t('businessMode.numberOfTransactions')}</Text>
                <Text style={styles.summaryValue}>{dailyStats.numberOfTransactions}</Text>
              </View>
            </View>
            <PressableScale style={styles.backBtn} onPress={() => setViewMode('payment')}>
              <Text style={styles.backBtnText}>{i18n.t('businessMode.title')}</Text>
            </PressableScale>
          </View>
        </View>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{i18n.t('businessMode.title')}</Text>
          <View style={styles.headerRight}>
            <Pressable style={styles.iconBtn} onPress={() => setViewMode('summary')}>
              <LayoutGrid size={24} color={tokens.primary} />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => setOverlay(null)}>
              <X size={24} color={tokens.textSecondary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>{i18n.t('businessMode.amount')}</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={tokens.textMuted}
              keyboardType="decimal-pad"
              maxLength={14}
            />
            <Text style={styles.currencyLabel}>{currency}</Text>
            <View style={styles.quickRow}>
              {QUICK_AMOUNTS.map((v) => (
                <Pressable key={v} style={styles.quickBtn} onPress={() => handleQuick(v)}>
                  <Text style={styles.quickBtnText}>+{v}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.qrSection}>
            {numAmount <= 0 ? (
              <View style={styles.qrPlaceholder}>
                <QrCode size={32} color={tokens.textMuted} />
                <Text style={styles.qrPlaceholderText}>{i18n.t('businessMode.amount')}</Text>
              </View>
            ) : (
              <View style={styles.qrWrap}>
                <QRCode
                  value={qrValue || ' '}
                  size={Math.min(QR_SIZE, width - 100)}
                  color={tokens.textPrimary}
                  backgroundColor={tokens.surface}
                  ecl="M"
                />
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <PressableScale
                style={styles.confirmSimpleBtn}
                onPress={handleConfirmSimple}
                activeScale={0.97}
              >
                <Check size={20} color={tokens.white} strokeWidth={2.5} />
                <Text style={[styles.footerBtnText, { color: tokens.white }]}>{i18n.t('businessMode.confirmSimple')}</Text>
              </PressableScale>
              <PressableScale
                style={styles.scanConfirmBtn}
                onPress={() => setOverlay('businessScanConfirm')}
                activeScale={0.97}
              >
                <ScanLine size={20} color={tokens.white} strokeWidth={2.5} />
                <Text style={[styles.footerBtnText, { color: tokens.white }]}>{i18n.t('businessMode.scanConfirmation')}</Text>
              </PressableScale>
            </View>
            <PressableScale style={styles.resetBtn} onPress={handleReset} activeScale={0.97}>
              <RotateCcw size={20} color={tokens.textSecondary} strokeWidth={2.5} />
              <Text style={[styles.footerBtnText, { color: tokens.textSecondary }]}>{i18n.t('businessMode.reset')}</Text>
            </PressableScale>
          </View>
        </View>
      </View>
    </AppContainer>
  );
}
