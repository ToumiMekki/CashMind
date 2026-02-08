import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { X, Check, QrCode, ChevronLeft, ChevronRight, ImagePlus, Camera } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useAppStore } from '../stores/useAppStore';
import { playSound } from '../services/soundManager';
import { i18n } from '../i18n';
import { radius } from '../theme';
import { formatNumber } from '../utils/format';
import { useTheme } from '../hooks/useTheme';
import { useBalancePrivacy } from '../hooks/useBalancePrivacy';
import { PressableScale } from '../components/ui/PressableScale';
import { CategorySplashScreen } from './CategorySplashScreen';
import { TransactionImageThumbnail } from '../components/TransactionImageThumbnail';
import { pickFromGalleryAndStore, takePhotoAndStore } from '../services/imageService';
import { getDevice } from '../repositories/deviceRepository';
import { generateQRTransferId } from '../utils/transactionId';
import { buildPayload, payloadToJson } from '../utils/qrTransferPayload';
import type { WalletTransferPayload } from '../database/types';

const PRESETS = [100, 500, 1000, 5000];

export function PayScreen() {
  const tokens = useTheme();
  const insets = useSafeAreaInsets();
  const language = useAppStore((s) => s.language);
  const availableBalance = useAppStore((s) => s.availableBalance);
  const setOverlay = useAppStore((s) => s.setOverlay);
  const addTransaction = useAppStore((s) => s.addTransaction);
  const freezeQrTransfer = useAppStore((s) => s.freezeQrTransfer);
  const cancelQrTransfer = useAppStore((s) => s.cancelQrTransfer);
  const confirmQrSend = useAppStore((s) => s.confirmQrSend);
  const wallets = useAppStore((s) => s.wallets);
  const activeWalletId = useAppStore((s) => s.activeWalletId);
  const { mask } = useBalancePrivacy();
  const activeWallet = useMemo(
    () => wallets.find((w) => w.id === activeWalletId),
    [wallets, activeWalletId]
  );
  const currency: string = activeWallet?.currency ?? i18n.t('wallet.currency');

  const txIdRef = useRef<string>(generateQRTransferId());
  const [mode, setMode] = useState<'manual' | 'qr' | null>(null);
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [senderName, setSenderName] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [note, setNote] = useState('');
  const [generated, setGenerated] = useState(false);
  const [frozenPayload, setFrozenPayload] = useState<WalletTransferPayload | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCategory, setShowCategory] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const amountInputRef = useRef<TextInput>(null);

  const available = availableBalance();
  const numAmount = parseFloat(amount) || 0;
  const displayName = (senderName || '').trim();
  const canUseQR = displayName.length > 0;
  const isValidAmount = numAmount > 0 && numAmount <= available;
  const isValidManual = isValidAmount && (receiverName || '').trim().length > 0;
  const isValidQR = isValidAmount && canUseQR;

  useEffect(() => {
    getDevice().then((d) => {
      setDeviceId(d.deviceId);
      setSenderName(d.senderName);
    });
  }, []);

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
    amountInputRef.current?.blur();
  };

  const totalSteps = mode === null ? 1 : 3;
  const currentStep = mode === null ? 0 : step + 1;

  const goNext = () => {
    setError(null);
    if (mode === null) return;
    if (step < 2) setStep(step + 1);
  };

  const goBack = () => {
    setError(null);
    if (step > 0) setStep(step - 1);
    else setMode(null);
  };

  const canProceed = () => {
    if (mode === null) return false;
    if (step === 0) return isValidAmount && (mode === 'manual' ? (receiverName || '').trim().length > 0 : canUseQR);
    return true;
  };

  const doConfirmSend = async (categoryId: string | null) => {
    if (!frozenPayload) return;
    setError(null);
    const result = await confirmQrSend(frozenPayload.txId, categoryId, selectedImageUri ?? undefined);
    if (result.success === false) {
      playSound('transaction_error');
      setError(result.error ?? '');
      return;
    }
    playSound('transaction_validate_success');
    setShowSuccess(true);
    await new Promise((r) => setTimeout(r, 1200));
    setOverlay(null);
  };


  const doManualPay = async (categoryId: string | null) => {
    setError(null);
    if (!isValidManual) return;
    const result = await addTransaction({
      type: 'send',
      amount: numAmount,
      receiver: (receiverName || '').trim(),
      category: (note || '').trim(),
      categoryId: categoryId ?? undefined,
      method: 'MANUAL',
      sender: displayName || undefined,
      senderId: deviceId || undefined,
      invoiceImage: selectedImageUri ?? undefined,
    });
    if (result.success === false) {
      playSound('transaction_error');
      setError(result.error ?? i18n.t('pay.insufficientBalance'));
      return;
    }
    playSound('transaction_validate_success');
    setShowSuccess(true);
    await new Promise((r) => setTimeout(r, 1200));
    setOverlay(null);
  };

  const handleGenerateQR = async () => {
    setError(null);
    if (!canUseQR || numAmount <= 0 || numAmount > available) return;
    const pl = buildPayload({
      txId: txIdRef.current,
      senderName: displayName,
      senderId: deviceId,
      amount: numAmount,
      currency,
      note: note.trim(),
    });
    const result = await freezeQrTransfer({
      txId: pl.txId,
      amount: numAmount,
      note: note.trim(),
      currency,
      senderName: displayName,
      senderId: deviceId,
    });
    if (result.success === false) {
      playSound('transaction_error');
      setError(result.error ?? i18n.t('pay.insufficientBalance'));
      return;
    }
    setFrozenPayload(pl);
    setGenerated(true);
    setStep(1);
  };

  const handleCancelQR = async () => {
    if (frozenPayload) await cancelQrTransfer(frozenPayload.txId);
    txIdRef.current = generateQRTransferId();
    setFrozenPayload(null);
    setGenerated(false);
    setStep(1);
  };

  if (showSuccess) {
    return (
      <View style={[styles.successRoot, { paddingTop: insets.top, backgroundColor: tokens.primary }]}>
        <View style={styles.successGradient}>
          <Animated.View entering={FadeInDown.duration(400)} style={[styles.successIcon, { backgroundColor: tokens.white }]}>
            <Check size={48} color={tokens.primary} />
          </Animated.View>
          <Text style={[styles.successTitle, { color: tokens.white }]}>{i18n.t('pay.success')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: tokens.background }]}>
      <View style={styles.header}>
        <Pressable onPress={mode === null ? () => setOverlay(null) : goBack} style={styles.backBtn} hitSlop={12}>
          <ChevronLeft size={28} color={tokens.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: tokens.textPrimary }]}>{i18n.t('pay.title')}</Text>
        <Pressable onPress={() => setOverlay(null)} style={styles.closeBtn} hitSlop={12}>
          <X size={24} color={tokens.textSecondary} />
        </Pressable>
      </View>

      {mode === null ? (
        <Animated.View entering={FadeIn.duration(200)} style={styles.stepContent}>
          <Text style={[styles.stepTitle, { color: tokens.textPrimary }]}>{i18n.t('pay.title')}</Text>
          <Text style={[styles.stepSubtitle, { color: tokens.textSecondary }]}>
            {i18n.t('pay.manualPayment')} or {i18n.t('pay.payWithQR')}
          </Text>
          <View style={styles.modeRow}>
            <PressableScale
              style={[styles.modeCard, { backgroundColor: tokens.surface }]}
              onPress={() => { setMode('manual'); setStep(0); }}
              activeScale={0.97}
            >
              <Text style={[styles.modeCardTitle, { color: tokens.textPrimary }]}>{i18n.t('pay.manualPayment')}</Text>
            </PressableScale>
            <PressableScale
              style={[styles.modeCard, { backgroundColor: tokens.surface }]}
              onPress={() => { setMode('qr'); setStep(0); }}
              activeScale={0.97}
            >
              <QrCode size={32} color={tokens.primary} />
              <Text style={[styles.modeCardTitle, { color: tokens.textPrimary }]}>{i18n.t('pay.payWithQR')}</Text>
            </PressableScale>
          </View>
        </Animated.View>
      ) : (
        <>
          <View style={styles.stepIndicator}>
            <Text style={[styles.stepIndicatorText, { color: tokens.textMuted }]}>
              {i18n.t('pay.stepOf', { current: currentStep, total: totalSteps })}
            </Text>
            <View style={styles.dots}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: i <= step ? tokens.primary : tokens.border },
                  ]}
                />
              ))}
            </View>
          </View>

          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
          >
            {keyboardHeight > 0 && step === 0 && (
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
            <Animated.View entering={FadeIn.duration(180)} key={step} style={styles.stepContent}>
              {step === 0 && (
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  <Text style={[styles.stepLabel, { color: tokens.textSecondary }]}>{i18n.t('pay.stepAmount')}</Text>
                  <View style={[styles.amountWrap, { borderColor: tokens.border }]}>
                    <TextInput
                      ref={amountInputRef}
                      style={[styles.amountInput, { color: tokens.textPrimary }]}
                      value={amount}
                      onChangeText={(t) => { setAmount(t); setError(null); }}
                      placeholder="0"
                      placeholderTextColor={tokens.textMuted}
                      keyboardType="decimal-pad"
                      maxLength={12}
                    />
                    <Text style={[styles.currencySuffix, { color: tokens.textMuted }]}>{currency}</Text>
                  </View>
                  <Text style={[styles.balanceHint, { color: tokens.textMuted }]}>
                    {i18n.t('pay.balance')}: {mask(available)} {currency}
                  </Text>
                  <View style={[styles.presets, { marginBottom: 20 }]}>
                    {PRESETS.map((p) => (
                      <Pressable key={p} style={[styles.presetBtn, { backgroundColor: tokens.surface }]} onPress={() => setAmount(String(p))}>
                        <Text style={[styles.presetText, { color: tokens.textPrimary }]}>{formatNumber(p, language)}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={[styles.stepLabel, { color: tokens.textSecondary }]}>
                    {mode === 'manual' ? i18n.t('pay.stepReceiver') : i18n.t('pay.senderName')}
                  </Text>
                  <TextInput
                    style={[styles.textInputCompact, { color: tokens.textPrimary, borderColor: tokens.border }]}
                    value={mode === 'manual' ? receiverName : senderName}
                    onChangeText={mode === 'manual' ? setReceiverName : setSenderName}
                    placeholder={mode === 'manual' ? i18n.t('pay.receiverPlaceholder') : i18n.t('pay.senderName')}
                    placeholderTextColor={tokens.textMuted}
                    maxLength={120}
                  />
                  <Text style={[styles.optionalLabel, { color: tokens.textMuted }]}>{i18n.t('pay.stepNote')}</Text>
                  <TextInput
                    style={[styles.textInputCompact, styles.optionalInput, { color: tokens.textPrimary, borderColor: tokens.border }]}
                    value={note}
                    onChangeText={setNote}
                    placeholder={i18n.t('pay.notePlaceholder')}
                    placeholderTextColor={tokens.textMuted}
                    maxLength={120}
                  />
                  <Text style={[styles.optionalLabel, { color: tokens.textMuted }]}>{i18n.t('pay.stepCategory')}</Text>
                  <PressableScale
                    style={[styles.categoryTriggerCompact, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                    onPress={() => setShowCategory(true)}
                    activeScale={0.98}
                  >
                    <Text style={[styles.categoryTriggerText, { color: tokens.primary }]}>
                      {selectedCategoryId ? i18n.t('category.chooseCategory') + ' ✓' : i18n.t('category.skip')}
                    </Text>
                  </PressableScale>
                </ScrollView>
              )}

              {step === 1 && mode === 'manual' && (
                <>
                  <Text style={[styles.stepLabel, { color: tokens.textSecondary }]}>{i18n.t('pay.stepConfirm')}</Text>
                  <View style={[styles.summaryCard, { backgroundColor: tokens.surface }]}>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: tokens.textMuted }]}>{i18n.t('pay.amount')}</Text>
                      <Text style={[styles.summaryValue, { color: tokens.textPrimary }]}>{mask(numAmount)} {currency}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: tokens.textMuted }]}>{i18n.t('pay.receiverName')}</Text>
                      <Text style={[styles.summaryValue, { color: tokens.textPrimary }]}>{receiverName}</Text>
                    </View>
                    {note ? (
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: tokens.textMuted }]}>{i18n.t('pay.note')}</Text>
                        <Text style={[styles.summaryValue, { color: tokens.textPrimary }]}>{note}</Text>
                      </View>
                    ) : null}
                    <View style={[styles.summaryRow, { marginTop: 12, flexDirection: 'column', alignItems: 'stretch' }]}>
                      <Text style={[styles.summaryLabel, { color: tokens.textMuted, marginBottom: 10 }]}>{i18n.t('pay.attachImage')}</Text>
                      {selectedImageUri ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <TransactionImageThumbnail uri={selectedImageUri} />
                          <PressableScale
                            style={[styles.secondaryBtn, { paddingVertical: 10, paddingHorizontal: 16, borderColor: tokens.danger }]}
                            onPress={() => setSelectedImageUri(null)}
                            activeScale={0.98}
                          >
                            <Text style={[styles.secondaryBtnText, { color: tokens.danger, fontSize: 14 }]}>{i18n.t('pay.cancel')}</Text>
                          </PressableScale>
                        </View>
                      ) : (
                        <View style={styles.attachImageButtons}>
                          <PressableScale
                            style={[styles.attachImageBtnFull, { borderColor: tokens.border, backgroundColor: tokens.borderLight }]}
                            onPress={async () => {
                              const uri = await pickFromGalleryAndStore();
                              if (uri) {
                                setSelectedImageUri(uri);
                                playSound('photo_attached');
                              }
                            }}
                            activeScale={0.98}
                          >
                            <ImagePlus size={20} color={tokens.primary} />
                            <Text style={[styles.attachImageText, { color: tokens.primary }]}>{i18n.t('pay.fromGallery')}</Text>
                          </PressableScale>
                          <PressableScale
                            style={[styles.attachImageBtnFull, { borderColor: tokens.border, backgroundColor: tokens.borderLight }]}
                            onPress={async () => {
                              const uri = await takePhotoAndStore();
                              if (uri) {
                                setSelectedImageUri(uri);
                                playSound('photo_attached');
                              }
                            }}
                            activeScale={0.98}
                          >
                            <Camera size={20} color={tokens.primary} />
                            <Text style={[styles.attachImageText, { color: tokens.primary }]}>{i18n.t('pay.takePhoto')}</Text>
                          </PressableScale>
                        </View>
                      )}
                    </View>
                  </View>
                  <PressableScale
                    style={[styles.primaryBtn, { backgroundColor: tokens.primary }]}
                    onPress={() => doManualPay(selectedCategoryId)}
                    activeScale={0.98}
                  >
                    <Text style={styles.primaryBtnText}>{i18n.t('pay.confirmPay')}</Text>
                  </PressableScale>
                </>
              )}

              {step === 1 && mode === 'qr' && !generated && (
                <>
                  <Text style={[styles.stepLabel, { color: tokens.textSecondary }]}>{i18n.t('pay.stepConfirm')}</Text>
                  <View style={[styles.summaryCard, { backgroundColor: tokens.surface }]}>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: tokens.textMuted }]}>{i18n.t('pay.amount')}</Text>
                      <Text style={[styles.summaryValue, { color: tokens.textPrimary }]}>{mask(numAmount)} {currency}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: tokens.textMuted }]}>{i18n.t('pay.senderName')}</Text>
                      <Text style={[styles.summaryValue, { color: tokens.textPrimary }]}>{displayName}</Text>
                    </View>
                  </View>
                  {!canUseQR && (
                    <Text style={[styles.errorText, { color: tokens.danger }]}>{i18n.t('pay.setDisplayName')}</Text>
                  )}
                  <PressableScale
                    style={[styles.primaryBtn, { backgroundColor: canUseQR ? tokens.primary : tokens.border }]}
                    onPress={handleGenerateQR}
                    disabled={!canUseQR}
                    activeScale={0.98}
                  >
                    <QrCode size={22} color={canUseQR ? tokens.white : tokens.textMuted} />
                    <Text style={[styles.primaryBtnText, { color: canUseQR ? tokens.white : tokens.textMuted }]}>{i18n.t('pay.generateQR')}</Text>
                  </PressableScale>
                </>
              )}

              {step === 1 && mode === 'qr' && generated && frozenPayload && (
                <>
                  <Text style={[styles.stepLabel, { color: tokens.textSecondary }]}>{i18n.t('pay.scanLabel')}</Text>
                  <View style={[styles.qrBox, { backgroundColor: tokens.surface }]}>
                    <QRCode value={payloadToJson(frozenPayload)} size={200} color={tokens.textPrimary} backgroundColor={tokens.surface} ecl="M" />
                  </View>
                  <View style={[styles.summaryRow, { marginBottom: 16, flexDirection: 'column', alignItems: 'stretch' }]}>
                    <Text style={[styles.summaryLabel, { color: tokens.textMuted, marginBottom: 10 }]}>{i18n.t('pay.attachImage')}</Text>
                    {selectedImageUri ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <TransactionImageThumbnail uri={selectedImageUri} />
                        <PressableScale
                          style={[styles.secondaryBtn, { paddingVertical: 10, paddingHorizontal: 16, borderColor: tokens.danger }]}
                          onPress={() => setSelectedImageUri(null)}
                          activeScale={0.98}
                        >
                          <Text style={[styles.secondaryBtnText, { color: tokens.danger, fontSize: 14 }]}>{i18n.t('pay.cancel')}</Text>
                        </PressableScale>
                      </View>
                    ) : (
                      <View style={styles.attachImageButtons}>
                        <PressableScale
                          style={[styles.attachImageBtnFull, { borderColor: tokens.border, backgroundColor: tokens.borderLight }]}
                          onPress={async () => {
                            const uri = await pickFromGalleryAndStore();
                            if (uri) {
                              setSelectedImageUri(uri);
                              playSound('photo_attached');
                            }
                          }}
                          activeScale={0.98}
                        >
                          <ImagePlus size={20} color={tokens.primary} />
                          <Text style={[styles.attachImageText, { color: tokens.primary }]}>{i18n.t('pay.fromGallery')}</Text>
                        </PressableScale>
                        <PressableScale
                          style={[styles.attachImageBtnFull, { borderColor: tokens.border, backgroundColor: tokens.borderLight }]}
                          onPress={async () => {
                            const uri = await takePhotoAndStore();
                            if (uri) {
                              setSelectedImageUri(uri);
                              playSound('photo_attached');
                            }
                          }}
                          activeScale={0.98}
                        >
                          <Camera size={20} color={tokens.primary} />
                          <Text style={[styles.attachImageText, { color: tokens.primary }]}>{i18n.t('pay.takePhoto')}</Text>
                        </PressableScale>
                      </View>
                    )}
                  </View>
                  <PressableScale
                    style={[styles.primaryBtn, { backgroundColor: tokens.primary }]}
                    onPress={() => doConfirmSend(selectedCategoryId)}
                    activeScale={0.98}
                  >
                    <Text style={styles.primaryBtnText}>{i18n.t('pay.confirmSend')}</Text>
                  </PressableScale>
                  <PressableScale style={[styles.secondaryBtn, { borderColor: tokens.border }]} onPress={handleCancelQR} activeScale={0.98}>
                    <Text style={[styles.secondaryBtnText, { color: tokens.textSecondary }]}>{i18n.t('pay.cancel')}</Text>
                  </PressableScale>
                </>
              )}
            </Animated.View>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: tokens.dangerLight, borderColor: tokens.danger }]}>
                <Text style={[styles.errorText, { color: tokens.danger }]}>{error}</Text>
              </View>
            ) : null}

            {step === 0 && (
              <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <PressableScale
                  style={[styles.nextBtn, { backgroundColor: canProceed() ? tokens.primary : tokens.border }]}
                  onPress={goNext}
                  disabled={!canProceed()}
                  activeScale={0.98}
                >
                  <Text style={[styles.nextBtnText, { color: canProceed() ? tokens.white : tokens.textMuted }]}>{i18n.t('pay.next')}</Text>
                  <ChevronRight size={20} color={canProceed() ? tokens.white : tokens.textMuted} />
                </PressableScale>
              </View>
            )}
          </KeyboardAvoidingView>
        </>
      )}

      <CategorySplashScreen
        visible={showCategory}
        walletId={activeWalletId ?? ''}
        flowType="pay"
        onSelect={(id) => {
          setSelectedCategoryId(id);
          setShowCategory(false);
        }}
        onSkip={() => {
          setSelectedCategoryId(null);
          setShowCategory(false);
        }}
        onClose={() => setShowCategory(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    maxWidth: 430,
    alignSelf: 'center',
    width: '100%',
  },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 8 },
  closeBtn: { padding: 8 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  stepIndicator: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  stepIndicatorText: {
    fontSize: 13,
    marginBottom: 8,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  stepLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  modeRow: {
    gap: 16,
  },
  modeCard: {
    padding: 24,
    borderRadius: radius.lg,
    marginBottom: 12,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  modeCardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  amountWrap: {
    borderWidth: 2,
    borderRadius: radius.lg,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
  },
  amountInput: {
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    minHeight: 40,
  },
  currencySuffix: {
    fontSize: 16,
    marginTop: 4,
  },
  keyboardAccessory: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  doneButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  balanceHint: {
    fontSize: 14,
    marginBottom: 20,
  },
  presets: {
    flexDirection: 'row',
    gap: 12,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  presetText: {
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  textInput: {
    borderWidth: 2,
    borderRadius: radius.lg,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
  },
  textInputCompact: {
    borderWidth: 2,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  optionalLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  optionalInput: {
    minHeight: 44,
    marginBottom: 12,
  },
  categoryTriggerCompact: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  categoryTrigger: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    padding: 24,
    alignItems: 'center',
  },
  categoryTriggerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  skipCategoryBtn: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipCategoryText: {
    fontSize: 15,
    fontWeight: '500',
  },
  summaryCard: {
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'] },
  attachImageButtons: {
    gap: 10,
  },
  attachImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  attachImageBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    minHeight: 52,
  },
  attachImageText: { fontSize: 15, fontWeight: '600' },
  qrBox: {
    alignSelf: 'center',
    padding: 20,
    borderRadius: radius.lg,
    marginBottom: 24,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: radius.lg,
    marginBottom: 12,
  },
  primaryBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 16,
    borderRadius: radius.lg,
    borderWidth: 2,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: radius.lg,
  },
  nextBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  errorBox: {
    marginHorizontal: 24,
    marginTop: 16,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  successRoot: {
    flex: 1,
    maxWidth: 430,
    alignSelf: 'center',
    width: '100%',
  },
  successGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
});
