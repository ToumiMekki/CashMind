import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { X, Check, ChevronLeft, ChevronRight, Download } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../stores/useAppStore';
import { playSound } from '../services/soundManager';
import { i18n } from '../i18n';
import { radius } from '../theme';
import { formatNumber } from '../utils/format';
import { useTheme } from '../hooks/useTheme';
import { PressableScale } from '../components/ui/PressableScale';
import { CategorySplashScreen } from './CategorySplashScreen';

const PRESETS = [100, 500, 1000, 5000];

export function ReceiveScreen() {
  const tokens = useTheme();
  const insets = useSafeAreaInsets();
  const language = useAppStore((s) => s.language);
  const setOverlay = useAppStore((s) => s.setOverlay);
  const addTransaction = useAppStore((s) => s.addTransaction);
  const wallets = useAppStore((s) => s.wallets);
  const activeWalletId = useAppStore((s) => s.activeWalletId);
  const activeWallet = useMemo(
    () => wallets.find((w) => w.id === activeWalletId),
    [wallets, activeWalletId]
  );
  const currency = activeWallet?.currency ?? i18n.t('wallet.currency');

  const [mode, setMode] = useState<'manual' | 'qr' | null>(null);
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState('');
  const [senderName, setSenderName] = useState('');
  const [note, setNote] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCategory, setShowCategory] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const amountInputRef = useRef<TextInput>(null);

  const numAmount = parseFloat(amount) || 0;
  const isValid = numAmount > 0 && (senderName || '').trim().length > 0;

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
    if (step === 0) return numAmount > 0 && (senderName || '').trim().length > 0;
    return true;
  };

  const doManualReceive = async (categoryId: string | null) => {
    setError(null);
    if (!isValid) return;
    const result = await addTransaction({
      type: 'receive',
      amount: numAmount,
      sender: (senderName || '').trim(),
      category: (note || '').trim(),
      categoryId: categoryId ?? undefined,
      method: 'MANUAL',
    });
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

  const openScanner = () => {
    setOverlay('qrScan');
  };

  if (showSuccess) {
    return (
      <View style={[styles.successRoot, { paddingTop: insets.top, backgroundColor: tokens.primary }]}>
        <View style={styles.successGradient}>
          <Animated.View entering={FadeInDown.duration(400)} style={[styles.successIcon, { backgroundColor: tokens.white }]}>
            <Check size={48} color={tokens.primary} />
          </Animated.View>
          <Text style={[styles.successTitle, { color: tokens.white }]}>{i18n.t('receive.success')}</Text>
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
        <Text style={[styles.headerTitle, { color: tokens.textPrimary }]}>{i18n.t('receive.title')}</Text>
        <Pressable onPress={() => setOverlay(null)} style={styles.closeBtn} hitSlop={12}>
          <X size={24} color={tokens.textSecondary} />
        </Pressable>
      </View>

      {mode === null ? (
        <Animated.View entering={FadeIn.duration(200)} style={styles.stepContent}>
          <Text style={[styles.stepTitle, { color: tokens.textPrimary }]}>{i18n.t('receive.title')}</Text>
          <Text style={[styles.stepSubtitle, { color: tokens.textSecondary }]}>
            {i18n.t('receive.manualReceive')} or {i18n.t('receive.receiveWithQR')}
          </Text>
          <View style={styles.modeRow}>
            <PressableScale
              style={[styles.modeCard, { backgroundColor: tokens.surface }]}
              onPress={() => { setMode('manual'); setStep(0); }}
              activeScale={0.97}
            >
              <Text style={[styles.modeCardTitle, { color: tokens.textPrimary }]}>{i18n.t('receive.manualReceive')}</Text>
            </PressableScale>
            <PressableScale
              style={[styles.modeCard, { backgroundColor: tokens.surface }]}
              onPress={openScanner}
              activeScale={0.97}
            >
              <Download size={32} color={tokens.primary} />
              <Text style={[styles.modeCardTitle, { color: tokens.textPrimary }]}>{i18n.t('receive.receiveWithQR')}</Text>
            </PressableScale>
          </View>
        </Animated.View>
      ) : (
        <React.Fragment>
          <View style={styles.stepIndicator}>
            <Text style={[styles.stepIndicatorText, { color: tokens.textMuted }]}>
              {i18n.t('receive.stepOf', { current: currentStep, total: totalSteps })}
            </Text>
            <View style={styles.dots}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={[styles.dot, { backgroundColor: i <= step ? tokens.primary : tokens.border }]} />
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
                  <Text style={[styles.stepLabel, { color: tokens.textSecondary }]}>{i18n.t('receive.stepAmount')}</Text>
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
                  <View style={[styles.presets, { marginBottom: 20 }]}>
                    {PRESETS.map((p) => (
                      <Pressable key={p} style={[styles.presetBtn, { backgroundColor: tokens.surface }]} onPress={() => setAmount(String(p))}>
                        <Text style={[styles.presetText, { color: tokens.textPrimary }]}>{formatNumber(p, language)}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={[styles.stepLabel, { color: tokens.textSecondary }]}>{i18n.t('receive.stepSender')}</Text>
                  <TextInput
                    style={[styles.textInputCompact, { color: tokens.textPrimary, borderColor: tokens.border }]}
                    value={senderName}
                    onChangeText={(t) => { setSenderName(t); setError(null); }}
                    placeholder={i18n.t('receive.senderPlaceholder')}
                    placeholderTextColor={tokens.textMuted}
                    maxLength={120}
                  />
                  <Text style={[styles.optionalLabel, { color: tokens.textMuted }]}>{i18n.t('receive.stepNote')}</Text>
                  <TextInput
                    style={[styles.textInputCompact, styles.optionalInput, { color: tokens.textPrimary, borderColor: tokens.border }]}
                    value={note}
                    onChangeText={setNote}
                    placeholder={i18n.t('receive.notePlaceholder')}
                    placeholderTextColor={tokens.textMuted}
                    maxLength={120}
                  />
                  <Text style={[styles.optionalLabel, { color: tokens.textMuted }]}>{i18n.t('receive.stepCategory')}</Text>
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

              {step === 1 && (
                <>
                  <Text style={[styles.stepLabel, { color: tokens.textSecondary }]}>{i18n.t('receive.stepConfirm')}</Text>
                  <View style={[styles.summaryCard, { backgroundColor: tokens.surface }]}>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: tokens.textMuted }]}>{i18n.t('receive.amount')}</Text>
                      <Text style={[styles.summaryValue, { color: tokens.textPrimary }]}>{numAmount} {currency}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: tokens.textMuted }]}>{i18n.t('receive.senderName')}</Text>
                      <Text style={[styles.summaryValue, { color: tokens.textPrimary }]}>{senderName}</Text>
                    </View>
                    {note ? (
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: tokens.textMuted }]}>{i18n.t('receive.note')}</Text>
                        <Text style={[styles.summaryValue, { color: tokens.textPrimary }]}>{note}</Text>
                      </View>
                    ) : null}
                  </View>
                  <PressableScale
                    style={[styles.primaryBtn, { backgroundColor: tokens.primary }]}
                    onPress={() => doManualReceive(selectedCategoryId)}
                    activeScale={0.98}
                  >
                    <Text style={[styles.primaryBtnText, { color: tokens.white }]}>{i18n.t('receive.confirm')}</Text>
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
                  <Text style={[styles.nextBtnText, { color: canProceed() ? tokens.white : tokens.textMuted }]}>{i18n.t('receive.next')}</Text>
                  <ChevronRight size={20} color={canProceed() ? tokens.white : tokens.textMuted} />
                </PressableScale>
              </View>
            )}
          </KeyboardAvoidingView>
        </React.Fragment>
      )}

      <CategorySplashScreen
        visible={showCategory}
        walletId={activeWalletId ?? ''}
        flowType="receive"
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
    marginBottom: 20,
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
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: radius.lg,
  },
  primaryBtnText: {
    fontSize: 18,
    fontWeight: '700',
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
  skipCategoryBtn: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipCategoryText: {
    fontSize: 15,
    fontWeight: '500',
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
