import React, { useState, useMemo, useRef, useEffect } from 'react';
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
} from 'react-native';
import { X, ArrowDownRight, ArrowUpRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../stores/useAppStore';
import { i18n } from '../i18n';
import { radius } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { PressableScale } from '../components/ui/PressableScale';
import { insertDebt } from '../repositories/debtRepository';
import { playSound } from '../services/soundManager';
import type { DebtType } from '../database/types';
import type { ThemeTokens } from '../theme/tokens';

const PRESETS = [100, 500, 1000, 5000];

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
    label: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: t.textSecondary,
      marginBottom: 8,
    },
    typeRow: {
      flexDirection: 'row' as const,
      gap: 10,
      marginBottom: 20,
    },
    typeCard: {
      flex: 1,
      padding: 14,
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: t.border,
      alignItems: 'center' as const,
      backgroundColor: t.surface,
    },
    typeCardActive: {
      borderColor: t.primary,
      backgroundColor: t.primary10,
    },
    typeIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: 8,
    },
    typeIconOwe: { backgroundColor: t.dangerLight },
    typeIconOwed: { backgroundColor: t.successLight },
    typeLabel: {
      fontSize: 13,
      fontWeight: '700' as const,
      color: t.textPrimary,
    },
    typeLabelActive: { color: t.primary },
    input: {
      backgroundColor: t.surface,
      borderWidth: 1.5,
      borderColor: t.border,
      borderRadius: radius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: t.textPrimary,
      marginBottom: 16,
    },
    amountWrap: {
      borderWidth: 2,
      borderColor: t.border,
      borderRadius: radius.md,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 12,
      backgroundColor: t.surface,
    },
    amountInput: {
      fontSize: 28,
      fontWeight: '800' as const,
      color: t.textPrimary,
      fontVariant: ['tabular-nums'] as ('tabular-nums')[],
      minHeight: 36,
    },
    currencySuffix: {
      fontSize: 14,
      color: t.textMuted,
      marginTop: 4,
    },
    presets: {
      flexDirection: 'row' as const,
      gap: 8,
      marginBottom: 20,
    },
    presetBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: radius.md,
      backgroundColor: t.borderLight,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderColor: t.border,
    },
    presetText: {
      fontSize: 13,
      fontWeight: '700' as const,
      color: t.textPrimary,
      fontVariant: ['tabular-nums'] as ('tabular-nums')[],
    },
    textArea: {
      backgroundColor: t.surface,
      borderWidth: 1.5,
      borderColor: t.border,
      borderRadius: radius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: t.textPrimary,
      marginBottom: 20,
      minHeight: 80,
      textAlignVertical: 'top' as const,
    },
    optionalLabel: {
      fontSize: 12,
      color: t.textMuted,
      marginBottom: 8,
    },
    confirmBtn: {
      backgroundColor: t.primary,
      paddingVertical: 14,
      borderRadius: radius.md,
      alignItems: 'center' as const,
      marginTop: 4,
    },
    confirmBtnDisabled: {
      backgroundColor: t.border,
    },
    confirmBtnText: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: t.white,
    },
    confirmBtnTextDisabled: { color: t.textMuted },
    errorBox: {
      backgroundColor: t.dangerLight,
      borderRadius: radius.md,
      padding: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: t.danger,
    },
    errorText: {
      fontSize: 13,
      color: t.danger,
      fontWeight: '600' as const,
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

export function AddDebtScreen() {
  const tokens = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => StyleSheet.create(makeStyles(tokens) as Record<string, object>), [tokens]);
  const setOverlay = useAppStore((s) => s.setOverlay);
  const refreshDebts = useAppStore((s) => s.refreshDebts);
  const wallets = useAppStore((s) => s.wallets);
  const activeWalletId = useAppStore((s) => s.activeWalletId);

  const activeWallet = useMemo(
    () => wallets.find((w) => w.id === activeWalletId),
    [wallets, activeWalletId]
  );
  const currency = activeWallet?.currency ?? 'DZD';

  const [debtType, setDebtType] = useState<DebtType>('owe');
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const amountInputRef = useRef<TextInput>(null);
  const personInputRef = useRef<TextInput>(null);

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
    personInputRef.current?.blur();
  };

  const numAmount = parseFloat(amount || '0') || 0;
  const isValid = numAmount > 0 && personName.trim().length > 0;

  const handleConfirm = async () => {
    if (!isValid || !activeWalletId) return;
    setError(null);

    try {
      await insertDebt({
        walletId: activeWalletId,
        type: debtType,
        personName: personName.trim(),
        originalAmount: numAmount,
        remainingAmount: numAmount,
        description: description.trim() || undefined,
        createdAt: Date.now(),
        dueDate: null,
        status: 'active',
        relatedTransactionIds: [],
      });

      playSound('transaction_validate_success');
      await refreshDebts();
      setOverlay(null);
    } catch (err) {
      console.error('Failed to create debt:', err);
      setError(i18n.t('debt.createError'));
      playSound('transaction_error');
    }
  };

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
        <Text style={styles.headerTitle}>{i18n.t('debt.addDebt')}</Text>
        <Pressable style={styles.closeBtn} onPress={() => setOverlay(null)}>
          <X size={20} color={tokens.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>{i18n.t('debt.debtType')}</Text>
        <View style={styles.typeRow}>
          <PressableScale
            style={[styles.typeCard, debtType === 'owe' && styles.typeCardActive]}
            onPress={() => setDebtType('owe')}
            activeScale={0.97}
          >
            <View style={[styles.typeIcon, styles.typeIconOwe]}>
              <ArrowUpRight size={20} color={tokens.danger} strokeWidth={2.5} />
            </View>
            <Text
              style={[styles.typeLabel, debtType === 'owe' && styles.typeLabelActive]}
            >
              {i18n.t('debt.iOwe')}
            </Text>
          </PressableScale>
          <PressableScale
            style={[styles.typeCard, debtType === 'owed' && styles.typeCardActive]}
            onPress={() => setDebtType('owed')}
            activeScale={0.97}
          >
            <View style={[styles.typeIcon, styles.typeIconOwed]}>
              <ArrowDownRight size={20} color={tokens.success} strokeWidth={2.5} />
            </View>
            <Text
              style={[styles.typeLabel, debtType === 'owed' && styles.typeLabelActive]}
            >
              {i18n.t('debt.owedToMe')}
            </Text>
          </PressableScale>
        </View>

        <Text style={styles.label}>{i18n.t('debt.personName')}</Text>
        <TextInput
          ref={personInputRef}
          style={styles.input}
          value={personName}
          onChangeText={(t) => {
            setPersonName(t);
            setError(null);
          }}
          placeholder={i18n.t('debt.personNamePlaceholder')}
          placeholderTextColor={tokens.textMuted}
          maxLength={120}
        />

        <Text style={styles.label}>{i18n.t('debt.amount')}</Text>
        <View style={styles.amountWrap}>
          <TextInput
            ref={amountInputRef}
            style={styles.amountInput}
            value={amount}
            onChangeText={(t) => {
              setAmount(t);
              setError(null);
            }}
            placeholder="0"
            placeholderTextColor={tokens.textMuted}
            keyboardType="decimal-pad"
            maxLength={14}
          />
          <Text style={styles.currencySuffix}>{currency}</Text>
        </View>

        <View style={styles.presets}>
          {PRESETS.map((p) => (
            <Pressable
              key={p}
              style={styles.presetBtn}
              onPress={() => setAmount(String(p))}
            >
              <Text style={styles.presetText}>+{p}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.optionalLabel}>
          {i18n.t('debt.description')} ({i18n.t('common.optional')})
        </Text>
        <TextInput
          style={styles.textArea}
          value={description}
          onChangeText={setDescription}
          placeholder={i18n.t('debt.descriptionPlaceholder')}
          placeholderTextColor={tokens.textMuted}
          multiline
          maxLength={500}
        />

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <PressableScale
          style={[styles.confirmBtn, !isValid && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          activeScale={0.97}
          disabled={!isValid}
        >
          <Text
            style={[
              styles.confirmBtnText,
              !isValid && styles.confirmBtnTextDisabled,
            ]}
          >
            {i18n.t('debt.createDebt')}
          </Text>
        </PressableScale>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
