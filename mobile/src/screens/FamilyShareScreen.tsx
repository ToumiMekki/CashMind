import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';

function mergeStyle(
  base: object,
  active: object | false
): object {
  return active ? StyleSheet.flatten([base, active]) : base;
}
import { X, Share2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useAppStore } from '../stores/useAppStore';
import { i18n } from '../i18n';
import { radius } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useBalancePrivacy } from '../hooks/useBalancePrivacy';
import { PressableScale } from '../components/ui/PressableScale';
import {
  buildFamilySharePayload,
  familyShareToJson,
  type TimeRange,
} from '../utils/familySharePayload';
import type { FamilySharedTransaction } from '../database/types';

const TIME_RANGES: { value: TimeRange; labelKey: string }[] = [
  { value: 'this_week', labelKey: 'familyShare.thisWeek' },
  { value: 'this_month', labelKey: 'familyShare.thisMonth' },
  { value: 'custom', labelKey: 'familyShare.last30Days' },
];

function getRangeStart(range: TimeRange): number {
  const now = Date.now();
  const d = new Date(now);
  if (range === 'this_week') {
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1; // Monday as start
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  if (range === 'this_month') {
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  // custom = last 30 days
  d.setDate(d.getDate() - 30);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function makeStyles(t: import('../theme/tokens').ThemeTokens) {
  return {
    root: { flex: 1, backgroundColor: t.background },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    headerTitle: { fontSize: 18, fontWeight: '700' as const, color: t.textPrimary },
    closeBtn: { padding: 8 },
    scroll: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    section: { marginBottom: 24 },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: t.textSecondary,
      marginBottom: 12,
    },
    chipRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 10 },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: radius.full,
      borderWidth: 2,
      borderColor: t.border,
    },
    chipActive: { borderColor: t.primary, backgroundColor: t.primary10 },
    chipText: { fontSize: 14, fontWeight: '500' as const, color: t.textPrimary },
    chipTextActive: { color: t.primary },
    aliasInput: {
      backgroundColor: t.surface,
      borderWidth: 2,
      borderColor: t.border,
      borderRadius: radius.md,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: t.textPrimary,
    },
    qrContainer: {
      alignItems: 'center' as const,
      paddingVertical: 24,
      backgroundColor: t.surface,
      borderRadius: radius.lg,
      marginTop: 16,
    },
    qrPlaceholder: {
      width: 200,
      height: 200,
      backgroundColor: t.borderLight,
      borderRadius: 12,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    qrPlaceholderText: { fontSize: 14, color: t.textMuted },
    summaryText: { fontSize: 13, color: t.textSecondary, marginTop: 12, textAlign: 'center' as const },
    expiresText: { fontSize: 12, color: t.textMuted, marginTop: 8 },
  };
}

export function FamilyShareScreen() {
  const tokens = useTheme();
  const insets = useSafeAreaInsets();
  const setOverlay = useAppStore((s) => s.setOverlay);
  const wallets = useAppStore((s) => s.wallets);
  const activeWalletId = useAppStore((s) => s.activeWalletId);
  const transactions = useAppStore((s) => s.transactions);
  const currentExercice = useAppStore((s) => s.currentExercice);
  const { mask } = useBalancePrivacy();

  const activeWallet = useMemo(
    () => wallets.find((w) => w.id === activeWalletId),
    [wallets, activeWalletId]
  );

  const [timeRange, setTimeRange] = useState<TimeRange>('this_month');
  const [ownerAlias, setOwnerAlias] = useState(activeWallet?.name ?? 'Me');

  const rangeStart = getRangeStart(timeRange);
  const filteredTxs = useMemo(() => {
    return transactions
      .filter((tx) => tx.timestamp >= rangeStart)
      .filter((tx) =>
        ['send', 'receive', 'transfer_in', 'transfer_out'].includes(tx.type)
      )
      .map((tx): FamilySharedTransaction => ({
        transaction_id: tx.id,
        amount: tx.amount,
        category: tx.category,
        timestamp: tx.timestamp,
      }))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions, rangeStart]);

  const payload = useMemo(() => {
    if (!activeWallet || activeWallet.type !== 'family') return null;
    return buildFamilySharePayload({
      walletId: activeWallet.id,
      walletName: activeWallet.name,
      ownerAlias: ownerAlias.trim() || 'Member',
      currency: activeWallet.currency,
      sharedTransactions: filteredTxs,
      expiresInMs: 7 * 24 * 60 * 60 * 1000,
    });
  }, [activeWallet, ownerAlias, filteredTxs]);

  const qrValue = payload ? familyShareToJson(payload) : '';
  const styles = useMemo(
    () => StyleSheet.create(makeStyles(tokens) as Record<string, object>),
    [tokens]
  );

  if (!activeWallet || activeWallet.type !== 'family') {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{i18n.t('familyShare.title')}</Text>
          <Pressable onPress={() => setOverlay(null)} style={styles.closeBtn}>
            <X size={24} color={tokens.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.scrollContent}>
          <Text style={styles.sectionTitle}>
            {i18n.t('familyShare.familyOnly')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{i18n.t('familyShare.title')}</Text>
        <Pressable onPress={() => setOverlay(null)} style={styles.closeBtn}>
          <X size={24} color={tokens.textPrimary} />
        </Pressable>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('familyShare.yourAlias')}</Text>
          <TextInput
            style={styles.aliasInput}
            value={ownerAlias}
            onChangeText={setOwnerAlias}
            placeholder={i18n.t('familyShare.aliasPlaceholder')}
            placeholderTextColor={tokens.textMuted}
            autoCapitalize="words"
          />
          <PressableScale onPress={() => setOwnerAlias(activeWallet.name)}>
            <Text style={{ fontSize: 12, color: tokens.primary, marginTop: 4 }}>
              {i18n.t('familyShare.useWalletName')}
            </Text>
          </PressableScale>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('familyShare.timeRange')}</Text>
          <View style={styles.chipRow}>
            {TIME_RANGES.map((r) => (
              <PressableScale
                key={r.value}
                onPress={() => setTimeRange(r.value)}
                style={timeRange === r.value ? StyleSheet.flatten([styles.chip, styles.chipActive]) : styles.chip}
              >
                <Text
                style={[
                  styles.chipText,
                  ...(timeRange === r.value ? [styles.chipTextActive] : []),
                ]}
                >
                  {i18n.t(r.labelKey)}
                </Text>
              </PressableScale>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('familyShare.sharing')}</Text>
          <View style={styles.qrContainer}>
            {qrValue ? (
              <QRCode value={qrValue} size={200} />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Share2 size={48} color={tokens.textMuted} />
                <Text style={styles.qrPlaceholderText}>
                  {i18n.t('familyShare.noTransactions')}
                </Text>
              </View>
            )}
            <Text style={styles.summaryText}>
              {filteredTxs.length > 0
                ? i18n.t('familyShare.transactionsCount', {
                    count: filteredTxs.length,
                    alias: ownerAlias.trim() || 'Me',
                  })
                : i18n.t('familyShare.noTransactions')}
            </Text>
            <Text style={styles.expiresText}>
              {i18n.t('familyShare.expiresIn', { days: 7 })}
            </Text>
            <Text style={[styles.expiresText, { marginTop: 12, fontSize: 11 }]}>
              {i18n.t('familyShare.sameWalletHint')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
