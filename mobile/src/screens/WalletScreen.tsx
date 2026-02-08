import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { Send, ScanLine, Download, WifiOff, Database, ArrowLeftRight, Store, Share2 } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppStore } from '../stores/useAppStore';
import { i18n } from '../i18n';
import { radius } from '../theme';
import { formatTime } from '../utils/format';
import { useBalancePrivacy } from '../hooks/useBalancePrivacy';
import { useTheme } from '../hooks/useTheme';
import { AppContainer } from '../components/ui/AppContainer';
import { PressableScale } from '../components/ui/PressableScale';
import { WalletCarousel } from '../components/WalletCarousel';
import { FamilyWalletMergeView } from '../components/FamilyWalletMergeView';
import { LAYOUT } from '../theme/layout';
import type { ThemeTokens } from '../theme/tokens';

const QUICK_ACTIONS_GAP = 14;

function makeStyles(t: ThemeTokens, cardWidth?: number) {
  return {
    scroll: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingTop: 0, paddingBottom: 12 },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 24,
    },
    title: { fontSize: 24, fontWeight: '700' as const, color: t.textPrimary },
    badges: { flexDirection: 'row' as const, gap: 8 },
    badge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
      backgroundColor: t.primary10,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radius.full,
    },
    badgeText: { fontSize: 12, fontWeight: '500' as const, color: t.primary },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: t.textSecondary,
      marginBottom: 12,
    },
    quickActions: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: QUICK_ACTIONS_GAP,
      marginBottom: 32,
    },
    actionCard: {
      flexGrow: 1,
      flexShrink: 0,
      flexBasis: cardWidth ?? 0,
      minWidth: 0,
      backgroundColor: t.surface,
      borderRadius: radius.md,
      padding: 16,
      alignItems: 'center' as const,
      gap: 8,
      shadowColor: t.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    actionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    actionLabel: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: t.textPrimary,
    },
    emptyCard: {
      backgroundColor: t.surface,
      borderRadius: radius.md,
      padding: 32,
      alignItems: 'center' as const,
      shadowColor: t.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: t.borderLight,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: 12,
    },
    emptyEmoji: { fontSize: 28 },
    emptyText: { fontSize: 14, color: t.textMuted },
    txList: { gap: 8 },
    txCard: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      backgroundColor: t.surface,
      borderRadius: 12,
      padding: 16,
      shadowColor: t.black,
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
    txIconSend: { backgroundColor: t.dangerLight },
    txIconReceive: { backgroundColor: t.successLight },
    txTitle: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: t.textPrimary,
    },
    txTime: { fontSize: 12, color: t.textMuted, marginTop: 2 },
    txAmount: {
      fontSize: 16,
      fontWeight: '700' as const,
      fontVariant: ['tabular-nums'],
    },
    txAmountSend: { color: t.danger },
    txAmountReceive: { color: t.success },
    txAmountTransfer: { color: t.primary },
  };
}

export function WalletScreen() {
  const tokens = useTheme();
  const { width } = useWindowDimensions();
  const quickActionsCardWidth = useMemo(
    () =>
      Math.floor(
        (width - 2 * LAYOUT.PAGE_PADDING_HORIZONTAL - QUICK_ACTIONS_GAP) / 2
      ),
    [width]
  );
  const styles = useMemo(
    () =>
      StyleSheet.create(makeStyles(tokens, quickActionsCardWidth) as Record<string, object>),
    [tokens, quickActionsCardWidth]
  );

  const language = useAppStore((s) => s.language);
  const transactions = useAppStore((s) => s.transactions);
  const wallets = useAppStore((s) => s.wallets);
  const activeWalletId = useAppStore((s) => s.activeWalletId);
  const setOverlay = useAppStore((s) => s.setOverlay);
  const activeWallet = useMemo(
    () => wallets.find((w) => w.id === activeWalletId),
    [wallets, activeWalletId]
  );
  const currency = activeWallet?.currency ?? i18n.t('wallet.currency');

  const { mask } = useBalancePrivacy();
  const isBusiness = activeWallet?.type === 'business';
  const isFamily = activeWallet?.type === 'family';

  const recentTransactions = useMemo(
    () => transactions.slice(0, 5),
    [transactions]
  );

  return (
    <AppContainer>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{i18n.t('wallet.title')}</Text>
          <View style={styles.badges}>
            <View style={styles.badge}>
              <WifiOff size={16} color={tokens.primary} />
              <Text style={styles.badgeText}>{i18n.t('wallet.offline')}</Text>
            </View>
            <View style={styles.badge}>
              <Database size={16} color={tokens.primary} />
              <Text style={styles.badgeText}>{i18n.t('wallet.local')}</Text>
            </View>
          </View>
        </View>

        <WalletCarousel />

        <Text style={styles.sectionTitle}>{i18n.t('wallet.quickActions')}</Text>
        <View style={styles.quickActions}>
          <PressableScale
            style={styles.actionCard}
            onPress={() => setOverlay('pay')}
          >
            <View style={[styles.actionIcon, { backgroundColor: tokens.primary }]}>
              <Send size={24} color={tokens.white} />
            </View>
            <Text style={styles.actionLabel}>{i18n.t('wallet.pay')}</Text>
          </PressableScale>
          <PressableScale
            style={styles.actionCard}
            onPress={() => setOverlay('qrScan')}
          >
            <View style={[styles.actionIcon, { backgroundColor: tokens.primary }]}>
              <ScanLine size={22} color={tokens.white} />
            </View>
            <Text style={styles.actionLabel}>{i18n.t('wallet.scan')}</Text>
          </PressableScale>
          <PressableScale
            style={styles.actionCard}
            onPress={() => setOverlay('receive')}
          >
            <View style={[styles.actionIcon, { backgroundColor: tokens.primary }]}>
              <Download size={24} color={tokens.white} />
            </View>
            <Text style={styles.actionLabel}>{i18n.t('wallet.receive')}</Text>
          </PressableScale>
          <PressableScale
            style={styles.actionCard}
            onPress={() => setOverlay('transfer')}
          >
            <View style={[styles.actionIcon, { backgroundColor: tokens.primary }]}>
              <ArrowLeftRight size={24} color={tokens.white} />
            </View>
            <Text style={styles.actionLabel}>{i18n.t('wallet.transfer')}</Text>
          </PressableScale>
          {isBusiness && (
            <PressableScale
              style={styles.actionCard}
              onPress={() => setOverlay('businessMode')}
            >
              <View style={[styles.actionIcon, { backgroundColor: tokens.primary }]}>
                <Store size={24} color={tokens.white} />
              </View>
              <Text style={styles.actionLabel}>{i18n.t('businessMode.title')}</Text>
            </PressableScale>
          )}
          {isFamily && (
            <PressableScale
              style={styles.actionCard}
              onPress={() => setOverlay('familyShare')}
            >
              <View style={[styles.actionIcon, { backgroundColor: tokens.primary }]}>
                <Share2 size={24} color={tokens.white} />
              </View>
              <Text style={styles.actionLabel}>{i18n.t('familyShare.title')}</Text>
            </PressableScale>
          )}
        </View>

        {isFamily ? (
          <FamilyWalletMergeView />
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              {i18n.t('wallet.recentTransactions')}
            </Text>
            {recentTransactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyEmoji}>💸</Text>
            </View>
            <Text style={styles.emptyText}>{i18n.t('wallet.noTransactions')}</Text>
          </View>
        ) : (
          <View style={styles.txList}>
            {recentTransactions.map((tx, index) => {
              const isSend = tx.type === 'send' || tx.type === 'transfer_out' || tx.type === 'business_payment_send';
              const isReceive = tx.type === 'receive' || tx.type === 'transfer_in' || tx.type === 'business_payment_receive';
              const isTransfer = tx.type === 'transfer_in' || tx.type === 'transfer_out';
              const iconStyle = isSend
                ? styles.txIconSend
                : isReceive
                  ? styles.txIconReceive
                  : styles.txIconTransfer;
              const amountStyle = isSend
                ? styles.txAmountSend
                : isReceive
                  ? styles.txAmountReceive
                  : styles.txAmountTransfer;
              const sign = isSend ? '-' : isReceive ? '+' : '';
              const title = isSend
                ? tx.receiver ?? i18n.t('wallet.sent')
                : isReceive
                  ? tx.sender ?? i18n.t('wallet.received')
                  : i18n.t('wallet.transfer');
              return (
                <Animated.View
                  key={tx.id}
                  entering={FadeInDown.delay(index * 50).duration(200)}
                  style={styles.txCard}
                >
                  <View style={styles.txLeft}>
                    <View style={[styles.txIcon, iconStyle]}>
                      {isSend ? (
                        <Send size={20} color={tokens.danger} />
                      ) : isReceive ? (
                        <Download size={20} color={tokens.success} />
                      ) : (
                        <ArrowLeftRight size={20} color={tokens.primary} />
                      )}
                    </View>
                    <View>
                      <Text style={styles.txTitle}>{title}</Text>
                      <Text style={styles.txTime}>
                        {formatTime(tx.timestamp, language)}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.txAmount, amountStyle]}>
                    {sign}
                    {mask(tx.amount)}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
        )}
          </>
        )}
      </ScrollView>
    </AppContainer>
  );
}
