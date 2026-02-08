import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated as RNAnimated,
  ActivityIndicator,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { TrendingDown, TrendingUp, Eye, EyeOff, BarChart3, ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn, FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../stores/useAppStore';
import { playSound } from '../services/soundManager';
import { i18n } from '../i18n';
import { radius } from '../theme';
import { formatWeekday, formatDateLong, formatDateShort } from '../utils/format';
import { useBalancePrivacy } from '../hooks/useBalancePrivacy';
import { useTheme } from '../hooks/useTheme';
import { AppContainer } from '../components/ui/AppContainer';
import { DailyChart } from '../components/DailyChart';
import { CategoryBreakdownChart } from '../components/CategoryBreakdownChart';
import {
  getDateRangeForPreset,
  getDateRangeCustom,
  getSpendByCategory,
  getReceiveByCategory,
  getDailyBuckets,
  getAnalyticsSummary,
  type DateRangePreset,
  type DateRange,
} from '../repositories/analyticsRepository';
import type { ThemeTokens } from '../theme/tokens';

const PRESETS: DateRangePreset[] = ['today', '7d', '30d', '90d', 'this_month', 'last_month', 'custom'];

function presetLabel(
  key: DateRangePreset,
  customFromTs?: number,
  customToTs?: number,
  isCustomSelected?: boolean
): string {
  if (key === 'custom' && isCustomSelected && customFromTs != null && customToTs != null) {
    const lang = useAppStore.getState().language;
    return `${formatDateShort(customFromTs, lang)} – ${formatDateShort(customToTs, lang)}`;
  }
  const map: Record<DateRangePreset, string> = {
    today: i18n.t('statistics.today'),
    '7d': i18n.t('statistics.last7DaysShort'),
    '30d': i18n.t('statistics.last30Days'),
    '90d': i18n.t('statistics.last90Days'),
    this_month: i18n.t('statistics.thisMonth'),
    last_month: i18n.t('statistics.lastMonth'),
    custom: i18n.t('statistics.custom'),
  };
  return map[key];
}


function makeStatsStyles(t: ThemeTokens) {
  return {
    scroll: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingTop: 0, paddingBottom: 32 },
    header: { marginBottom: 24 },
    title: { fontSize: 28, fontWeight: '800' as const, color: t.textPrimary, letterSpacing: -0.5 },
    subtitle: { fontSize: 14, color: t.textMuted, marginTop: 4, fontWeight: '500' as const },
    balanceCard: {
      borderRadius: 24,
      overflow: 'hidden' as const,
      marginBottom: 24,
      shadowColor: t.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 12,
    },
    balanceInner: { padding: 28, paddingTop: 24 },
    balanceHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 16,
    },
    balanceLabel: { fontSize: 13, color: t.white20, fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: 1 },
    visibilityToggle: { padding: 10, borderRadius: 12, backgroundColor: t.white10 },
    visibilityTogglePressed: { opacity: 0.8 },
    balanceRow: { flexDirection: 'row' as const, alignItems: 'baseline' as const, gap: 10 },
    balanceAmount: {
      fontSize: 40,
      fontWeight: '800' as const,
      color: t.white,
      fontVariant: ['tabular-nums'],
      letterSpacing: -1,
    },
    balanceCurrency: { fontSize: 18, color: t.white20, fontWeight: '600' as const },
    rangeScroll: { marginBottom: 24 },
    rangeContent: { paddingHorizontal: 4, flexDirection: 'row' as const, gap: 10 },
    rangeChip: {
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 14,
      borderWidth: 1,
    },
    summaryRow: { flexDirection: 'row' as const, gap: 14, marginBottom: 24 },
    summaryCard: {
      flex: 1,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      overflow: 'hidden' as const,
    },
    summaryCardSpend: {},
    summaryCardReceive: {},
    summaryIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: 14,
    },
    summaryIconSpend: {},
    summaryIconReceive: {},
    summaryLabel: { fontSize: 12, color: t.textMuted, marginBottom: 6, fontWeight: '600' as const },
    summaryAmountDanger: {
      fontSize: 20,
      fontWeight: '800' as const,
      color: t.danger,
      fontVariant: ['tabular-nums'],
      letterSpacing: -0.5,
    },
    summaryAmountSuccess: {
      fontSize: 20,
      fontWeight: '800' as const,
      color: t.success,
      fontVariant: ['tabular-nums'],
      letterSpacing: -0.5,
    },
    summaryCount: { fontSize: 11, color: t.textMuted, marginTop: 6, fontWeight: '500' as const },
    trendBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
      marginTop: 10,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
      alignSelf: 'flex-start' as const,
    },
    chartCard: {
      borderRadius: 24,
      padding: 24,
      marginBottom: 24,
      borderWidth: 1,
    },
    chartHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 20,
    },
    chartTitle: { fontSize: 17, fontWeight: '700' as const, color: t.textPrimary },
    chartBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    chartBadgeText: { fontSize: 12, color: t.textSecondary, fontWeight: '600' as const },
    avgText: { fontSize: 13, color: t.textMuted, marginBottom: 16, fontWeight: '500' as const },
    categorySection: { marginBottom: 24 },
    categoryCard: {
      borderRadius: 24,
      padding: 24,
      marginBottom: 20,
      borderWidth: 1,
    },
    sectionTitle: { fontSize: 17, fontWeight: '700' as const, color: t.textPrimary, marginBottom: 8 },
    extraRow: { flexDirection: 'row' as const, gap: 14 },
    extraCard: {
      flex: 1,
      borderRadius: 18,
      padding: 20,
      borderWidth: 1,
    },
    extraLabel: { fontSize: 12, color: t.textMuted, marginBottom: 6, fontWeight: '600' as const },
    extraValue: {
      fontSize: 22,
      fontWeight: '800' as const,
      color: t.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    emptyWrap: { flex: 1, justifyContent: 'center' as const },
    emptyCard: {
      borderRadius: 28,
      padding: 56,
      alignItems: 'center' as const,
      borderWidth: 1,
    },
    emptyIcon: {
      width: 96,
      height: 96,
      borderRadius: 48,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: 20,
    },
    emptyEmoji: { fontSize: 44 },
    emptyTitle: { fontSize: 20, fontWeight: '700' as const, color: t.textPrimary, marginBottom: 10 },
    emptyDesc: { fontSize: 15, color: t.textMuted },
    customModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' as const },
    customModalContent: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 24,
      paddingBottom: 32,
      paddingHorizontal: 24,
    },
    customModalTitle: { fontSize: 20, fontWeight: '700' as const, marginBottom: 20 },
    quickChipsWrap: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 10,
    },
    quickChip: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
    },
    quickChipText: { fontSize: 14, fontWeight: '600' as const },
    customRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: 16,
      borderBottomWidth: 1,
    },
    customRowLabel: { fontSize: 15, fontWeight: '600' as const },
    customRowValue: { fontSize: 14 },
    customApplyBtn: {
      marginTop: 24,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center' as const,
    },
  };
}

export function StatisticsScreen() {
  const tokens = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => StyleSheet.create(makeStatsStyles(tokens) as Record<string, object>), [tokens]);

  const language = useAppStore((s) => s.language);
  const balance = useAppStore((s) => s.balance);
  const transactions = useAppStore((s) => s.transactions);
  const wallets = useAppStore((s) => s.wallets);
  const activeWalletId = useAppStore((s) => s.activeWalletId);
  const activeWallet = useMemo(
    () => wallets.find((w) => w.id === activeWalletId),
    [wallets, activeWalletId]
  );
  const currencyLabel = activeWallet?.currency ?? i18n.t('wallet.currency');

  const { visible: balanceVisible, toggle: toggleBalancePrivacy, mask } = useBalancePrivacy();
  const fadeAnim = useRef(new RNAnimated.Value(1)).current;

  const [datePreset, setDatePreset] = useState<DateRangePreset>('30d');
  const defaultCustomFrom = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);
  const defaultCustomTo = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }, []);
  const [customFrom, setCustomFrom] = useState(defaultCustomFrom);
  const [customTo, setCustomTo] = useState(defaultCustomTo);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getAnalyticsSummary>> | null>(null);
  const [spendByCat, setSpendByCat] = useState<Awaited<ReturnType<typeof getSpendByCategory>> | null>(null);
  const [recvByCat, setRecvByCat] = useState<Awaited<ReturnType<typeof getReceiveByCategory>> | null>(null);
  const [dailyBuckets, setDailyBuckets] = useState<Awaited<ReturnType<typeof getDailyBuckets>> | null>(null);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => getDateRangeForPreset(datePreset), [datePreset]);

  const loadAnalytics = useCallback(async () => {
    if (!activeWalletId) return;
    setLoading(true);
    try {
      const [s, spend, recv, daily] = await Promise.all([
        getAnalyticsSummary(activeWalletId, range),
        getSpendByCategory(activeWalletId, range.from, range.to),
        getReceiveByCategory(activeWalletId, range.from, range.to),
        getDailyBuckets(activeWalletId, range.from, range.to),
      ]);
      setSummary(s);
      setSpendByCat(spend);
      setRecvByCat(recv);
      setDailyBuckets(daily);
    } finally {
      setLoading(false);
    }
  }, [activeWalletId, range.from, range.to]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    playSound('analytics_loaded');
  }, []);

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

  const dailyChartData = useMemo(() => {
    if (!dailyBuckets || dailyBuckets.length === 0) return [];
    const maxBars = Math.min(dailyBuckets.length, 14);
    return dailyBuckets.slice(-maxBars).map((b) => ({
      date: formatWeekday(b.timestamp, language),
      amount: b.spent,
    }));
  }, [dailyBuckets, language]);

  const avgDaily = summary ? summary.avgDailySpend : 0;

  if (transactions.length === 0) {
    return (
      <AppContainer>
        <View style={[styles.emptyWrap, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{i18n.t('statistics.title')}</Text>
          </View>
          <View style={[styles.emptyCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: tokens.borderLight }]}>
              <Text style={styles.emptyEmoji}>📊</Text>
            </View>
            <Text style={styles.emptyTitle}>{i18n.t('statistics.noData')}</Text>
            <Text style={styles.emptyDesc}>{i18n.t('statistics.startUsing')}</Text>
          </View>
        </View>
      </AppContainer>
    );
  }

  const gradientColors: [string, string, ...string[]] = [
    tokens.primary,
    tokens.primaryDark,
    '#1E3A8A',
  ];

  return (
    <AppContainer>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{i18n.t('statistics.title')}</Text>
          <Text style={[styles.subtitle, { color: tokens.textMuted }]}>
            {i18n.t('statistics.byCategory')}
          </Text>
        </View>

        <Animated.View entering={FadeInDown.duration(400)} style={styles.balanceCard}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceInner}
          >
            <RNAnimated.View style={{ opacity: fadeAnim }}>
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>{i18n.t('statistics.currentBalance')}</Text>
                <Pressable
                  onPress={handleTogglePrivacy}
                  style={({ pressed }) => [styles.visibilityToggle, pressed && styles.visibilityTogglePressed]}
                  hitSlop={12}
                >
                  {balanceVisible ? (
                    <EyeOff size={20} color="rgba(255,255,255,0.9)" />
                  ) : (
                    <Eye size={20} color="rgba(255,255,255,0.9)" />
                  )}
                </Pressable>
              </View>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceAmount}>{mask(balance)}</Text>
                <Text style={styles.balanceCurrency}>{currencyLabel}</Text>
              </View>
            </RNAnimated.View>
          </LinearGradient>
        </Animated.View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.rangeScroll, styles.rangeContent]}
        >
          {PRESETS.map((p) => (
            <Pressable
              key={p}
              style={[
                styles.rangeChip,
                {
                  backgroundColor: datePreset === p ? tokens.primary : tokens.surface,
                  borderColor: datePreset === p ? tokens.primary : tokens.border,
                },
              ]}
              onPress={() => {
                if (p === 'custom') {
                  setShowCustomModal(true);
                } else {
                  setDatePreset(p);
                }
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: datePreset === p ? tokens.white : tokens.textSecondary,
                }}
              >
                {presetLabel(p, customFrom, customTo, datePreset === 'custom')}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Modal
          visible={showCustomModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCustomModal(false)}
        >
          <Pressable
            style={styles.customModalOverlay}
            onPress={() => setShowCustomModal(false)}
          >
            <Pressable
              style={[
                styles.customModalContent,
                { backgroundColor: tokens.surface },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <Text style={[styles.customModalTitle, { color: tokens.textPrimary }]}>
                {i18n.t('statistics.selectDate')}
              </Text>
              <Text style={[styles.customRowLabel, { color: tokens.textMuted, marginBottom: 12 }]}>
                {i18n.t('statistics.quickSelect')}
              </Text>
              <View style={styles.quickChipsWrap}>
                {[
                  { key: '7d', days: 7, label: i18n.t('statistics.range7d') },
                  { key: '14d', days: 14, label: i18n.t('statistics.range14d') },
                  { key: '30d', days: 30, label: i18n.t('statistics.range30d') },
                  { key: '65d', days: 65, label: i18n.t('statistics.range65d') },
                  { key: '3mo', months: 3, label: i18n.t('statistics.range3mo') },
                  { key: '6mo', months: 6, label: i18n.t('statistics.range6mo') },
                  { key: '7mo', months: 7, label: i18n.t('statistics.range7mo') },
                  { key: '1y', months: 12, label: i18n.t('statistics.range1y') },
                ].map(({ key, days, months, label }) => (
                  <Pressable
                    key={key}
                    style={[styles.quickChip, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                    onPress={() => {
                      const to = new Date();
                      to.setHours(23, 59, 59, 999);
                      const from = new Date();
                      if (days != null) {
                        from.setDate(from.getDate() - days);
                      } else if (months != null) {
                        from.setMonth(from.getMonth() - months);
                      }
                      from.setHours(0, 0, 0, 0);
                      setCustomFrom(from.getTime());
                      setCustomTo(to.getTime());
                      setDatePreset('custom');
                      setShowCustomModal(false);
                    }}
                  >
                    <Text style={[styles.quickChipText, { color: tokens.textPrimary }]}>{label}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[styles.customRowLabel, { color: tokens.textMuted, marginTop: 20, marginBottom: 12 }]}>
                {i18n.t('statistics.from')} / {i18n.t('statistics.to')}
              </Text>
              <View style={[styles.customRow, { borderColor: tokens.border }]}>
                <Text style={[styles.customRowLabel, { color: tokens.textPrimary }]}>
                  {i18n.t('statistics.from')}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Pressable
                    onPress={() => {
                      const d = new Date(customFrom);
                      d.setDate(d.getDate() - 1);
                      d.setHours(0, 0, 0, 0);
                      const ts = d.getTime();
                      if (ts <= customTo) setCustomFrom(ts);
                    }}
                    style={({ pressed }) => [{ padding: 8, opacity: pressed ? 0.6 : 1 }]}
                  >
                    <ChevronLeft size={24} color={tokens.primary} />
                  </Pressable>
                  <Text style={[styles.customRowValue, { color: tokens.textPrimary, fontWeight: '600' }]}>
                    {formatDateLong(customFrom, language)}
                  </Text>
                  <Pressable
                    onPress={() => {
                      const d = new Date(customFrom);
                      d.setDate(d.getDate() + 1);
                      d.setHours(0, 0, 0, 0);
                      const ts = d.getTime();
                      if (ts <= customTo) setCustomFrom(ts);
                    }}
                    style={({ pressed }) => [{ padding: 8, opacity: pressed ? 0.6 : 1 }]}
                  >
                    <ChevronRight size={24} color={tokens.primary} />
                  </Pressable>
                </View>
              </View>
              <View style={[styles.customRow, { borderColor: tokens.border }]}>
                <Text style={[styles.customRowLabel, { color: tokens.textPrimary }]}>
                  {i18n.t('statistics.to')}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Pressable
                    onPress={() => {
                      const d = new Date(customTo);
                      d.setDate(d.getDate() - 1);
                      d.setHours(23, 59, 59, 999);
                      const ts = d.getTime();
                      if (ts >= customFrom) setCustomTo(ts);
                    }}
                    style={({ pressed }) => [{ padding: 8, opacity: pressed ? 0.6 : 1 }]}
                  >
                    <ChevronLeft size={24} color={tokens.primary} />
                  </Pressable>
                  <Text style={[styles.customRowValue, { color: tokens.textPrimary, fontWeight: '600' }]}>
                    {formatDateLong(customTo, language)}
                  </Text>
                  <Pressable
                    onPress={() => {
                      const d = new Date(customTo);
                      d.setDate(d.getDate() + 1);
                      d.setHours(23, 59, 59, 999);
                      const ts = d.getTime();
                      const now = new Date();
                      now.setHours(23, 59, 59, 999);
                      if (ts <= now.getTime() && ts >= customFrom) setCustomTo(ts);
                    }}
                    style={({ pressed }) => [{ padding: 8, opacity: pressed ? 0.6 : 1 }]}
                  >
                    <ChevronRight size={24} color={tokens.primary} />
                  </Pressable>
                </View>
              </View>
              <Pressable
                style={[styles.customApplyBtn, { backgroundColor: tokens.primary }]}
                onPress={() => {
                  setDatePreset('custom');
                  setShowCustomModal(false);
                }}
              >
                <Text style={{ color: tokens.white, fontSize: 16, fontWeight: '700' }}>
                  {i18n.t('statistics.apply')}
                </Text>
              </Pressable>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        {loading ? (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={tokens.primary} />
          </View>
        ) : (
          <RNAnimated.View style={[{ opacity: fadeAnim }]} entering={FadeIn.duration(300)}>
            {summary && (
              <View style={styles.summaryRow}>
                <Animated.View
                  entering={FadeInRight.duration(400).delay(80)}
                  style={[
                    styles.summaryCard,
                    {
                      backgroundColor: tokens.surface,
                      borderColor: tokens.border,
                    },
                  ]}
                >
                  <View style={[styles.summaryIcon, { backgroundColor: tokens.dangerLight }]}>
                    <ArrowDownRight size={22} color={tokens.danger} />
                  </View>
                  <Text style={styles.summaryLabel}>{i18n.t('statistics.totalSpent')}</Text>
                  <Text style={styles.summaryAmountDanger}>{mask(summary.totalSpent)}</Text>
                  <Text style={styles.summaryCount}>
                    {summary.spendCount} {i18n.t('statistics.transactions')}
                  </Text>
                  {summary.spendTrendPercent != null && (
                    <View
                      style={[
                        styles.trendBadge,
                        {
                          backgroundColor:
                            summary.spendTrendPercent > 0 ? tokens.dangerLight : tokens.successLight,
                        },
                      ]}
                    >
                      {summary.spendTrendPercent > 0 ? (
                        <TrendingDown size={12} color={tokens.danger} />
                      ) : (
                        <TrendingUp size={12} color={tokens.success} />
                      )}
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '700',
                          color: summary.spendTrendPercent > 0 ? tokens.danger : tokens.success,
                        }}
                      >
                        {summary.spendTrendPercent > 0
                          ? i18n.t('statistics.trendUp', {
                              percent: summary.spendTrendPercent.toFixed(0),
                            })
                          : i18n.t('statistics.trendDown', {
                              percent: Math.abs(summary.spendTrendPercent).toFixed(0),
                            })}
                      </Text>
                    </View>
                  )}
                </Animated.View>
                <Animated.View
                  entering={FadeInRight.duration(400).delay(120)}
                  style={[
                    styles.summaryCard,
                    {
                      backgroundColor: tokens.surface,
                      borderColor: tokens.border,
                    },
                  ]}
                >
                  <View style={[styles.summaryIcon, { backgroundColor: tokens.successLight }]}>
                    <ArrowUpRight size={22} color={tokens.success} />
                  </View>
                  <Text style={styles.summaryLabel}>{i18n.t('statistics.totalReceived')}</Text>
                  <Text style={styles.summaryAmountSuccess}>{mask(summary.totalReceived)}</Text>
                  <Text style={styles.summaryCount}>
                    {summary.receiveCount} {i18n.t('statistics.transactions')}
                  </Text>
                </Animated.View>
              </View>
            )}

            {dailyChartData.length > 0 && (
              <Animated.View
                entering={FadeInDown.duration(350).delay(100)}
                style={[styles.chartCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
              >
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>{i18n.t('statistics.dailySpending')}</Text>
                  <View style={[styles.chartBadge, { backgroundColor: tokens.borderLight }]}>
                    <BarChart3 size={14} color={tokens.textSecondary} />
                    <Text style={[styles.chartBadgeText, { color: tokens.textSecondary }]}>
                      {presetLabel(datePreset, customFrom, customTo, datePreset === 'custom')}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.avgText, { color: tokens.textMuted }]}>
                  {i18n.t('statistics.avgPerDay')}: {mask(avgDaily)} {currencyLabel}
                </Text>
                <DailyChart data={dailyChartData} avgDaily={avgDaily} tokens={tokens} />
              </Animated.View>
            )}

            {spendByCat && spendByCat.breakdown.length > 0 && (
              <View style={styles.categorySection}>
                <Text style={[styles.sectionTitle, { color: tokens.textPrimary }]}>
                  {i18n.t('statistics.spendingByCategory')}
                </Text>
                <Animated.View
                  entering={FadeInDown.duration(350).delay(150)}
                  style={[styles.categoryCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                >
                  <CategoryBreakdownChart
                    data={spendByCat.breakdown}
                    total={spendByCat.total}
                    tokens={tokens}
                    mask={mask}
                    currency={currencyLabel}
                    maxBars={8}
                  />
                </Animated.View>
              </View>
            )}

            {recvByCat && recvByCat.breakdown.length > 0 && (
              <View style={styles.categorySection}>
                <Text style={[styles.sectionTitle, { color: tokens.textPrimary }]}>
                  {i18n.t('statistics.incomeByCategory')}
                </Text>
                <Animated.View
                  entering={FadeInDown.duration(350).delay(180)}
                  style={[styles.categoryCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                >
                  <CategoryBreakdownChart
                    data={recvByCat.breakdown}
                    total={recvByCat.total}
                    tokens={tokens}
                    mask={mask}
                    currency={currencyLabel}
                    maxBars={8}
                  />
                </Animated.View>
              </View>
            )}

            {summary && (
              <View style={styles.extraRow}>
                <Animated.View
                  entering={FadeInRight.duration(400).delay(200)}
                  style={[styles.extraCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                >
                  <Text style={[styles.extraLabel, { color: tokens.textMuted }]}>
                    {i18n.t('statistics.largestTransaction')}
                  </Text>
                  <Text style={[styles.extraValue, { color: tokens.textPrimary }]}>
                    {mask(Math.max(summary.largestSpend, summary.largestReceive))}
                  </Text>
                </Animated.View>
                <Animated.View
                  entering={FadeInRight.duration(400).delay(240)}
                  style={[styles.extraCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                >
                  <Text style={[styles.extraLabel, { color: tokens.textMuted }]}>
                    {i18n.t('statistics.netFlow')}
                  </Text>
                  <Text
                    style={[
                      styles.extraValue,
                      { color: summary.netFlow >= 0 ? tokens.success : tokens.danger },
                    ]}
                  >
                    {summary.netFlow >= 0 ? '+' : ''}
                    {mask(summary.netFlow)}
                  </Text>
                </Animated.View>
              </View>
            )}
          </RNAnimated.View>
        )}
      </ScrollView>
    </AppContainer>
  );
}
