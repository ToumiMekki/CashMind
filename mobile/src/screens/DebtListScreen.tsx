import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ScrollView,
} from 'react-native';
import { Plus, ArrowDownRight, ArrowUpRight, Calendar, ArrowLeft, User } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../stores/useAppStore';
import { i18n } from '../i18n';
import { radius } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useBalancePrivacy } from '../hooks/useBalancePrivacy';
import { AppContainer } from '../components/ui/AppContainer';
import { PressableScale } from '../components/ui/PressableScale';
import { getAllDebtsByWalletId, getDebtSummaryByWalletId } from '../repositories/debtRepository';
import type { Debt, DebtType } from '../database/types';
import { formatDateShort } from '../utils/format';
import type { ThemeTokens } from '../theme/tokens';

type DebtFilter = 'all' | 'owe' | 'owed' | 'active';

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
    title: { fontSize: 20, fontWeight: '700' as const, color: t.textPrimary },
    addButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: t.primary,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      shadowColor: t.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 2,
    },
    summaryCard: {
      backgroundColor: t.surface,
      borderRadius: 16,
      padding: 14,
      marginHorizontal: 16,
      marginTop: 10,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: t.border,
      shadowColor: t.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    summaryRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 8,
    },
    summaryRowLast: { marginBottom: 0, paddingTop: 8, borderTopWidth: 1, borderTopColor: t.border },
    summaryLabel: { fontSize: 13, fontWeight: '600' as const, color: t.textSecondary },
    summaryValueContainer: {
      flexDirection: 'row' as const,
      alignItems: 'baseline' as const,
      gap: 4,
    },
    summaryValue: {
      fontSize: 17,
      fontWeight: '700' as const,
      color: t.textPrimary,
      fontVariant: ['tabular-nums'] as ('tabular-nums')[],
    },
    summaryCurrency: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: t.textMuted,
    },
    summaryValueOwed: { color: t.success },
    summaryValueOwing: { color: t.danger },
    filters: {
      flexDirection: 'row' as const,
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 0,
      gap: 6,
    },
    filterChip: {
      paddingHorizontal: 11,
      paddingVertical: 4,
      borderRadius: 18,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.border,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      height: 26,
    },
    filterChipActive: {
      backgroundColor: t.primary,
      borderColor: t.primary,
    },
    filterChipText: {
      fontSize: 11,
      fontWeight: '600' as const,
      color: t.textSecondary,
    },
    filterChipTextActive: {
      color: t.white,
      fontWeight: '700' as const,
    },
    backButton: {
      padding: 6,
      marginRight: 8,
      borderRadius: 8,
    },
    list: { flex: 1 },
    listContent: { paddingHorizontal: 16, paddingTop: 0, paddingBottom: 16 },
    debtCard: {
      backgroundColor: t.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: t.border,
      shadowColor: t.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    debtHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 10,
    },
    debtIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: 12,
      backgroundColor: t.borderLight,
    },
    debtIconOwe: { backgroundColor: t.dangerLight },
    debtIconOwed: { backgroundColor: t.successLight },
    debtInfo: { flex: 1, minWidth: 0 },
    debtPerson: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: t.textPrimary,
      marginBottom: 4,
    },
    debtDescription: {
      fontSize: 13,
      color: t.textMuted,
      lineHeight: 18,
    },
    debtAmounts: {
      alignItems: 'flex-end' as const,
    },
    debtRemainingContainer: {
      flexDirection: 'row' as const,
      alignItems: 'baseline' as const,
      gap: 4,
      marginBottom: 3,
    },
    debtRemaining: {
      fontSize: 17,
      fontWeight: '800' as const,
      fontVariant: ['tabular-nums'] as ('tabular-nums')[],
    },
    debtRemainingOwe: { color: t.danger },
    debtRemainingOwed: { color: t.success },
    debtCurrency: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: t.textMuted,
    },
    debtOriginalContainer: {
      flexDirection: 'row' as const,
      alignItems: 'baseline' as const,
      gap: 4,
    },
    debtOriginal: {
      fontSize: 12,
      color: t.textMuted,
      fontVariant: ['tabular-nums'] as ('tabular-nums')[],
    },
    debtFooter: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: t.border,
    },
    debtStatus: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: t.borderLight,
    },
    debtStatusActive: { backgroundColor: t.primaryLight },
    debtStatusPaid: { backgroundColor: t.successLight },
    debtStatusPartial: { backgroundColor: t.accentLight },
    debtStatusText: {
      fontSize: 11,
      fontWeight: '700' as const,
      textTransform: 'uppercase' as const,
    },
    debtStatusTextActive: { color: t.primary },
    debtStatusTextPaid: { color: t.success },
    debtStatusTextPartial: { color: t.accent },
    debtDate: {
      fontSize: 12,
      color: t.textMuted,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
    },
    progressContainer: {
      marginTop: 8,
      height: 3,
      backgroundColor: t.borderLight,
      borderRadius: 2,
      overflow: 'hidden' as const,
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },
    emptyCard: {
      backgroundColor: t.surface,
      borderRadius: 12,
      padding: 32,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      margin: 16,
      borderWidth: 1,
      borderColor: t.border,
    },
    emptyIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: t.borderLight,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: 10,
    },
    emptyEmoji: { fontSize: 28 },
    emptyTitle: {
      fontSize: 14,
      fontWeight: '700' as const,
      color: t.textPrimary,
      marginBottom: 4,
    },
    emptyDesc: {
      fontSize: 12,
      color: t.textMuted,
      textAlign: 'center' as const,
    },
  };
}

function DebtCard({
  debt,
  onPress,
  currency,
  mask,
  styles,
  tokens,
}: {
  debt: Debt;
  onPress: () => void;
  currency: string;
  mask: (v: number) => string;
  styles: ReturnType<typeof makeStyles>;
  tokens: ThemeTokens;
}) {
  const language = useAppStore((s) => s.language);
  const isOwe = debt.type === 'owe';
  const progress = debt.originalAmount > 0 ? (debt.remainingAmount / debt.originalAmount) * 100 : 0;
  const paidProgress = 100 - progress;
  
  // Get first letter for avatar
  const avatarLetter = debt.personName.charAt(0).toUpperCase();

  return (
    <Animated.View entering={FadeInDown.duration(200)}>
      <PressableScale
        style={styles.debtCard}
        onPress={onPress}
        activeScale={0.98}
      >
        <View style={styles.debtHeader}>
          <View style={[styles.debtIcon, isOwe ? styles.debtIconOwe : styles.debtIconOwed]}>
            {isOwe ? (
              <ArrowUpRight size={20} color={tokens.danger} strokeWidth={2.5} />
            ) : (
              <ArrowDownRight size={20} color={tokens.success} strokeWidth={2.5} />
            )}
          </View>
          <View style={styles.debtInfo}>
            <Text style={styles.debtPerson} numberOfLines={1}>
              {debt.personName}
            </Text>
            {debt.description && (
              <Text style={styles.debtDescription} numberOfLines={2}>
                {debt.description}
              </Text>
            )}
          </View>
          <View style={styles.debtAmounts}>
            <View style={styles.debtRemainingContainer}>
              <Text
                style={[
                  styles.debtRemaining,
                  isOwe ? styles.debtRemainingOwe : styles.debtRemainingOwed,
                ]}
              >
                {isOwe ? '-' : '+'}
                {mask(debt.remainingAmount)}
              </Text>
              <Text style={styles.debtCurrency}>{currency}</Text>
            </View>
            <View style={styles.debtOriginalContainer}>
              <Text style={styles.debtOriginal}>
                {mask(debt.originalAmount)}
              </Text>
              <Text style={styles.debtCurrency}>{currency}</Text>
            </View>
          </View>
        </View>

        {debt.status !== 'paid' && (
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${paidProgress}%`,
                  backgroundColor: isOwe ? tokens.danger : tokens.success,
                },
              ]}
            />
          </View>
        )}

        <View style={styles.debtFooter}>
          <View style={styles.debtDate}>
            <Calendar size={12} color={tokens.textMuted} />
            <Text style={styles.debtDate}>
              {formatDateShort(debt.createdAt, language)}
            </Text>
          </View>
          <View
            style={[
              styles.debtStatus,
              debt.status === 'active' && styles.debtStatusActive,
              debt.status === 'paid' && styles.debtStatusPaid,
              debt.status === 'partial' && styles.debtStatusPartial,
            ]}
          >
            <Text
              style={[
                styles.debtStatusText,
                debt.status === 'active' && styles.debtStatusTextActive,
                debt.status === 'paid' && styles.debtStatusTextPaid,
                debt.status === 'partial' && styles.debtStatusTextPartial,
              ]}
            >
              {(debt.status === 'active' && (i18n.t('debt.status.active') || 'نشط')) ||
                (debt.status === 'paid' && (i18n.t('debt.status.paid') || 'مدفوع')) ||
                (debt.status === 'partial' && (i18n.t('debt.status.partial') || 'جزئي')) ||
                debt.status}
            </Text>
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

export function DebtListScreen() {
  const tokens = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => StyleSheet.create(makeStyles(tokens) as Record<string, object>), [tokens]);
  const { mask } = useBalancePrivacy();
  const balanceVisible = useAppStore((s) => s.balanceVisible);

  const activeWalletId = useAppStore((s) => s.activeWalletId);
  const wallets = useAppStore((s) => s.wallets);
  const setOverlay = useAppStore((s) => s.setOverlay);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [summary, setSummary] = useState({ totalOwed: 0, totalOwing: 0, activeDebtsCount: 0 });
  const [filter, setFilter] = useState<DebtFilter>('all');
  const [loading, setLoading] = useState(true);

  const activeWallet = useMemo(
    () => wallets.find((w) => w.id === activeWalletId),
    [wallets, activeWalletId]
  );
  const currency = activeWallet?.currency ?? 'DZD';

  // Format number for summary (always show, don't mask)
  const formatSummaryNumber = (value: number) => {
    return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  useEffect(() => {
    if (!activeWalletId) {
      setDebts([]);
      setSummary({ totalOwed: 0, totalOwing: 0, activeDebtsCount: 0 });
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      getAllDebtsByWalletId(activeWalletId),
      getDebtSummaryByWalletId(activeWalletId),
    ])
      .then(([debtsList, summaryData]) => {
        setDebts(debtsList);
        setSummary(summaryData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load debts:', err);
        setDebts([]);
        setLoading(false);
      });
  }, [activeWalletId]);

  const filteredDebts = useMemo(() => {
    if (filter === 'all') return debts;
    if (filter === 'active') return debts.filter((d) => d.status === 'active' || d.status === 'partial');
    return debts.filter((d) => d.type === filter);
  }, [debts, filter]);

  const filterCounts = useMemo(() => {
    return {
      all: debts.length,
      owe: debts.filter((d) => d.type === 'owe').length,
      owed: debts.filter((d) => d.type === 'owed').length,
      active: debts.filter((d) => d.status === 'active' || d.status === 'partial').length,
    };
  }, [debts]);

  const handleDebtPress = useCallback(
    (debt: Debt) => {
      useAppStore.getState().setSelectedDebt(debt);
      setOverlay('debtDetails');
    },
    [setOverlay]
  );

  const renderItem = useCallback(
    ({ item }: { item: Debt }) => (
      <DebtCard
        debt={item}
        onPress={() => handleDebtPress(item)}
        currency={currency}
        mask={mask}
        styles={styles}
        tokens={tokens}
      />
    ),
    [handleDebtPress, currency, mask, styles, tokens]
  );

  const showEmpty = !loading && filteredDebts.length === 0;
  const netBalance = summary.totalOwed - summary.totalOwing;

  return (
    <AppContainer>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <PressableScale
              style={styles.backButton}
              onPress={() => setOverlay(null)}
              activeScale={0.9}
            >
              <ArrowLeft size={20} color={tokens.textPrimary} strokeWidth={2.5} />
            </PressableScale>
            <Text style={styles.title}>{i18n.t('debt.title')}</Text>
          </View>
          <PressableScale
            style={styles.addButton}
            onPress={() => setOverlay('addDebt')}
            activeScale={0.9}
          >
            <Plus size={20} color={tokens.white} strokeWidth={2.5} />
          </PressableScale>
        </View>

        {summary.activeDebtsCount > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{i18n.t('debt.totalOwing')}</Text>
              <View style={styles.summaryValueContainer}>
                <Text style={[styles.summaryValue, styles.summaryValueOwing]}>
                  -{formatSummaryNumber(summary.totalOwing)}
                </Text>
                <Text style={styles.summaryCurrency}>{currency}</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{i18n.t('debt.totalOwed')}</Text>
              <View style={styles.summaryValueContainer}>
                <Text style={[styles.summaryValue, styles.summaryValueOwed]}>
                  +{formatSummaryNumber(summary.totalOwed)}
                </Text>
                <Text style={styles.summaryCurrency}>{currency}</Text>
              </View>
            </View>
            <View style={[styles.summaryRow, styles.summaryRowLast]}>
              <Text style={styles.summaryLabel}>{i18n.t('debt.netBalance')}</Text>
              <View style={styles.summaryValueContainer}>
                <Text
                  style={[
                    styles.summaryValue,
                    netBalance >= 0 ? styles.summaryValueOwed : styles.summaryValueOwing,
                  ]}
                >
                  {netBalance >= 0 ? '+' : ''}
                  {formatSummaryNumber(netBalance)}
                </Text>
                <Text style={styles.summaryCurrency}>{currency}</Text>
              </View>
            </View>
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
          style={{ marginBottom: 0 }}
        >
          <Pressable
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === 'all' && styles.filterChipTextActive,
              ]}
            >
              {i18n.t('debt.filter.all')} ({filterCounts.all})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterChip, filter === 'owe' && styles.filterChipActive]}
            onPress={() => setFilter('owe')}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === 'owe' && styles.filterChipTextActive,
              ]}
            >
              {i18n.t('debt.filter.owe')} ({filterCounts.owe})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterChip, filter === 'owed' && styles.filterChipActive]}
            onPress={() => setFilter('owed')}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === 'owed' && styles.filterChipTextActive,
              ]}
            >
              {i18n.t('debt.filter.owed')} ({filterCounts.owed})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterChip, filter === 'active' && styles.filterChipActive]}
            onPress={() => setFilter('active')}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === 'active' && styles.filterChipTextActive,
              ]}
            >
              {i18n.t('debt.filter.active')} ({filterCounts.active})
            </Text>
          </Pressable>
        </ScrollView>

        {showEmpty ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyEmoji}>💳</Text>
            </View>
            <Text style={styles.emptyTitle}>{i18n.t('debt.empty')}</Text>
            <Text style={styles.emptyDesc}>{i18n.t('debt.emptyDesc')}</Text>
          </View>
        ) : (
          <FlatList
            style={styles.list}
            data={filteredDebts}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </AppContainer>
  );
}
