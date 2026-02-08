import React, { useCallback, useRef, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  Pressable,
  type ListRenderItem,
} from 'react-native';
import { Eye, EyeOff, Plus } from 'lucide-react-native';
import { useAppStore } from '../stores/useAppStore';
import { useBalancePrivacy } from '../hooks/useBalancePrivacy';
import { useTheme, useIsDark } from '../hooks/useTheme';
import { i18n } from '../i18n';
import { radius } from '../theme';
import { getPaletteById } from '../theme/colorPalettes';
import type { ThemeColorId } from '../theme/colorPalettes';
import type { Wallet } from '../database/types';
import type { ThemeTokens } from '../theme/tokens';

const CARD_MARGIN = 8;
const CARD_PADDING_H = 16;
const DOT_SIZE = 8;
const DOT_MARGIN = 4;

function makeStyles(t: ThemeTokens) {
  return {
    container: { marginBottom: 16 },
    list: { flexGrow: 0 },
    cardWrap: {
      width: '100%' as const,
      paddingHorizontal: CARD_PADDING_H,
      paddingVertical: 4,
    },
    card: {
      borderRadius: 22,
      padding: 18,
      minHeight: 180,
      justifyContent: 'space-between' as const,
    },
    cardAdd: {
      backgroundColor: t.card,
      borderWidth: 2,
      borderColor: t.border,
      borderStyle: 'dashed' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    cardHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      alignSelf: 'stretch' as const,
    },
    cardName: { fontSize: 14, fontWeight: '600' as const, color: t.primaryTint },
    balanceRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 6,
      marginVertical: 4,
      flexWrap: 'wrap' as const,
    },
    balanceAmount: {
      fontWeight: '800' as const,
      color: t.white,
      fontVariant: ['tabular-nums'] as ('tabular-nums')[],
    },
    balanceCurrency: { color: t.white },
    todayRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      alignSelf: 'stretch' as const,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    todayLabel: { fontSize: 13 },
    todayValue: {
      fontSize: 14,
      fontWeight: '700' as const,
      fontVariant: ['tabular-nums'] as ('tabular-nums')[],
    },
    addLabel: { fontSize: 15, fontWeight: '600' as const, color: t.textSecondary, marginTop: 6 },
    dots: {
      flexDirection: 'row' as const,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginTop: 8,
      gap: DOT_MARGIN,
    },
    dot: {
      width: DOT_SIZE,
      height: DOT_SIZE,
      borderRadius: DOT_SIZE / 2,
      backgroundColor: t.border,
    },
    dotActive: { backgroundColor: t.primary },
  };
}

type Item = { type: 'wallet'; wallet: Wallet } | { type: 'add' };

/** Font size for balance based on displayed length. Keeps big numbers (10+ digits) readable. */
function balanceFontSize(displayStr: string, isMasked: boolean): number {
  if (isMasked) return 40;
  const len = displayStr.length;
  if (len >= 16) return 20;
  if (len >= 14) return 24;
  if (len >= 11) return 28;
  if (len >= 9) return 34;
  return 40;
}

/** Today's spending for a wallet. Excludes transfers (spec: transfers excluded from spending). */
function todaySpendingForWallet(
  walletId: string,
  transactionsByWallet: Record<string, { type: string; amount: number; timestamp: number }[]>,
  todayStart: number
): number {
  const txs = transactionsByWallet[walletId] ?? [];
  return txs
    .filter((tx) => (tx.type === 'send' || tx.type === 'business_payment_send') && tx.timestamp >= todayStart)
    .reduce((s, tx) => s + tx.amount, 0);
}

export function WalletCarousel() {
  const tokens = useTheme();
  const isDark = useIsDark();
  const { width } = useWindowDimensions();
  const cardWidth = width - 2 * (CARD_PADDING_H + CARD_MARGIN);
  const styles = useMemo(
    () => StyleSheet.create(makeStyles(tokens) as Record<string, object>),
    [tokens]
  );

  const wallets = useAppStore((s) => s.wallets);
  const activeWalletId = useAppStore((s) => s.activeWalletId);
  const balance = useAppStore((s) => s.balance);
  const transactionsByWallet = useAppStore((s) => s.transactionsByWallet);
  const setActiveWallet = useAppStore((s) => s.setActiveWallet);
  const setOverlay = useAppStore((s) => s.setOverlay);

  const { visible: balanceVisible, toggle: togglePrivacy, mask } = useBalancePrivacy();
  const flatRef = useRef<FlatList<Item>>(null);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const items: Item[] = useMemo(() => {
    const list: Item[] = wallets.map((w) => ({ type: 'wallet', wallet: w }));
    list.push({ type: 'add' });
    return list;
  }, [wallets]);

  const [scrollIndex, setScrollIndex] = useState(0);
  const activeIndex = useMemo(() => {
    const i = wallets.findIndex((w) => w.id === activeWalletId);
    return i >= 0 ? i : 0;
  }, [wallets, activeWalletId]);
  const dotIndex = scrollIndex >= 0 && scrollIndex < items.length ? scrollIndex : activeIndex;

  const onMomentumScrollEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const x = e.nativeEvent.contentOffset.x;
      const idx = Math.round(x / (cardWidth + 2 * CARD_MARGIN));
      if (idx >= 0 && idx < items.length) {
        setScrollIndex(idx);
        const it = items[idx];
        if (it.type === 'wallet') setActiveWallet(it.wallet.id);
      }
    },
    [cardWidth, items, setActiveWallet]
  );

  const scrollToIndex = useCallback(
    (index: number) => {
      flatRef.current?.scrollToOffset({
        offset: index * (cardWidth + 2 * CARD_MARGIN),
        animated: true,
      });
      setScrollIndex(index);
      const it = items[index];
      if (it?.type === 'wallet') setActiveWallet(it.wallet.id);
      else if (it?.type === 'add') setOverlay('addWallet');
    },
    [cardWidth, items, setActiveWallet, setOverlay]
  );

  const renderItem: ListRenderItem<Item> = useCallback(
    ({ item, index }) => {
      if (item.type === 'add') {
        return (
          <Pressable
            style={[styles.cardWrap, { width: cardWidth + 2 * CARD_MARGIN }]}
            onPress={() => setOverlay('addWallet')}
          >
            <View style={[styles.card, styles.cardAdd]}>
              <Plus size={30} color={tokens.textMuted} />
              <Text style={styles.addLabel}>{i18n.t('wallet.addWallet')}</Text>
            </View>
          </Pressable>
        );
      }
      const w = item.wallet;
      const isActive = w.id === activeWalletId;
      const dispBalance = isActive ? balance : w.balance;
      const balanceStr = mask(dispBalance);
      const bFontSize = balanceFontSize(balanceStr, !balanceVisible);
      const today = todaySpendingForWallet(w.id, transactionsByWallet, todayStart);
      const currency = w.currency;
      const palette = getPaletteById((w.themeColorId || 'blue') as ThemeColorId);
      const walletColors = palette[isDark ? 'dark' : 'light'];
      const cardBg = walletColors.primary;
      const cardTint = walletColors.primaryTint;
      const cardWhite10 = 'rgba(255,255,255,0.12)';

      return (
        <Pressable
          style={[styles.cardWrap, { width: cardWidth + 2 * CARD_MARGIN }]}
          onPress={() => scrollToIndex(index)}
        >
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardName, { color: cardTint }]} numberOfLines={1}>
                {w.name}
              </Text>
              {isActive && (
                <Pressable
                  onPress={(ev) => { ev.stopPropagation(); togglePrivacy(); }}
                  hitSlop={12}
                >
                  {balanceVisible ? (
                    <EyeOff size={22} color={cardTint} />
                  ) : (
                    <Eye size={22} color={cardTint} />
                  )}
                </Pressable>
              )}
            </View>
            <View style={styles.balanceRow}>
              <Text style={[styles.balanceAmount, { fontSize: bFontSize }]} numberOfLines={1}>
                {balanceStr}
              </Text>
              <Text
                style={[
                  styles.balanceCurrency,
                  {
                    fontSize:
                      bFontSize >= 36 ? 22 : bFontSize >= 30 ? 18 : bFontSize >= 26 ? 16 : 14,
                  },
                ]}
              >
                {currency}
              </Text>
            </View>
            <View style={[styles.todayRow, { backgroundColor: cardWhite10 }]}>
              <Text style={[styles.todayLabel, { color: cardTint }]}>{i18n.t('wallet.todaySpending')}</Text>
              <Text style={[styles.todayValue, { color: 'rgba(255,255,255,0.95)' }]}>
                {mask(today)} {currency}
              </Text>
            </View>
          </View>
        </Pressable>
      );
    },
    [
      styles,
      isDark,
      activeWalletId,
      balance,
      transactionsByWallet,
      todayStart,
      balanceVisible,
      mask,
      togglePrivacy,
      scrollToIndex,
      setOverlay,
      cardWidth,
    ]
  );

  return (
    <View style={styles.container}>
      <FlatList<Item>
        ref={flatRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={(it) => (it.type === 'wallet' ? it.wallet.id : 'add')}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + 2 * CARD_MARGIN}
        snapToAlignment="start"
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumScrollEnd}
        initialScrollIndex={activeIndex > 0 ? activeIndex : 0}
        getItemLayout={(_, index) => ({
          length: cardWidth + 2 * CARD_MARGIN,
          offset: (cardWidth + 2 * CARD_MARGIN) * index,
          index,
        })}
      />
      <View style={styles.dots}>
        {items.map((it, idx) => {
          const isWallet = it.type === 'wallet';
          const dotColor = idx === dotIndex && isWallet
            ? getPaletteById((it.wallet.themeColorId || 'blue') as ThemeColorId)[isDark ? 'dark' : 'light'].primary
            : tokens.border;
          return (
            <Pressable
              key={idx}
              onPress={() => scrollToIndex(idx)}
              style={[
                styles.dot,
                idx === dotIndex && { backgroundColor: dotColor },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}
