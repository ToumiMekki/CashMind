import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ListRenderItem,
  Pressable,
  ScrollView,
} from 'react-native';
import { Send, Download, ChevronRight, Lock, Unlock, CreditCard, ArrowLeftRight, Calendar, Briefcase, User, Users } from 'lucide-react-native';
import { useAppStore } from '../stores/useAppStore';
import { i18n } from '../i18n';
import { radius } from '../theme';
import { formatTime, formatLedgerDate } from '../utils/format';
import type { Transaction } from '../database/types';
import { useTheme } from '../hooks/useTheme';
import { useBalancePrivacy } from '../hooks/useBalancePrivacy';
import { AppContainer } from '../components/ui/AppContainer';
import { PressableScale } from '../components/ui/PressableScale';
import type { ThemeTokens } from '../theme/tokens';
import { getTransactionsByWalletId } from '../repositories/transactionRepository';

export type LedgerFilter = 'today' | 'week' | 'month' | 'all';
export type TransactionCategoryFilter = 'all' | 'business' | 'personal' | 'family';

type GroupedItem = { type: 'header'; date: string } | { type: 'tx'; tx: Transaction };

function todayStart(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function todayEnd(): number {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function weekStart(): number {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function monthStart(): number {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function monthEnd(): number {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function isBusinessTransaction(tx: Transaction): boolean {
  return tx.type === 'business_payment_send' || tx.type === 'business_payment_receive';
}

function isFamilyTransaction(tx: Transaction): boolean {
  return tx.type === 'transfer_in' || tx.type === 'transfer_out';
}

function isPersonalTransaction(tx: Transaction): boolean {
  return tx.type === 'send' || tx.type === 'receive';
}

function filterTransactionsByCategory(
  transactions: Transaction[],
  categoryFilter: TransactionCategoryFilter
): Transaction[] {
  if (categoryFilter === 'all') {
    return transactions;
  }
  return transactions.filter((tx) => {
    if (categoryFilter === 'business') {
      return isBusinessTransaction(tx);
    }
    if (categoryFilter === 'family') {
      return isFamilyTransaction(tx);
    }
    if (categoryFilter === 'personal') {
      return isPersonalTransaction(tx);
    }
    return true;
  });
}

function filterTransactions(
  transactions: Transaction[],
  timeFilter: LedgerFilter,
  categoryFilter: TransactionCategoryFilter
): Transaction[] {
  // First filter by category
  let filtered = filterTransactionsByCategory(transactions, categoryFilter);
  
  // Then filter by time
  if (timeFilter === 'all') {
    return filtered;
  }
  const now = Date.now();
  let start: number;
  let end: number;
  if (timeFilter === 'today') {
    start = todayStart();
    end = todayEnd();
  } else if (timeFilter === 'week') {
    start = weekStart();
    end = now;
  } else {
    start = monthStart();
    end = monthEnd();
  }
  return filtered.filter((tx) => tx.timestamp >= start && tx.timestamp <= end);
}

function LedgerRow({
  item,
  onPress,
  currency,
  mask,
  styles,
  tokens,
}: {
  item: GroupedItem;
  onPress: (tx: Transaction) => void;
  currency: string;
  mask: (v: number) => string;
  styles: Record<string, import('react-native').ViewStyle | import('react-native').TextStyle | import('react-native').ImageStyle>;
  tokens: ThemeTokens;
}) {
  const language = useAppStore((s) => s.language);
  const isRTL = language === 'ar';

  if (item.type === 'header') {
    return (
      <View style={styles.dateRow}>
        <Text style={styles.dateText}>{item.date}</Text>
        <View style={styles.dateLine} />
      </View>
    );
  }

  const tx = item.tx;
  const isSend = tx.type === 'send' || tx.type === 'transfer_out' || tx.type === 'business_payment_send';
  const isReceive = tx.type === 'receive' || tx.type === 'transfer_in' || tx.type === 'business_payment_receive';
  const isFreeze = tx.type === 'freeze';
  const isUnfreeze = tx.type === 'unfreeze';
  const isFreezeSpend = tx.type === 'freeze_spend';
  const isTransfer = tx.type === 'transfer_in' || tx.type === 'transfer_out';
  const isBusiness = tx.type === 'business_payment_send' || tx.type === 'business_payment_receive';

  let label: string;
  let Icon: typeof Send | typeof ArrowLeftRight | typeof Download;
  let iconColor: string;
  let amountSign: string;
  let amountStyle: 'send' | 'receive';

  if (isBusiness) {
    label = tx.type === 'business_payment_send'
      ? `${i18n.t('businessMode.title')} → ${tx.receiver ?? ''}`
      : `${i18n.t('businessMode.title')} ←`;
    Icon = tx.type === 'business_payment_send' ? Send : Download;
    iconColor = tx.type === 'business_payment_send' ? tokens.danger : tokens.success;
    amountSign = tx.type === 'business_payment_send' ? '-' : '+';
    amountStyle = tx.type === 'business_payment_send' ? 'send' : 'receive';
  } else if (isFreeze) {
    label = i18n.t('ledger.freeze');
    Icon = Lock;
    iconColor = tokens.primary;
    amountSign = '-';
    amountStyle = 'send';
  } else if (isUnfreeze) {
    label = i18n.t('ledger.unfreeze');
    Icon = Unlock;
    iconColor = tokens.success;
    amountSign = '+';
    amountStyle = 'receive';
  } else if (isFreezeSpend) {
    label = i18n.t('ledger.freezeSpend');
    Icon = CreditCard;
    iconColor = tokens.accent;
    amountSign = '-';
    amountStyle = 'send';
  } else if (isTransfer) {
    label = i18n.t('wallet.transfer');
    Icon = ArrowLeftRight;
    iconColor = tokens.primary;
    amountSign = tx.type === 'transfer_out' ? '-' : '+';
    amountStyle = tx.type === 'transfer_out' ? 'send' : 'receive';
  } else if (isSend) {
    label = `${i18n.t('ledger.you')} → ${tx.receiver ?? i18n.t('ledger.sent')}`;
    Icon = Send;
    iconColor = tokens.danger;
    amountSign = '-';
    amountStyle = 'send';
  } else {
    label = `${tx.sender ?? i18n.t('ledger.received')} → ${i18n.t('ledger.you')}`;
    Icon = Download;
    iconColor = tokens.success;
    amountSign = '+';
    amountStyle = 'receive';
  }

  const note = (tx.category ?? '').trim();

  return (
    <Pressable
      style={({ pressed }) => [styles.txCard, pressed && styles.txCardPressed]}
      onPress={() => onPress(tx)}
    >
      <View style={styles.txMain}>
        <View style={[styles.txIcon, amountStyle === 'send' ? styles.txIconSend : styles.txIconReceive]}>
          <Icon size={18} color={iconColor} />
        </View>
        <View style={styles.txCenter}>
          <Text style={styles.txLabel} numberOfLines={1}>
            {label}
          </Text>
          {note ? (
            <Text style={styles.txNote} numberOfLines={1}>
              {note}
            </Text>
          ) : null}
        </View>
        <View style={styles.txRight}>
          <Text
            style={[
              styles.txAmount,
              amountStyle === 'send' ? styles.txAmountSend : styles.txAmountReceive,
            ]}
          >
            {amountSign}
            {mask(tx.amount)} {currency}
          </Text>
          <Text style={styles.txTime}>{formatTime(tx.timestamp, language)}</Text>
        </View>
        <ChevronRight
          size={18}
          color={tokens.textMuted}
          style={isRTL ? { transform: [{ rotate: '180deg' }] } : undefined}
        />
      </View>
    </Pressable>
  );
}

function createLedgerStyles(t: ThemeTokens) {
  return {
    header: { marginBottom: 8 },
    title: {
      fontSize: 22,
      fontWeight: '700' as const,
      color: t.textPrimary,
      marginBottom: 1,
      letterSpacing: -0.2,
    },
    subtitle: {
      fontSize: 13,
      color: t.textSecondary,
      marginBottom: 8,
    },
    filterSection: {
      marginBottom: 6,
    },
    filterSectionLabel: {
      fontSize: 10,
      fontWeight: '700' as const,
      color: t.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.3,
      marginBottom: 4,
      paddingHorizontal: 2,
    },
    filterRow: {
      flexDirection: 'row' as const,
    },
    filterScrollView: {
      paddingRight: 6,
    },
    filterChip: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: t.surface,
      borderWidth: 1.5,
      borderColor: t.border,
      shadowColor: t.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 1.5,
      elevation: 1,
      marginRight: 5,
    },
    filterChipActive: {
      backgroundColor: t.primary,
      borderColor: t.primary,
      shadowColor: t.primary,
      shadowOpacity: 0.12,
      shadowRadius: 2.5,
      elevation: 2,
    },
    filterChipText: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: t.textSecondary,
    },
    filterChipTextActive: {
      color: t.white,
      fontWeight: '700' as const,
    },
    filterChipIcon: {
      opacity: 0.7,
    },
    filterChipIconActive: {
      opacity: 1,
    },
    list: { flex: 1 },
    listContent: { paddingTop: 0, paddingBottom: 12 },
    dateRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 10,
      marginTop: 14,
      marginBottom: 8,
      paddingHorizontal: 2,
    },
    dateText: {
      fontSize: 12,
      fontWeight: '700' as const,
      color: t.textSecondary,
      letterSpacing: 0.2,
      textTransform: 'uppercase' as const,
    },
    dateLine: {
      flex: 1,
      height: 1.5,
      backgroundColor: t.border,
      borderRadius: 1,
    },
    txCard: {
      backgroundColor: t.surface,
      borderRadius: radius.md,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: t.border,
      shadowColor: t.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    txCardPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    txMain: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
    },
    txIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    txIconSend: { backgroundColor: t.dangerLight },
    txIconReceive: { backgroundColor: t.successLight },
    txCenter: { flex: 1, minWidth: 0, justifyContent: 'center' as const },
    txLabel: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: t.textPrimary,
      letterSpacing: -0.2,
    },
    txNote: {
      fontSize: 12,
      color: t.textMuted,
      marginTop: 2,
    },
    txRight: {
      alignItems: 'flex-end' as const,
      justifyContent: 'center' as const,
    },
    txAmount: {
      fontSize: 15,
      fontWeight: '700' as const,
      fontVariant: ['tabular-nums'] as ('tabular-nums')[],
    },
    txAmountSend: { color: t.danger },
    txAmountReceive: { color: t.success },
    txTime: {
      fontSize: 12,
      color: t.textMuted,
      marginTop: 2,
      fontVariant: ['tabular-nums'] as ('tabular-nums')[],
    },
    emptyCard: {
      flex: 1,
      backgroundColor: t.surface,
      borderRadius: radius.lg,
      padding: 48,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 1,
      borderColor: t.border,
      marginTop: 20,
    },
    emptyIcon: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: t.borderLight,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: 20,
      shadowColor: t.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    emptyEmoji: { fontSize: 40 },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: t.textPrimary,
      marginBottom: 8,
      letterSpacing: -0.3,
    },
    emptyDesc: {
      fontSize: 15,
      color: t.textMuted,
      textAlign: 'center' as const,
      lineHeight: 22,
    },
  };
}

export function LedgerScreen() {
  const tokens = useTheme();
  const styles = useMemo(
    () => StyleSheet.create(createLedgerStyles(tokens) as Record<string, object>),
    [tokens]
  );

  const language = useAppStore((s) => s.language);
  const setSelectedTransaction = useAppStore((s) => s.setSelectedTransaction);
  const wallets = useAppStore((s) => s.wallets);
  const activeWalletId = useAppStore((s) => s.activeWalletId);
  const { mask } = useBalancePrivacy();

  const [timeFilter, setTimeFilter] = useState<LedgerFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<TransactionCategoryFilter>('all');
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const activeWallet = useMemo(
    () => wallets.find((w) => w.id === activeWalletId),
    [wallets, activeWalletId]
  );
  const currency: string = activeWallet?.currency ?? i18n.t('ledger.currency');

  // Load all transactions for the active wallet from database
  useEffect(() => {
    if (!activeWalletId) {
      setAllTransactions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getTransactionsByWalletId(activeWalletId)
      .then((txs) => {
        setAllTransactions(txs);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load transactions:', err);
        setAllTransactions([]);
        setLoading(false);
      });
  }, [activeWalletId]);

  const filtered = useMemo(
    () => filterTransactions(allTransactions, timeFilter, categoryFilter),
    [allTransactions, timeFilter, categoryFilter]
  );

  const grouped = useMemo(() => {
    const items: GroupedItem[] = [];
    const byDate = new Map<string, Transaction[]>();
    for (const tx of filtered) {
      const date = formatLedgerDate(tx.timestamp, language);
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date)!.push(tx);
    }
    const sortedDates = Array.from(byDate.keys()).sort((a, b) => {
      const d1 = byDate.get(a)![0].timestamp;
      const d2 = byDate.get(b)![0].timestamp;
      return d2 - d1;
    });
    for (const date of sortedDates) {
      items.push({ type: 'header', date });
      for (const tx of byDate.get(date)!) {
        items.push({ type: 'tx', tx });
      }
    }
    return items;
  }, [filtered, language]);

  const handleTxPress = useCallback(
    (tx: Transaction) => setSelectedTransaction(tx),
    [setSelectedTransaction]
  );

  const renderItem = useCallback<ListRenderItem<GroupedItem>>(
    ({ item }) => (
      <LedgerRow
        item={item}
        onPress={handleTxPress}
        currency={currency}
        mask={mask}
        styles={styles}
        tokens={tokens}
      />
    ),
    [handleTxPress, currency, mask, styles, tokens]
  );

  const keyExtractor = useCallback((item: GroupedItem) => {
    return item.type === 'header' ? `h-${item.date}` : item.tx.id;
  }, []);

  const showEmpty = !loading && (allTransactions.length === 0 || filtered.length === 0);
  const emptyFiltered = !loading && allTransactions.length > 0 && filtered.length === 0;

  return (
    <AppContainer>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{i18n.t('ledger.title')}</Text>
          <Text style={styles.subtitle}>{i18n.t('ledger.subtitle')}</Text>
        </View>
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionLabel}>{i18n.t('ledger.timePeriod')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollView}
            style={styles.filterRow}
          >
            <PressableScale
              style={[styles.filterChip, timeFilter === 'today' && styles.filterChipActive]}
              onPress={() => setTimeFilter('today')}
              activeScale={0.96}
            >
              <Calendar
                size={12}
                color={timeFilter === 'today' ? tokens.white : tokens.textSecondary}
                strokeWidth={2.5}
              />
              <Text
                style={[
                  styles.filterChipText,
                  timeFilter === 'today' && styles.filterChipTextActive,
                ]}
              >
                {i18n.t('ledger.today')}
              </Text>
            </PressableScale>
            <PressableScale
              style={[styles.filterChip, timeFilter === 'week' && styles.filterChipActive]}
              onPress={() => setTimeFilter('week')}
              activeScale={0.96}
            >
              <Calendar
                size={14}
                color={timeFilter === 'week' ? tokens.white : tokens.textSecondary}
                strokeWidth={2.5}
              />
              <Text
                style={[
                  styles.filterChipText,
                  timeFilter === 'week' && styles.filterChipTextActive,
                ]}
              >
                {i18n.t('ledger.week')}
              </Text>
            </PressableScale>
            <PressableScale
              style={[styles.filterChip, timeFilter === 'month' && styles.filterChipActive]}
              onPress={() => setTimeFilter('month')}
              activeScale={0.96}
            >
              <Calendar
                size={14}
                color={timeFilter === 'month' ? tokens.white : tokens.textSecondary}
                strokeWidth={2.5}
              />
              <Text
                style={[
                  styles.filterChipText,
                  timeFilter === 'month' && styles.filterChipTextActive,
                ]}
              >
                {i18n.t('ledger.month')}
              </Text>
            </PressableScale>
            <PressableScale
              style={[styles.filterChip, timeFilter === 'all' && styles.filterChipActive]}
              onPress={() => setTimeFilter('all')}
              activeScale={0.96}
            >
              <Calendar
                size={14}
                color={timeFilter === 'all' ? tokens.white : tokens.textSecondary}
                strokeWidth={2.5}
              />
              <Text
                style={[
                  styles.filterChipText,
                  timeFilter === 'all' && styles.filterChipTextActive,
                ]}
              >
                {i18n.t('ledger.all')}
              </Text>
            </PressableScale>
          </ScrollView>
        </View>
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionLabel}>{i18n.t('ledger.transactionType')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollView}
            style={styles.filterRow}
          >
            <PressableScale
              style={[styles.filterChip, categoryFilter === 'all' && styles.filterChipActive]}
              onPress={() => setCategoryFilter('all')}
              activeScale={0.96}
            >
              <Text
                style={[
                  styles.filterChipText,
                  categoryFilter === 'all' && styles.filterChipTextActive,
                ]}
              >
                {i18n.t('ledger.allTransactions')}
              </Text>
            </PressableScale>
            <PressableScale
              style={[styles.filterChip, categoryFilter === 'business' && styles.filterChipActive]}
              onPress={() => setCategoryFilter('business')}
              activeScale={0.96}
            >
              <Briefcase
                size={12}
                color={categoryFilter === 'business' ? tokens.white : tokens.textSecondary}
                strokeWidth={2.5}
              />
              <Text
                style={[
                  styles.filterChipText,
                  categoryFilter === 'business' && styles.filterChipTextActive,
                ]}
              >
                {i18n.t('ledger.business')}
              </Text>
            </PressableScale>
            <PressableScale
              style={[styles.filterChip, categoryFilter === 'personal' && styles.filterChipActive]}
              onPress={() => setCategoryFilter('personal')}
              activeScale={0.96}
            >
              <User
                size={12}
                color={categoryFilter === 'personal' ? tokens.white : tokens.textSecondary}
                strokeWidth={2.5}
              />
              <Text
                style={[
                  styles.filterChipText,
                  categoryFilter === 'personal' && styles.filterChipTextActive,
                ]}
              >
                {i18n.t('ledger.personal')}
              </Text>
            </PressableScale>
            <PressableScale
              style={[styles.filterChip, categoryFilter === 'family' && styles.filterChipActive]}
              onPress={() => setCategoryFilter('family')}
              activeScale={0.96}
            >
              <Users
                size={12}
                color={categoryFilter === 'family' ? tokens.white : tokens.textSecondary}
                strokeWidth={2.5}
              />
              <Text
                style={[
                  styles.filterChipText,
                  categoryFilter === 'family' && styles.filterChipTextActive,
                ]}
              >
                {i18n.t('ledger.family')}
              </Text>
            </PressableScale>
          </ScrollView>
        </View>
      </View>

      {showEmpty ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyEmoji}>📋</Text>
          </View>
          <Text style={styles.emptyTitle}>
            {emptyFiltered ? i18n.t('ledger.emptyFilter') : i18n.t('ledger.empty')}
          </Text>
          <Text style={styles.emptyDesc}>
            {emptyFiltered ? i18n.t('ledger.emptyFilterDesc') : i18n.t('ledger.emptyDesc')}
          </Text>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={grouped}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={null}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          maxToRenderPerBatch={12}
          windowSize={5}
          initialNumToRender={15}
        />
      )}
    </AppContainer>
  );
}
