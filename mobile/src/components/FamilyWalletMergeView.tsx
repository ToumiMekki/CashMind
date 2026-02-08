import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Send, Download, ArrowLeftRight, Users } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppStore } from '../stores/useAppStore';
import { i18n } from '../i18n';
import { radius } from '../theme';
import { formatTime } from '../utils/format';
import { useBalancePrivacy } from '../hooks/useBalancePrivacy';
import { useTheme } from '../hooks/useTheme';
import { PressableScale } from './ui/PressableScale';
import { getSharedViewsByTargetWallet } from '../repositories/sharedTransactionsViewRepository';
import type { SharedTransactionView } from '../database/types';
import type { FamilySharedTransaction } from '../database/types';

type MergeTx = {
  id: string;
  amount: number;
  timestamp: number;
  category?: string;
  memberAlias: string;
  isSend: boolean;
  isTransfer: boolean;
};

function parseSharedData(raw: string): FamilySharedTransaction[] {
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function FamilyWalletMergeView() {
  const tokens = useTheme();
  const language = useAppStore((s) => s.language);
  const transactions = useAppStore((s) => s.transactions);
  const activeWalletId = useAppStore((s) => s.activeWalletId);
  const activeWallet = useAppStore((s) => s.wallets).find((w) => w.id === activeWalletId);
  const { mask } = useBalancePrivacy();
  const [sharedViews, setSharedViews] = useState<SharedTransactionView[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const sharedViewRefreshTrigger = useAppStore((s) => s.sharedViewRefreshTrigger);

  useEffect(() => {
    if (!activeWalletId || activeWallet?.type !== 'family') return;
    getSharedViewsByTargetWallet(activeWalletId).then(setSharedViews);
  }, [activeWalletId, activeWallet?.type, sharedViewRefreshTrigger]);

  const memberAliases = useMemo(() => {
    const set = new Set<string>();
    sharedViews.forEach((v) => set.add(v.owner_alias));
    return Array.from(set);
  }, [sharedViews]);

  const meAlias = activeWallet?.name ?? 'Me';

  const mergeTxs = useMemo((): MergeTx[] => {
    const result: MergeTx[] = [];

    const meAlias = activeWallet?.name ?? 'Me';
    transactions
      .filter((tx) =>
        ['send', 'receive', 'transfer_in', 'transfer_out'].includes(tx.type)
      )
      .forEach((tx) => {
        const isSend =
          tx.type === 'send' || tx.type === 'transfer_out';
        const isReceive =
          tx.type === 'receive' || tx.type === 'transfer_in';
        const isTransfer = tx.type === 'transfer_in' || tx.type === 'transfer_out';
        result.push({
          id: tx.id,
          amount: tx.amount,
          timestamp: tx.timestamp,
          category: tx.category,
          memberAlias: meAlias,
          isSend,
          isTransfer: isTransfer,
        });
      });

    sharedViews.forEach((sv) => {
      const items = parseSharedData(sv.shared_data);
      items.forEach((item) => {
        result.push({
          id: `${sv.id}_${item.transaction_id}`,
          amount: item.amount,
          timestamp: item.timestamp,
          category: item.category,
          memberAlias: sv.owner_alias,
          isSend: true,
          isTransfer: false,
        });
      });
    });

    result.sort((a, b) => b.timestamp - a.timestamp);
    return result;
  }, [transactions, sharedViews, activeWallet?.name]);

  const filteredTxs = useMemo(() => {
    if (activeTab === 'all') return mergeTxs;
    if (activeTab === '__me__') return mergeTxs.filter((tx) => tx.memberAlias === meAlias);
    return mergeTxs.filter((tx) => tx.memberAlias === activeTab);
  }, [mergeTxs, activeTab, meAlias]);

  const tabs = useMemo(() => {
    const t: { id: string; label: string }[] = [
      { id: 'all', label: i18n.t('familyMerge.all') },
      { id: '__me__', label: i18n.t('familyMerge.me') },
    ];
    memberAliases.forEach((a) => {
      if (a !== meAlias) {
        t.push({ id: a, label: a });
      }
    });
    return t;
  }, [memberAliases, meAlias]);

  const totalSpent = useMemo(() => {
    return mergeTxs.reduce((s, tx) => (tx.isSend ? s + tx.amount : s), 0);
  }, [mergeTxs]);

  const currency = activeWallet?.currency ?? i18n.t('wallet.currency');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: { marginBottom: 20 },
        sectionTitle: {
          fontSize: 14,
          fontWeight: '600' as const,
          color: tokens.textSecondary,
          marginBottom: 12,
        },
        tabRow: {
          flexDirection: 'row' as const,
          flexWrap: 'wrap' as const,
          gap: 8,
          marginBottom: 16,
        },
        tab: {
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: radius.full,
          borderWidth: 2,
          borderColor: tokens.border,
        },
        tabActive: { borderColor: tokens.primary, backgroundColor: tokens.primary10 },
        tabText: { fontSize: 14, fontWeight: '500' as const, color: tokens.textPrimary },
        tabTextActive: { color: tokens.primary },
        summaryCard: {
          backgroundColor: tokens.surface,
          borderRadius: radius.lg,
          padding: 16,
          marginBottom: 16,
        },
        summaryRow: {
          flexDirection: 'row' as const,
          justifyContent: 'space-between' as const,
          alignItems: 'center' as const,
          marginBottom: 8,
        },
        summaryLabel: { fontSize: 14, color: tokens.textSecondary },
        summaryValue: {
          fontSize: 18,
          fontWeight: '700' as const,
          color: tokens.textPrimary,
          fontVariant: ['tabular-nums'],
        },
        txCard: {
          flexDirection: 'row' as const,
          justifyContent: 'space-between' as const,
          alignItems: 'center' as const,
          backgroundColor: tokens.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 8,
          shadowColor: tokens.black,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
        },
        txLeft: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12 },
        txIcon: {
          width: 40,
          height: 40,
          borderRadius: 20,
          justifyContent: 'center' as const,
          alignItems: 'center' as const,
        },
        txIconSend: { backgroundColor: tokens.dangerLight },
        txIconReceive: { backgroundColor: tokens.successLight },
        txIconTransfer: { backgroundColor: tokens.primary10 },
        txTitle: {
          fontSize: 14,
          fontWeight: '500' as const,
          color: tokens.textPrimary,
        },
        txMeta: { fontSize: 12, color: tokens.textMuted, marginTop: 2 },
        txAmount: {
          fontSize: 16,
          fontWeight: '700' as const,
          fontVariant: ['tabular-nums'],
        },
        txAmountSend: { color: tokens.danger },
        txAmountReceive: { color: tokens.success },
        txAmountTransfer: { color: tokens.primary },
        empty: {
          padding: 32,
          alignItems: 'center' as const,
        },
        emptyText: { fontSize: 14, color: tokens.textMuted },
      } as Record<string, object>),
    [tokens]
  );

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{i18n.t('familyMerge.summary')}</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{i18n.t('familyMerge.totalSpent')}</Text>
            <Text style={styles.summaryValue}>
              {mask(totalSpent)} {currency}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{i18n.t('familyMerge.transactions')}</Text>
            <Text style={styles.summaryValue}>{filteredTxs.length}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{i18n.t('familyMerge.viewBy')}</Text>
        <View style={styles.tabRow}>
          {tabs.map((tab) => (
            <PressableScale
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={activeTab === tab.id ? StyleSheet.flatten([styles.tab, styles.tabActive]) : styles.tab}
            >
              <Text
                style={[
                  styles.tabText,
                  ...(activeTab === tab.id ? [styles.tabTextActive] : []),
                ]}
              >
                {tab.label}
              </Text>
            </PressableScale>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{i18n.t('wallet.recentTransactions')}</Text>
        {filteredTxs.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{i18n.t('familyMerge.noTransactions')}</Text>
          </View>
        ) : (
          filteredTxs.slice(0, 15).map((tx, index) => {
            const iconStyle = tx.isSend
              ? styles.txIconSend
              : tx.isTransfer
                ? styles.txIconTransfer
                : styles.txIconReceive;
            const amountStyle = tx.isSend
              ? styles.txAmountSend
              : tx.isTransfer
                ? styles.txAmountTransfer
                : styles.txAmountReceive;
            const sign = tx.isSend ? '-' : tx.isTransfer ? '' : '+';
            const Icon = tx.isSend ? Send : tx.isTransfer ? ArrowLeftRight : Download;
            const title = tx.category || (tx.isSend ? i18n.t('wallet.sent') : i18n.t('wallet.received'));
            return (
              <Animated.View
                key={tx.id}
                entering={FadeInDown.delay(index * 30).duration(200)}
                style={styles.txCard}
              >
                <View style={styles.txLeft}>
                  <View style={[styles.txIcon, iconStyle]}>
                    <Icon
                      size={20}
                      color={
                        tx.isSend
                          ? tokens.danger
                          : tx.isTransfer
                            ? tokens.primary
                            : tokens.success
                      }
                    />
                  </View>
                  <View>
                    <Text style={styles.txTitle}>{title}</Text>
                    <Text style={styles.txMeta}>
                      {formatTime(tx.timestamp, language)} • {tx.memberAlias}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.txAmount, amountStyle]}>
                  {sign}{sign ? ' ' : ''}{mask(tx.amount)} {currency}
                </Text>
              </Animated.View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
