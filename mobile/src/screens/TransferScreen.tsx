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
  Alert,
} from 'react-native';
import { X, ArrowRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../stores/useAppStore';
import { i18n } from '../i18n';
import { radius } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { PressableScale } from '../components/ui/PressableScale';
import { executeTransfer } from '../repositories/transferRepository';
import type { ThemeTokens } from '../theme/tokens';

function makeStyles(t: ThemeTokens) {
  return {
    root: { flex: 1, backgroundColor: t.background },
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
    closeBtn: { padding: 8 },
    scroll: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    label: { fontSize: 14, fontWeight: '500' as const, color: t.textSecondary, marginBottom: 8 },
    walletRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      backgroundColor: t.surface,
      borderWidth: 2,
      borderColor: t.border,
      borderRadius: radius.md,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 20,
    },
    walletName: { fontSize: 16, fontWeight: '600' as const, color: t.textPrimary },
    walletCurrency: { fontSize: 14, color: t.textMuted },
    input: {
      backgroundColor: t.surface,
      borderWidth: 2,
      borderColor: t.border,
      borderRadius: radius.md,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 18,
      fontWeight: '700' as const,
      color: t.textPrimary,
      fontVariant: ['tabular-nums'] as ('tabular-nums')[],
      marginBottom: 20,
    },
    rateHint: { fontSize: 12, color: t.textMuted, marginTop: -12, marginBottom: 20 },
    confirm: {
      backgroundColor: t.primary,
      paddingVertical: 16,
      borderRadius: radius.md,
      alignItems: 'center' as const,
      flexDirection: 'row' as const,
      justifyContent: 'center' as const,
      gap: 8,
      marginTop: 8,
    },
    confirmText: { fontSize: 18, fontWeight: '700' as const, color: t.white },
  };
}

export function TransferScreen() {
  const tokens = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => StyleSheet.create(makeStyles(tokens) as Record<string, object>),
    [tokens]
  );

  const setOverlay = useAppStore((s) => s.setOverlay);
  const refreshWallets = useAppStore((s) => s.refreshWallets);
  const wallets = useAppStore((s) => s.wallets);
  const activeWalletId = useAppStore((s) => s.activeWalletId);
  const currentExercice = useAppStore((s) => s.currentExercice);
  const isCurrentExerciceOpen = useAppStore((s) => s.isCurrentExerciceOpen);

  const [destId, setDestId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [loading, setLoading] = useState(false);

  const source = useMemo(
    () => wallets.find((w) => w.id === activeWalletId),
    [wallets, activeWalletId]
  );
  const others = useMemo(
    () => wallets.filter((w) => w.id !== activeWalletId),
    [wallets, activeWalletId]
  );
  const dest = useMemo(
    () => wallets.find((w) => w.id === destId),
    [wallets, destId]
  );

  const handleClose = () => setOverlay(null);

  const handleTransfer = async () => {
    if (!isCurrentExerciceOpen()) {
      Alert.alert('', 'Fiscal year is closed. No transfers allowed.');
      return;
    }
    if (!source || !dest) {
      Alert.alert('', 'Select source and destination wallets');
      return;
    }
    const a = parseFloat(amount.replace(/,/g, '.'));
    if (!Number.isFinite(a) || a <= 0) {
      Alert.alert('', 'Enter a valid amount');
      return;
    }
    const rate = exchangeRate.trim() ? parseFloat(exchangeRate.replace(/,/g, '.')) : undefined;
    if (source.currency !== dest.currency && (rate == null || !Number.isFinite(rate) || rate <= 0)) {
      Alert.alert('', 'Exchange rate required for different currencies');
      return;
    }
    setLoading(true);
    try {
      const res = await executeTransfer({
        sourceWalletId: source.id,
        destWalletId: dest.id,
        amount: a,
        exchangeRate: rate ?? 1,
        exercice: currentExercice,
      });
      if (res.success) {
        await refreshWallets();
        handleClose();
      } else {
        Alert.alert('', res.error);
      }
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!source) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{i18n.t('wallet.transfer')}</Text>
          <Pressable onPress={handleClose} style={styles.closeBtn}>
            <X size={24} color={tokens.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.scrollContent}>
          <Text style={styles.label}>No wallet selected.</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{i18n.t('wallet.transfer')}</Text>
        <Pressable onPress={handleClose} style={styles.closeBtn}>
          <X size={24} color={tokens.textPrimary} />
        </Pressable>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>From</Text>
        <View style={styles.walletRow}>
          <View>
            <Text style={styles.walletName}>{source.name}</Text>
            <Text style={styles.walletCurrency}>{source.currency}</Text>
          </View>
        </View>

        <Text style={styles.label}>To</Text>
        {others.length === 0 ? (
          <View style={styles.walletRow}>
            <Text style={styles.walletName}>No other wallet</Text>
          </View>
        ) : (
          others.map((w) => (
            <PressableScale
              key={w.id}
              style={StyleSheet.flatten([
                styles.walletRow,
                destId === w.id && { borderColor: tokens.primary, backgroundColor: tokens.primary10 },
              ].filter(Boolean)) as import('react-native').ViewStyle}
              onPress={() => setDestId(w.id)}
            >
              <View>
                <Text style={styles.walletName}>{w.name}</Text>
                <Text style={styles.walletCurrency}>{w.currency}</Text>
              </View>
            </PressableScale>
          ))
        )}

        <Text style={styles.label}>Amount ({source.currency})</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0"
          placeholderTextColor={tokens.textMuted}
          keyboardType="decimal-pad"
        />
        {dest && source.currency !== dest.currency && (
          <>
            <Text style={styles.label}>Exchange rate (1 {source.currency} = ? {dest.currency})</Text>
            <TextInput
              style={styles.input}
              value={exchangeRate}
              onChangeText={setExchangeRate}
              placeholder="e.g. 135"
              placeholderTextColor={tokens.textMuted}
              keyboardType="decimal-pad"
            />
            <Text style={styles.rateHint}>Manual rate. Same rate used for both legs.</Text>
          </>
        )}

        <PressableScale
          style={styles.confirm}
          onPress={handleTransfer}
          disabled={loading || !destId || !amount.trim()}
        >
          <ArrowRight size={20} color={tokens.white} />
          <Text style={styles.confirmText}>Transfer</Text>
        </PressableScale>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
