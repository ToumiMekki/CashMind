import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { CategoryBreakdown } from '../repositories/analyticsRepository';
import type { ThemeTokens } from '../theme/tokens';

interface CategoryBreakdownChartProps {
  data: CategoryBreakdown[];
  total: number;
  tokens: ThemeTokens;
  mask: (n: number) => string;
  currency: string;
  maxBars?: number;
}

const BAR_HEIGHT = 32;
const MAX_BARS_DEFAULT = 8;

export function CategoryBreakdownChart({
  data,
  total,
  tokens,
  mask,
  currency,
  maxBars = MAX_BARS_DEFAULT,
}: CategoryBreakdownChartProps) {
  const display = data.slice(0, maxBars);
  const maxAmount = Math.max(...display.map((d) => d.amount), 1);

  return (
    <View style={styles.container}>
      {display.map((item, i) => {
        const widthPercent = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
        return (
          <View key={item.categoryId ?? `uncat-${i}`} style={styles.row}>
            <View style={styles.labelRow}>
              <Text style={styles.icon}>{item.icon}</Text>
              <Text style={[styles.name, { color: tokens.textPrimary }]} numberOfLines={1}>
                {item.categoryName}
              </Text>
              <Text style={[styles.percent, { color: tokens.textMuted }]}>
                {item.percent.toFixed(1)}%
              </Text>
            </View>
            <View style={[styles.barBg, { backgroundColor: tokens.borderLight }]}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${widthPercent}%`,
                    backgroundColor: item.color,
                  },
                ]}
              />
            </View>
            <Text style={[styles.amount, { color: tokens.textPrimary }]}>
              {mask(item.amount)} {currency}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  row: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  percent: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'right',
  },
  barBg: {
    height: BAR_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 12,
    minWidth: 6,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
