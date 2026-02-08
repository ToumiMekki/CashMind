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
import { X, Check } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../stores/useAppStore';
import { i18n } from '../i18n';
import { radius } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { PressableScale } from '../components/ui/PressableScale';
import { createWallet } from '../repositories/walletsRepository';
import { THEME_COLOR_PALETTES } from '../theme/colorPalettes';
import type { ThemeColorId } from '../theme/colorPalettes';
import type { ThemeTokens } from '../theme/tokens';
import type { WalletType } from '../database/types';

const QUICK_CURRENCIES = ['DZD', 'EUR', 'USD'] as const;
const WALLET_TYPES: { value: WalletType; labelKey: string }[] = [
  { value: 'personal', labelKey: 'addWallet.personal' },
  { value: 'business', labelKey: 'addWallet.business' },
  { value: 'family', labelKey: 'addWallet.family' },
];

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
    input: {
      backgroundColor: t.surface,
      borderWidth: 2,
      borderColor: t.border,
      borderRadius: radius.md,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: t.textPrimary,
      marginBottom: 20,
    },
    row: { flexDirection: 'row' as const, gap: 12, marginBottom: 20 },
    chip: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: radius.md,
      alignItems: 'center' as const,
      borderWidth: 2,
      borderColor: t.border,
    },
    chipActive: { borderColor: t.primary, backgroundColor: t.primary10 },
    chipText: { fontSize: 14, fontWeight: '600' as const, color: t.textPrimary },
    chipTextActive: { color: t.primary },
    confirm: {
      backgroundColor: t.primary,
      paddingVertical: 16,
      borderRadius: radius.md,
      alignItems: 'center' as const,
      marginTop: 8,
    },
    confirmText: { fontSize: 18, fontWeight: '700' as const, color: t.white },
    colorGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 14,
      marginBottom: 8,
    },
    colorOption: {
      width: 72,
      height: 92,
      borderRadius: 18,
      overflow: 'hidden' as const,
      borderWidth: 3,
    },
    colorOptionInner: {
      flex: 1,
      padding: 10,
      justifyContent: 'flex-end' as const,
    },
    colorOptionBar: {
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(255,255,255,0.35)',
      width: '60%',
    },
    colorOptionCheck: {
      position: 'absolute' as const,
      top: 6,
      right: 6,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: 'rgba(255,255,255,0.95)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
  };
}

export function AddWalletScreen() {
  const tokens = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => StyleSheet.create(makeStyles(tokens) as Record<string, object>),
    [tokens]
  );

  const setOverlay = useAppStore((s) => s.setOverlay);
  const refreshWallets = useAppStore((s) => s.refreshWallets);

  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<string>('');
  const [walletType, setWalletType] = useState<WalletType>('personal');
  const [themeColorId, setThemeColorId] = useState<ThemeColorId>('blue');
  const [exchangeRate, setExchangeRate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => setOverlay(null);

  const handleCreate = async () => {
    const n = name.trim();
    if (!n) {
      Alert.alert('', 'Wallet name required');
      return;
    }
    const c = (currency || '').trim() || 'DZD';
    setLoading(true);
    try {
      const rate = parseFloat(exchangeRate) || null;
      await createWallet({
        name: n,
        currency: c,
        type: walletType,
        themeColorId,
        exchangeRateToDZD: rate ?? undefined,
      });
      await refreshWallets();
      handleClose();
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{i18n.t('wallet.addWallet')}</Text>
        <Pressable onPress={handleClose} style={styles.closeBtn}>
          <X size={24} color={tokens.textPrimary} />
        </Pressable>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>{i18n.t('addWallet.name')}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={i18n.t('addWallet.namePlaceholder')}
          placeholderTextColor={tokens.textMuted}
          autoCapitalize="words"
        />
        <Text style={styles.label}>{i18n.t('addWallet.currencyOrUnit')}</Text>
        <View style={styles.row}>
          {QUICK_CURRENCIES.map((c) => (
            <PressableScale
              key={c}
              style={StyleSheet.flatten([styles.chip, currency === c && styles.chipActive].filter(Boolean)) as import('react-native').ViewStyle}
              onPress={() => setCurrency(c)}
            >
              <Text style={StyleSheet.flatten([styles.chipText, currency === c && styles.chipTextActive].filter(Boolean)) as import('react-native').TextStyle}>{c}</Text>
            </PressableScale>
          ))}
        </View>
        <TextInput
          style={styles.input}
          value={currency}
          onChangeText={setCurrency}
          placeholder={i18n.t('addWallet.currencyPlaceholder')}
          placeholderTextColor={tokens.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.label}>{i18n.t('addWallet.exchangeRateOptional')}</Text>
        <TextInput
          style={styles.input}
          value={exchangeRate}
          onChangeText={setExchangeRate}
          placeholder={i18n.t('addWallet.exchangeRatePlaceholder')}
          placeholderTextColor={tokens.textMuted}
          keyboardType="decimal-pad"
        />
        <Text style={styles.label}>{i18n.t('addWallet.type')}</Text>
        <View style={styles.row}>
          {WALLET_TYPES.map(({ value, labelKey }) => (
            <PressableScale
              key={value}
              style={StyleSheet.flatten([styles.chip, walletType === value && styles.chipActive].filter(Boolean)) as import('react-native').ViewStyle}
              onPress={() => setWalletType(value)}
            >
              <Text style={StyleSheet.flatten([styles.chipText, walletType === value && styles.chipTextActive].filter(Boolean)) as import('react-native').TextStyle}>
                {i18n.t(labelKey)}
              </Text>
            </PressableScale>
          ))}
        </View>
        <Text style={styles.label}>{i18n.t('addWallet.themeColor')}</Text>
        <Text style={[styles.label, { fontSize: 12, marginBottom: 12, color: tokens.textMuted }]}>
          {i18n.t('addWallet.themeColorHint')}
        </Text>
        <View style={styles.colorGrid}>
          {THEME_COLOR_PALETTES.map((p) => {
            const isSelected = themeColorId === p.id;
            return (
              <PressableScale
                key={p.id}
                style={[
                  styles.colorOption,
                  {
                    borderColor: isSelected ? p.hex : tokens.border,
                    shadowColor: p.hex,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isSelected ? 0.3 : 0,
                    shadowRadius: 8,
                    elevation: isSelected ? 6 : 2,
                  },
                ]}
                onPress={() => setThemeColorId(p.id)}
              >
                <LinearGradient
                  colors={[p.light.primary, p.light.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.colorOptionInner}
                >
                  {isSelected && (
                    <View style={styles.colorOptionCheck}>
                      <Check size={14} color={p.hex} strokeWidth={3} />
                    </View>
                  )}
                  <View style={styles.colorOptionBar} />
                </LinearGradient>
              </PressableScale>
            );
          })}
        </View>
        <PressableScale
          style={styles.confirm}
          onPress={handleCreate}
          disabled={loading || !name.trim()}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Check size={20} color={tokens.white} />
            <Text style={styles.confirmText}>{i18n.t('addWallet.createButton')}</Text>
          </View>
        </PressableScale>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
