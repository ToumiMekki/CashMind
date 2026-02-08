import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useAppStore } from '../stores/useAppStore';
import { i18n } from '../i18n';
import { radius } from '../theme';
import type { ThemeTokens } from '../theme/tokens';
import { useBalancePrivacy } from '../hooks/useBalancePrivacy';
import { useTheme } from '../hooks/useTheme';
import { PressableScale } from '../components/ui/PressableScale';
import { isVisionCameraAvailable } from '../utils/visionCameraAvailable';
import { QRScanFallbackView } from './QRScanFallbackView';
import { parsePayload } from '../utils/qrTransferPayload';
import { parseBusinessPaymentRequest, businessPaymentConfirmToJson } from '../utils/businessPaymentPayload';
import { parseFamilySharePayload } from '../utils/familySharePayload';
import { CategorySplashScreen } from './CategorySplashScreen';
import { playSound } from '../services/soundManager';
import type { WalletTransferPayload, BusinessPaymentConfirmPayload } from '../database/types';

const hasCamera = isVisionCameraAvailable();

function makeStyles(t: ThemeTokens) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.background, maxWidth: 430, alignSelf: 'center' as const, width: '100%' },
    header: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, paddingHorizontal: 20, paddingVertical: 16, backgroundColor: t.overlay },
    headerTitle: { fontSize: 20, fontWeight: '700' as const, color: t.white },
    closeButton: { padding: 8 },
    inlineError: { marginHorizontal: 24, marginBottom: 16, padding: 12, backgroundColor: t.dangerLight, borderRadius: radius.md, borderWidth: 1, borderColor: t.danger },
    inlineErrorText: { fontSize: 14, color: t.danger, textAlign: 'center' as const },
    sheet: { backgroundColor: t.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: 24 },
    sheetHandle: { width: 48, height: 4, backgroundColor: t.border, borderRadius: 2, alignSelf: 'center' as const, marginBottom: 24 },
    sheetSummary: { backgroundColor: t.borderLight, borderRadius: radius.md, padding: 16, marginBottom: 24 },
    sheetRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 12 },
    sheetLabel: { fontSize: 14, color: t.textSecondary },
    sheetAmount: { fontSize: 28, fontWeight: '700' as const, color: t.primary, fontVariant: ['tabular-nums'] as const },
    sheetFrom: { fontSize: 16, fontWeight: '500' as const, color: t.textPrimary },
    sheetError: { backgroundColor: t.dangerLight, borderRadius: radius.md, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: t.danger },
    sheetErrorText: { fontSize: 14, color: t.danger, textAlign: 'center' as const },
    sheetButtons: { flexDirection: 'row' as const, gap: 12 },
    sheetButtonCancel: { flex: 1, paddingVertical: 16, borderRadius: radius.md, backgroundColor: t.borderLight, alignItems: 'center' as const },
    sheetButtonCancelText: { fontSize: 16, fontWeight: '700' as const, color: t.textSecondary },
    sheetButtonConfirm: { flex: 1, paddingVertical: 16, borderRadius: radius.md, backgroundColor: t.primary, alignItems: 'center' as const },
    sheetButtonConfirmText: { fontSize: 16, fontWeight: '700' as const, color: t.white },
    successRoot: { flex: 1, backgroundColor: t.primary, maxWidth: 430, alignSelf: 'center' as const, width: '100%' },
    successGradient: { flex: 1, backgroundColor: t.primary, justifyContent: 'center' as const, alignItems: 'center' as const, paddingHorizontal: 24 },
    successIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: t.white, justifyContent: 'center' as const, alignItems: 'center' as const, marginBottom: 24 },
    successTitle: { fontSize: 22, fontWeight: '700' as const, color: t.white, textAlign: 'center' as const },
    businessSuccessScroll: { flexGrow: 1, justifyContent: 'center' as const, alignItems: 'center' as const, paddingHorizontal: 24, paddingVertical: 32 },
    confirmQrWrap: { padding: 20, backgroundColor: t.white, borderRadius: 16, marginTop: 24, marginBottom: 24 },
    doneBtn: { paddingVertical: 16, paddingHorizontal: 32, borderRadius: radius.md, backgroundColor: t.white20, alignSelf: 'center' as const },
    doneBtnText: { fontSize: 16, fontWeight: '700' as const, color: t.primary },
  });
}
const QRScanCameraView = hasCamera
  ? require('./QRScanCameraView').QRScanCameraView
  : null;

type Scanned =
  | { type: 'wallet_transfer'; payload: WalletTransferPayload }
  | { type: 'business_payment'; payload: import('../database/types').BusinessPaymentPayload }
  | { type: 'family_share'; payload: import('../database/types').FamilySharePayload };

export function QRScanScreen() {
  const tokens = useTheme();
  const st = useMemo(() => makeStyles(tokens), [tokens]);
  const insets = useSafeAreaInsets();
  const setOverlay = useAppStore((s) => s.setOverlay);
  const addReceiveFromQR = useAppStore((s) => s.addReceiveFromQR);
  const executeBusinessPaymentAsClient = useAppStore((s) => s.executeBusinessPaymentAsClient);
  const ingestFamilyShare = useAppStore((s) => s.ingestFamilyShare);

  const [scanned, setScanned] = useState<Scanned | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [familyShareSuccess, setFamilyShareSuccess] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [businessConfirmQr, setBusinessConfirmQr] = useState<BusinessPaymentConfirmPayload | null>(null);
  const [showCategoryForQrReceive, setShowCategoryForQrReceive] = useState(false);
  const [qrReceivePayload, setQrReceivePayload] = useState<WalletTransferPayload | null>(null);

  const wallets = useAppStore((s) => s.wallets);
  const activeWalletId = useAppStore((s) => s.activeWalletId);
  const activeWallet = useMemo(
    () => wallets.find((w) => w.id === activeWalletId),
    [wallets, activeWalletId]
  );
  const currency: string = activeWallet?.currency ?? i18n.t('wallet.currency');
  const { mask } = useBalancePrivacy();

  const handleRawCode = useCallback((raw: string) => {
    setScanError(null);
    const wallet = parsePayload(raw);
    if (wallet.ok) {
      playSound('qr_scan_success');
      setScanned({ type: 'wallet_transfer', payload: wallet.payload });
      return;
    }
    const biz = parseBusinessPaymentRequest(raw);
    if (biz.ok) {
      playSound('qr_scan_success');
      setScanned({ type: 'business_payment', payload: biz.payload });
      return;
    }
    const family = parseFamilySharePayload(raw);
    if (family.ok) {
      playSound('qr_scan_success');
      setScanned({ type: 'family_share', payload: family.payload });
      return;
    }
    setScanError(wallet.error || biz.error || family.error || i18n.t('qrScan.invalidQR'));
  }, []);

  const handlePayload = (p: WalletTransferPayload) => {
    setScanError(null);
    playSound('qr_scan_success');
    setScanned({ type: 'wallet_transfer', payload: p });
  };

  const handleCancel = () => {
    setScanned(null);
    setScanError(null);
    setAcceptError(null);
    setBusinessConfirmQr(null);
    setFamilyShareSuccess(false);
    setShowCategoryForQrReceive(false);
    setQrReceivePayload(null);
  };

  const handleAcceptWallet = () => {
    if (!scanned || scanned.type !== 'wallet_transfer') return;
    setQrReceivePayload(scanned.payload);
    setShowCategoryForQrReceive(true);
  };

  const handleCategoryDoneForQrReceive = async (categoryId: string | null) => {
    setShowCategoryForQrReceive(false);
    const payload = qrReceivePayload;
    setQrReceivePayload(null);
    if (!payload) return;
    setAcceptError(null);
    const result = await addReceiveFromQR(payload, categoryId);
    if (result.success === false) {
      playSound('transaction_error');
      setAcceptError(result.error ?? i18n.t('qrScan.duplicate'));
      return;
    }
    playSound('transaction_validate_success');
    setScanned(null);
    setShowSuccess(true);
    await new Promise((r) => setTimeout(r, 1500));
    setOverlay(null);
  };

  const handleAcceptBusiness = async () => {
    if (!scanned || scanned.type !== 'business_payment') return;
    setAcceptError(null);
    const result = await executeBusinessPaymentAsClient(scanned.payload);
    if (result.success === false) {
      playSound('transaction_error');
      setAcceptError(result.error ?? '');
      return;
    }
    setBusinessConfirmQr(result.confirmPayload);
  };

  const handleAcceptFamilyShare = async () => {
    if (!scanned || scanned.type !== 'family_share') return;
    setAcceptError(null);
    const result = await ingestFamilyShare(scanned.payload);
    if (result.success === false) {
      playSound('transaction_error');
      setAcceptError(result.error ?? i18n.t('familyShare.scanError'));
      return;
    }
    setFamilyShareSuccess(true);
    await new Promise((r) => setTimeout(r, 1500));
    setOverlay(null);
  };

  const walletPayload = scanned?.type === 'wallet_transfer' ? scanned.payload : null;
  const familySharePayload = scanned?.type === 'family_share' ? scanned.payload : null;

  if (familyShareSuccess && familySharePayload) {
    return (
      <View style={[st.successRoot, { paddingTop: insets.top, backgroundColor: tokens.primary }]}>
        <View style={[st.successGradient, { backgroundColor: tokens.primary }]}>
          <Animated.View entering={FadeInDown.duration(400)} style={st.successIcon}>
            <Check size={48} color={tokens.primary} />
          </Animated.View>
          <Text style={st.successTitle}>{i18n.t('familyShare.scanSuccess')}</Text>
          <Text style={[st.successTitle, { fontSize: 16, marginTop: 8 }]}>
            {i18n.t('familyShare.scanSuccessFrom', { alias: familySharePayload.owner_alias })}
          </Text>
        </View>
      </View>
    );
  }

  if (showSuccess && walletPayload) {
    return (
      <View style={[st.successRoot, { paddingTop: insets.top, backgroundColor: tokens.primary }]}>
        <View style={[st.successGradient, { backgroundColor: tokens.primary }]}>
          <Animated.View entering={FadeInDown.duration(400)} style={st.successIcon}>
            <Check size={48} color={tokens.primary} />
          </Animated.View>
          <Text style={st.successTitle}>
            {i18n.t('qrScan.success', {
              amount: mask(walletPayload.amount),
              currency: walletPayload.currency,
              sender: walletPayload.senderName,
            })}
          </Text>
        </View>
      </View>
    );
  }

  if (businessConfirmQr) {
    return (
      <View style={[st.successRoot, { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: tokens.primary }]}>
        <ScrollView contentContainerStyle={st.businessSuccessScroll}>
          <Animated.View entering={FadeInDown.duration(400)} style={st.successIcon}>
            <Check size={48} color={tokens.primary} />
          </Animated.View>
          <Text style={st.successTitle}>{i18n.t('businessPay.success')}</Text>
          <View style={st.confirmQrWrap}>
            <QRCode
              value={businessPaymentConfirmToJson(businessConfirmQr)}
              size={200}
              color={tokens.textPrimary}
              backgroundColor={tokens.white}
              ecl="M"
            />
          </View>
          <PressableScale style={st.doneBtn} onPress={() => setOverlay(null)}>
            <Text style={st.doneBtnText}>{i18n.t('businessPay.done')}</Text>
          </PressableScale>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <View style={st.header}>
        <Text style={st.headerTitle}>{i18n.t('qrScan.title')}</Text>
        <Pressable style={st.closeButton} onPress={() => setOverlay(null)} hitSlop={12}>
          <X size={24} color={tokens.white} />
        </Pressable>
      </View>

      {QRScanCameraView ? (
        <QRScanCameraView onRawCode={handleRawCode} pauseScanning={!!scanned} />
      ) : (
        <QRScanFallbackView currency={currency} onPayload={handlePayload} />
      )}

      {scanError && !scanned && (
        <View style={st.inlineError}>
          <Text style={st.inlineErrorText}>{scanError}</Text>
        </View>
      )}

      {scanned?.type === 'wallet_transfer' && (
        <Animated.View
          entering={FadeInDown.springify().damping(30)}
          style={[st.sheet, { paddingBottom: insets.bottom + 24 }]}
        >
          <View style={st.sheetHandle} />
          <View style={st.sheetSummary}>
            <View style={st.sheetRow}>
              <Text style={st.sheetLabel}>{i18n.t('qrScan.amount')}</Text>
              <Text style={st.sheetAmount}>
                {mask(scanned.payload.amount)} {scanned.payload.currency}
              </Text>
            </View>
            <View style={st.sheetRow}>
              <Text style={st.sheetLabel}>{i18n.t('qrScan.from')}</Text>
              <Text style={st.sheetFrom}>{scanned.payload.senderName}</Text>
            </View>
          </View>
          {acceptError && (
            <View style={st.sheetError}>
              <Text style={st.sheetErrorText}>{acceptError}</Text>
            </View>
          )}
          <View style={st.sheetButtons}>
            <PressableScale style={st.sheetButtonCancel} onPress={handleCancel}>
              <Text style={st.sheetButtonCancelText}>{i18n.t('qrScan.cancel')}</Text>
            </PressableScale>
            <PressableScale style={st.sheetButtonConfirm} onPress={handleAcceptWallet}>
              <Text style={st.sheetButtonConfirmText}>{i18n.t('qrScan.confirm')}</Text>
            </PressableScale>
          </View>
        </Animated.View>
      )}

      <CategorySplashScreen
        visible={showCategoryForQrReceive}
        walletId={activeWalletId ?? ''}
        flowType="receive"
        onSelect={handleCategoryDoneForQrReceive}
        onSkip={() => handleCategoryDoneForQrReceive(null)}
        onClose={() => {
          setShowCategoryForQrReceive(false);
          setQrReceivePayload(null);
        }}
      />

      {scanned?.type === 'business_payment' && (
        <Animated.View
          entering={FadeInDown.springify().damping(30)}
          style={[st.sheet, { paddingBottom: insets.bottom + 24 }]}
        >
          <View style={st.sheetHandle} />
          <View style={st.sheetSummary}>
            <View style={st.sheetRow}>
              <Text style={st.sheetLabel}>{i18n.t('businessPay.merchant')}</Text>
              <Text style={st.sheetFrom}>{scanned.payload.merchant_name}</Text>
            </View>
            <View style={st.sheetRow}>
              <Text style={st.sheetLabel}>{i18n.t('businessPay.amount')}</Text>
              <Text style={st.sheetAmount}>
                {mask(scanned.payload.amount)} {scanned.payload.currency}
              </Text>
            </View>
          </View>
          {acceptError && (
            <View style={st.sheetError}>
              <Text style={st.sheetErrorText}>{acceptError}</Text>
            </View>
          )}
          <View style={st.sheetButtons}>
            <PressableScale style={st.sheetButtonCancel} onPress={handleCancel}>
              <Text style={st.sheetButtonCancelText}>{i18n.t('businessPay.cancel')}</Text>
            </PressableScale>
            <PressableScale style={st.sheetButtonConfirm} onPress={handleAcceptBusiness}>
              <Text style={st.sheetButtonConfirmText}>{i18n.t('businessPay.confirm')}</Text>
            </PressableScale>
          </View>
        </Animated.View>
      )}

      {scanned?.type === 'family_share' && (
        <Animated.View
          entering={FadeInDown.springify().damping(30)}
          style={[st.sheet, { paddingBottom: insets.bottom + 24 }]}
        >
          <View style={st.sheetHandle} />
          <View style={st.sheetSummary}>
            <View style={st.sheetRow}>
              <Text style={st.sheetLabel}>{i18n.t('familyShare.scanMember')}</Text>
              <Text style={st.sheetFrom}>{scanned.payload.owner_alias}</Text>
            </View>
            <View style={st.sheetRow}>
              <Text style={st.sheetLabel}>{i18n.t('familyShare.scanTransactions')}</Text>
              <Text style={st.sheetFrom}>
                {scanned.payload.shared_transactions.length} {i18n.t('familyShare.transactions')}
              </Text>
            </View>
            <View style={st.sheetRow}>
              <Text style={st.sheetLabel}>{i18n.t('wallet.currency')}</Text>
              <Text style={st.sheetFrom}>{scanned.payload.currency}</Text>
            </View>
          </View>
          {acceptError && (
            <View style={st.sheetError}>
              <Text style={st.sheetErrorText}>{acceptError}</Text>
            </View>
          )}
          <View style={st.sheetButtons}>
            <PressableScale style={st.sheetButtonCancel} onPress={handleCancel}>
              <Text style={st.sheetButtonCancelText}>{i18n.t('qrScan.cancel')}</Text>
            </PressableScale>
            <PressableScale style={st.sheetButtonConfirm} onPress={handleAcceptFamilyShare}>
              <Text style={st.sheetButtonConfirmText}>{i18n.t('familyShare.scanAdd')}</Text>
            </PressableScale>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
