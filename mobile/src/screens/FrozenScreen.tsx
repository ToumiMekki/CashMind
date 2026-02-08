import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated as RNAnimated,
} from 'react-native';
import { Lock, Unlock, CreditCard, Eye, EyeOff } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { Transaction, Language } from '../database/types';
import { useAppStore } from '../stores/useAppStore';
import { i18n } from '../i18n';
import { radius } from '../theme';
import { useBalancePrivacy } from '../hooks/useBalancePrivacy';
import { useTheme } from '../hooks/useTheme';
import { AppContainer } from '../components/ui/AppContainer';
import { PressableScale } from '../components/ui/PressableScale';
import { formatTime } from '../utils/format';
import type { ThemeTokens } from '../theme/tokens';

const FREEZE_TYPES = ['freeze', 'unfreeze', 'freeze_spend'] as const;

function makeFrozenStyles(t: ThemeTokens) {
  return {
    wrapper: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingTop: 0, paddingBottom: 12 },
    header: { marginBottom: 24 },
    title: { fontSize: 24, fontWeight: '700' as const, color: t.textPrimary },
    balanceCard: {
      borderRadius: radius.lg,
      overflow: 'hidden' as const,
      marginBottom: 24,
      shadowColor: t.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    },
    balanceGradient: {
      backgroundColor: t.primary,
      padding: 24,
      borderRadius: radius.lg,
    },
    balanceHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 8,
    },
    balanceLabel: { fontSize: 14, color: t.primaryTint },
    visibilityToggle: { padding: 8, borderRadius: radius.full },
    visibilityTogglePressed: { opacity: 0.7 },
    balanceRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 10,
    },
    balanceLabelSmall: { fontSize: 13, color: t.primaryTint },
    availableRow: {
      backgroundColor: t.white10,
      marginHorizontal: -8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      marginBottom: 10,
    },
    frozenLabelRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 },
    balanceAmount: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: t.white,
      fontVariant: ['tabular-nums'],
    },
    balanceAmountHighlight: {
      fontSize: 22,
      fontWeight: '700' as const,
      color: t.white,
      fontVariant: ['tabular-nums'],
    },
    balanceCurrency: { fontSize: 16, color: t.primaryTint },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: t.textSecondary,
      marginBottom: 12,
    },
    actions: { flexDirection: 'row' as const, gap: 8, marginBottom: 24 },
    actionBtn: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 6,
      backgroundColor: t.surface,
      borderRadius: radius.md,
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: t.border,
    },
    actionBtnDisabled: { opacity: 0.5 },
    actionLabel: { fontSize: 12, fontWeight: '600' as const, color: t.textPrimary },
    emptyFrozen: {
      alignItems: 'center' as const,
      backgroundColor: t.surface,
      borderRadius: radius.md,
      padding: 20,
      marginBottom: 24,
      shadowColor: t.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    emptyFrozenText: { fontSize: 14, color: t.textMuted, marginTop: 8, marginBottom: 12 },
    freezeCta: {
      backgroundColor: t.accent10,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: radius.md,
    },
    freezeCtaText: { fontSize: 14, fontWeight: '600' as const, color: t.primary },
    frozenList: { gap: 8, marginBottom: 24 },
    frozenCard: {
      backgroundColor: t.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: t.border,
      overflow: 'hidden' as const,
    },
    frozenCardInner: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: 14,
    },
    frozenCardPressed: { opacity: 0.8 },
    frozenIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: 12,
    },
    frozenCenter: { flex: 1, minWidth: 0 },
    frozenTitle: { fontSize: 15, fontWeight: '600' as const, color: t.textPrimary },
    frozenNote: { fontSize: 13, color: t.textSecondary, marginTop: 2 },
    frozenRight: { alignItems: 'flex-end' as const },
    frozenAmount: { fontSize: 15, fontWeight: '700' as const, fontVariant: ['tabular-nums'] },
    frozenAmountPos: { color: t.success },
    frozenAmountNeg: { color: t.danger },
    frozenTime: { fontSize: 12, color: t.textMuted, marginTop: 2 },
  };
}

export function FrozenScreen() {
  const tokens = useTheme();
  const styles = useMemo(
    () => StyleSheet.create(makeFrozenStyles(tokens) as Record<string, object>),
    [tokens]
  );

  const language = useAppStore((s) => s.language);
  const balance = useAppStore((s) => s.balance);
  const freezeBalance = useAppStore((s) => s.freezeBalance);
  const availableBalance = useAppStore((s) => s.availableBalance);
  const totalFrozenBalance = useAppStore((s) => s.totalFrozenBalance);
  const transactions = useAppStore((s) => s.transactions);
  const setOverlay = useAppStore((s) => s.setOverlay);
  const setSelectedTransaction = useAppStore((s) => s.setSelectedTransaction);
  const wallets = useAppStore((s) => s.wallets);
  const activeWalletId = useAppStore((s) => s.activeWalletId);
  const activeWallet = useMemo(
    () => wallets.find((w) => w.id === activeWalletId),
    [wallets, activeWalletId]
  );
  const currency: string = activeWallet?.currency ?? i18n.t('wallet.currency');

  const available = availableBalance();
  const frozenTotal = totalFrozenBalance();

  const { visible: balanceVisible, toggle: toggleBalancePrivacy, mask } = useBalancePrivacy();
  const fadeAnim = useRef(new RNAnimated.Value(1)).current;

  const freezeTxList = useMemo(
    () =>
      transactions.filter((tx) =>
        FREEZE_TYPES.includes(tx.type as (typeof FREEZE_TYPES)[number])
      ),
    [transactions]
  );

  useEffect(() => {
    RNAnimated.timing(fadeAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [balanceVisible, fadeAnim]);

  const handleTogglePrivacy = () => {
    fadeAnim.setValue(0.6);
    toggleBalancePrivacy();
  };

  const totalBalance = balance + frozenTotal;

  return (
    <AppContainer>
      <View style={styles.wrapper}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{i18n.t('freeze.screenTitle')}</Text>
          </View>

          <Animated.View
            entering={FadeInDown.duration(300)}
            style={styles.balanceCard}
          >
            <RNAnimated.View style={[styles.balanceGradient, { opacity: fadeAnim }]}>
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>{i18n.t('wallet.balance')}</Text>
                <Pressable
                  onPress={handleTogglePrivacy}
                  style={({ pressed }) => [styles.visibilityToggle, pressed && styles.visibilityTogglePressed]}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={balanceVisible ? i18n.t('wallet.hideBalance') : i18n.t('wallet.showBalance')}
                >
                  {balanceVisible ? (
                    <EyeOff size={22} color={tokens.primaryTint} />
                  ) : (
                    <Eye size={22} color={tokens.primaryTint} />
                  )}
                </Pressable>
              </View>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabelSmall}>{i18n.t('wallet.totalBalance')}</Text>
                <Text style={styles.balanceAmount}>
                  {mask(totalBalance)} <Text style={styles.balanceCurrency}>{currency}</Text>
                </Text>
              </View>
              <View style={[styles.balanceRow, styles.availableRow]}>
                <Text style={styles.balanceLabelSmall}>{i18n.t('wallet.availableBalance')}</Text>
                <Text style={styles.balanceAmountHighlight}>
                  {mask(available)} <Text style={styles.balanceCurrency}>{currency}</Text>
                </Text>
              </View>
              <View style={styles.balanceRow}>
                <View style={styles.frozenLabelRow}>
                  <Lock size={14} color={tokens.primaryTint} />
                  <Text style={styles.balanceLabelSmall}>{i18n.t('wallet.frozenBalance')}</Text>
                </View>
                <Text style={styles.balanceAmount}>
                  {mask(frozenTotal)} <Text style={styles.balanceCurrency}>{currency}</Text>
                </Text>
              </View>
            </RNAnimated.View>
          </Animated.View>

          <Text style={styles.sectionTitle}>{i18n.t('wallet.quickActions')}</Text>
          <View style={styles.actions}>
            <PressableScale style={styles.actionBtn} onPress={() => setOverlay('freeze')}>
              <Lock size={20} color={tokens.primary} />
              <Text style={styles.actionLabel}>{i18n.t('wallet.freeze')}</Text>
            </PressableScale>
            <PressableScale
              style={StyleSheet.flatten([styles.actionBtn, frozenTotal <= 0 && styles.actionBtnDisabled].filter(Boolean)) as import('react-native').ViewStyle}
              onPress={() => frozenTotal > 0 && setOverlay('spendFromFreeze')}
              disabled={frozenTotal <= 0}
            >
              <CreditCard size={20} color={tokens.accent} />
              <Text style={styles.actionLabel}>{i18n.t('wallet.spendFromFrozen')}</Text>
            </PressableScale>
            <PressableScale
              style={StyleSheet.flatten([styles.actionBtn, frozenTotal <= 0 && styles.actionBtnDisabled].filter(Boolean)) as import('react-native').ViewStyle}
              onPress={() => frozenTotal > 0 && setOverlay('unfreeze')}
              disabled={frozenTotal <= 0}
            >
              <Unlock size={20} color={tokens.success} />
              <Text style={styles.actionLabel}>{i18n.t('wallet.unfreeze')}</Text>
            </PressableScale>
          </View>

          <Text style={styles.sectionTitle}>{i18n.t('wallet.frozenFunds')}</Text>
          {freezeTxList.length === 0 ? (
            <View style={styles.emptyFrozen}>
              <Lock size={28} color={tokens.textMuted} />
              <Text style={styles.emptyFrozenText}>{i18n.t('wallet.noFrozenFunds')}</Text>
              <PressableScale style={styles.freezeCta} onPress={() => setOverlay('freeze')}>
                <Text style={styles.freezeCtaText}>{i18n.t('wallet.freeze')}</Text>
              </PressableScale>
            </View>
          ) : (
            <View style={styles.frozenList}>
              {freezeTxList.map((tx, idx) => (
                <FreezeTxRow
                  key={tx.id}
                  tx={tx}
                  index={idx}
                  currency={currency}
                  language={language}
                  mask={mask}
                  onPress={() => setSelectedTransaction(tx)}
                  styles={styles}
                  tokens={tokens}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </AppContainer>
  );
}

function FreezeTxRow({
  tx,
  index,
  currency,
  language,
  mask,
  onPress,
  styles,
  tokens,
}: {
  tx: Transaction;
  index: number;
  currency: string;
  language: Language;
  mask: (n: number) => string;
  onPress: () => void;
  styles: Record<string, import('react-native').ViewStyle | import('react-native').TextStyle | import('react-native').ImageStyle>;
  tokens: ThemeTokens;
}) {
  const isFreeze = tx.type === 'freeze';
  const isUnfreeze = tx.type === 'unfreeze';
  const isSpend = tx.type === 'freeze_spend';
  const label = isFreeze
    ? i18n.t('ledger.freeze')
    : isUnfreeze
      ? i18n.t('ledger.unfreeze')
      : i18n.t('ledger.freezeSpend');
  const Icon = isFreeze ? Lock : isUnfreeze ? Unlock : CreditCard;
  const color = isFreeze ? tokens.primary : isUnfreeze ? tokens.success : tokens.accent;
  const iconBg = isFreeze ? tokens.primary20 : isUnfreeze ? tokens.successLight : tokens.accent10;
  const sign = isUnfreeze ? '+' : '-';

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 40).duration(200)}
      style={styles.frozenCard}
    >
      <Pressable style={({ pressed }) => [styles.frozenCardInner, pressed && styles.frozenCardPressed]} onPress={onPress}>
        <View style={[styles.frozenIcon, { backgroundColor: iconBg }]}>
          <Icon size={18} color={color} />
        </View>
        <View style={styles.frozenCenter}>
          <Text style={styles.frozenTitle}>{label}</Text>
          {tx.category ? (
            <Text style={styles.frozenNote} numberOfLines={1}>{tx.category}</Text>
          ) : null}
        </View>
        <View style={styles.frozenRight}>
          <Text style={[styles.frozenAmount, isUnfreeze ? styles.frozenAmountPos : styles.frozenAmountNeg]}>
            {sign}{mask(tx.amount)} {currency}
          </Text>
          <Text style={styles.frozenTime}>{formatTime(tx.timestamp, language)}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
