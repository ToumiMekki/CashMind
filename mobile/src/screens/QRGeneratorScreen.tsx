import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { X, Check, QrCode } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useAppStore } from '../stores/useAppStore';
import { i18n } from '../i18n';
import { radius } from '../theme';
import { formatNumber } from '../utils/format';
import { useTheme } from '../hooks/useTheme';
import { useBalancePrivacy } from '../hooks/useBalancePrivacy';
import { PressableScale } from '../components/ui/PressableScale';
import { getDevice } from '../repositories/deviceRepository';
import { generateQRTransferId } from '../utils/transactionId';
import { buildPayload, payloadToJson } from '../utils/qrTransferPayload';
import type { WalletTransferPayload } from '../database/types';
import type { ThemeTokens } from '../theme/tokens';

const PRESETS = [100, 500, 1000, 5000];

function makeStyles(t: ThemeTokens) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.background, maxWidth: 430, alignSelf: 'center' as const, width: '100%' },
    flex: { flex: 1 },
    header: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, paddingHorizontal: 20, paddingVertical: 16, backgroundColor: t.surface, borderBottomWidth: 1, borderBottomColor: t.border },
    headerTitle: { fontSize: 20, fontWeight: '700' as const, color: t.textPrimary },
    closeButton: { padding: 8 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingVertical: 24, paddingBottom: 24 },
    balanceCard: { backgroundColor: t.primary10, borderRadius: radius.md, padding: 16, marginBottom: 24 },
    balanceLabel: { fontSize: 14, color: t.primary, marginBottom: 4 },
    balanceValue: { fontSize: 22, fontWeight: '700' as const, color: t.primary, fontVariant: ['tabular-nums'] as const },
    inputLabel: { fontSize: 14, fontWeight: '500' as const, color: t.textSecondary, marginBottom: 8 },
    inputRow: { position: 'relative' as const, marginBottom: 12 },
    amountInput: { backgroundColor: t.surface, borderWidth: 2, borderColor: t.border, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 16, fontSize: 24, fontWeight: '700' as const, color: t.textPrimary, fontVariant: ['tabular-nums'] as const },
    currencySuffix: { position: 'absolute' as const, top: 0, bottom: 0, left: 16, justifyContent: 'center' as const, fontSize: 16, color: t.textMuted },
    presets: { flexDirection: 'row' as const, gap: 8, marginBottom: 24 },
    presetButton: { flex: 1, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 12, paddingVertical: 8, alignItems: 'center' as const },
    presetText: { fontSize: 14, fontWeight: '500' as const, color: t.textPrimary, fontVariant: ['tabular-nums'] as const },
    noteInput: { backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: t.textPrimary, marginBottom: 20 },
    senderRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 16 },
    senderLabel: { fontSize: 14, color: t.textSecondary },
    senderValue: { fontSize: 16, fontWeight: '600' as const, color: t.textPrimary },
    errorBox: { backgroundColor: t.dangerLight, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: t.danger },
    errorText: { fontSize: 14, color: t.danger, textAlign: 'center' as const },
    footer: { paddingHorizontal: 20, paddingTop: 16, backgroundColor: t.surface, borderTopWidth: 1, borderTopColor: t.border, gap: 12 },
    generateBtn: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8, backgroundColor: t.primary, paddingVertical: 16, borderRadius: radius.md },
    generateBtnDisabled: { backgroundColor: t.border },
    generateBtnText: { fontSize: 18, fontWeight: '700' as const, color: t.white },
    generateBtnTextDisabled: { color: t.textMuted },
    qrContent: { paddingHorizontal: 24, paddingVertical: 24, alignItems: 'center' as const },
    qrReadyText: { fontSize: 16, color: t.textSecondary, textAlign: 'center' as const, marginBottom: 24 },
    qrBox: { backgroundColor: t.surface, padding: 20, borderRadius: radius.lg, marginBottom: 24, shadowColor: t.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6 },
    summary: { width: '100%', backgroundColor: t.borderLight, borderRadius: radius.md, padding: 16, marginBottom: 24 },
    summaryRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 12 },
    summaryLabel: { fontSize: 14, color: t.textSecondary },
    summaryValue: { fontSize: 16, fontWeight: '600' as const, color: t.textPrimary, fontVariant: ['tabular-nums'] as const },
    footerRow: { flexDirection: 'row' as const, gap: 12, paddingHorizontal: 20, paddingTop: 16, backgroundColor: t.surface, borderTopWidth: 1, borderTopColor: t.border },
    cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: radius.md, backgroundColor: t.borderLight, alignItems: 'center' as const },
    cancelBtnText: { fontSize: 16, fontWeight: '700' as const, color: t.textSecondary },
    confirmBtn: { flex: 1, paddingVertical: 16, borderRadius: radius.md, backgroundColor: t.primary, alignItems: 'center' as const },
    confirmBtnText: { fontSize: 16, fontWeight: '700' as const, color: t.white },
    successRoot: { flex: 1, backgroundColor: t.primary, maxWidth: 430, alignSelf: 'center' as const, width: '100%' },
    successGradient: { flex: 1, backgroundColor: t.primary, justifyContent: 'center' as const, alignItems: 'center' as const, paddingHorizontal: 24 },
    successIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: t.white, justifyContent: 'center' as const, alignItems: 'center' as const, marginBottom: 24 },
    successTitle: { fontSize: 28, fontWeight: '700' as const, color: t.white, textAlign: 'center' as const },
  });
}

export function QRGeneratorScreen() {
  const tokens = useTheme();
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const insets = useSafeAreaInsets();
  const language = useAppStore((s) => s.language);
  const availableBalance = useAppStore((s) => s.availableBalance);
  const setOverlay = useAppStore((s) => s.setOverlay);
  const freezeQrTransfer = useAppStore((s) => s.freezeQrTransfer);
  const cancelQrTransfer = useAppStore((s) => s.cancelQrTransfer);
  const confirmQrSend = useAppStore((s) => s.confirmQrSend);

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [senderName, setSenderName] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<WalletTransferPayload | null>(null);

  const available = availableBalance();
  const numAmount = parseFloat(amount) || 0;
  const isValid = numAmount > 0 && numAmount <= available;
  const wallets = useAppStore((s) => s.wallets);
  const activeWalletId = useAppStore((s) => s.activeWalletId);
  const activeWallet = useMemo(
    () => wallets.find((w) => w.id === activeWalletId),
    [wallets, activeWalletId]
  );
  const currency: string = activeWallet?.currency ?? i18n.t('wallet.currency');
  const { mask } = useBalancePrivacy();

  useEffect(() => {
    getDevice().then((d) => {
      setDeviceId(d.deviceId);
      setSenderName(d.senderName);
    });
  }, []);

  const handleGenerate = async () => {
    setError(null);
    if (numAmount <= 0) {
      setError(i18n.t('qrGenerate.invalidAmount'));
      return;
    }
    if (numAmount > available) {
      setError(i18n.t('qrGenerate.insufficientBalance'));
      return;
    }
    const txId = generateQRTransferId();
    const pl = buildPayload({
      txId,
      senderName: senderName || 'User',
      senderId: deviceId,
      amount: numAmount,
      currency,
      note: note.trim(),
    });
    const result = await freezeQrTransfer({
      txId,
      amount: numAmount,
      note: note.trim(),
      currency,
      senderName: senderName || 'User',
      senderId: deviceId,
    });
    if (result.success === false) {
      setError(result.error ?? i18n.t('qrGenerate.insufficientBalance'));
      return;
    }
    setPayload(pl);
    setShowQR(true);
  };

  const handleCancel = async () => {
    if (payload) {
      await cancelQrTransfer(payload.txId);
    }
    setPayload(null);
    setShowQR(false);
    setOverlay(null);
  };

  const handleConfirmSend = async () => {
    if (!payload) return;
    setError(null);
    const result = await confirmQrSend(payload.txId);
    if (result.success === false) {
      setError(result.error ?? '');
      return;
    }
    setShowSuccess(true);
    await new Promise((r) => setTimeout(r, 1200));
    setOverlay(null);
  };

  if (showSuccess) {
    return (
      <View style={[styles.successRoot, { paddingTop: insets.top, backgroundColor: tokens.primary }]}>
        <View style={styles.successGradient}>
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={styles.successIcon}
          >
            <Check size={48} color={tokens.primary} />
          </Animated.View>
          <Text style={styles.successTitle}>
            {i18n.t('qrGenerate.success')}
          </Text>
        </View>
      </View>
    );
  }

  if (showQR && payload) {
    const qrValue = payloadToJson(payload);
    return (
      <View style={[styles.root, { paddingTop: insets.top, backgroundColor: tokens.background }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{i18n.t('qrGenerate.title')}</Text>
          <Pressable
            style={styles.closeButton}
            onPress={handleCancel}
            hitSlop={12}
          >
            <X size={24} color={tokens.textSecondary} />
          </Pressable>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.qrContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.qrReadyText}>{i18n.t('qrGenerate.qrReady')}</Text>
          <Animated.View
            entering={FadeIn.duration(300)}
            style={styles.qrBox}
          >
            <QRCode
              value={qrValue}
              size={240}
              color={tokens.textPrimary}
              backgroundColor={tokens.surface}
              ecl="M"
            />
          </Animated.View>
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{i18n.t('qrGenerate.amount')}</Text>
              <Text style={styles.summaryValue}>
                {mask(payload.amount)} {payload.currency}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{i18n.t('qrGenerate.senderName')}</Text>
              <Text style={styles.summaryValue}>{payload.senderName}</Text>
            </View>
            {payload.note ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{i18n.t('qrGenerate.note')}</Text>
                <Text style={styles.summaryValue}>{payload.note}</Text>
              </View>
            ) : null}
          </View>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>
        <View style={[styles.footerRow, { paddingBottom: insets.bottom + 16 }]}>
          <PressableScale style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>{i18n.t('qrGenerate.cancel')}</Text>
          </PressableScale>
          <PressableScale style={styles.confirmBtn} onPress={handleConfirmSend}>
            <Text style={styles.confirmBtnText}>
              {i18n.t('qrGenerate.confirmSend')}
            </Text>
          </PressableScale>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: tokens.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{i18n.t('qrGenerate.title')}</Text>
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

          <Text style={styles.inputLabel}>{i18n.t('qrGenerate.amount')}</Text>
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
                style={styles.presetButton}
                onPress={() => setAmount(String(p))}
              >
                <Text style={styles.presetText}>
                  {formatNumber(p, language)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.inputLabel}>{i18n.t('qrGenerate.note')}</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder={i18n.t('qrGenerate.notePlaceholder')}
            placeholderTextColor={tokens.textMuted}
            maxLength={120}
          />

          <View style={styles.senderRow}>
            <Text style={styles.senderLabel}>{i18n.t('qrGenerate.senderName')}</Text>
            <Text style={styles.senderValue}>{senderName || '…'}</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <PressableScale
            style={StyleSheet.flatten([
              styles.generateBtn,
              !isValid && styles.generateBtnDisabled,
            ].filter(Boolean)) as ViewStyle}
            onPress={handleGenerate}
            disabled={!isValid}
          >
            <QrCode size={20} color={isValid ? tokens.white : tokens.textMuted} />
            <Text
              style={StyleSheet.flatten([
                styles.generateBtnText,
                !isValid && styles.generateBtnTextDisabled,
              ].filter(Boolean)) as TextStyle}
            >
              {i18n.t('qrGenerate.generateQR')}
            </Text>
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

