import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ThemeTokens } from '../theme/tokens';

interface DailyChartProps {
  data: { date: string; amount: number }[];
  avgDaily: number;
  tokens: ThemeTokens;
}

const CHART_HEIGHT = 152;
const BAR_WIDTH = 24;

export function DailyChart({ data, avgDaily, tokens }: DailyChartProps) {
  const maxAmount = Math.max(
    ...data.map((d) => d.amount),
    avgDaily * 1.2,
    1
  );

  return (
    <View style={styles.container}>
      {data.map((item, i) => {
        const heightRatio = maxAmount > 0 ? item.amount / maxAmount : 0;
        const barHeight = Math.max(heightRatio * CHART_HEIGHT, 6);
        const isAboveAvg = item.amount > avgDaily;
        return (
          <View key={`bar-${i}`} style={styles.barWrapper}>
            <View
              style={[
                styles.bar,
                {
                  height: barHeight,
                  backgroundColor: isAboveAvg ? tokens.danger : tokens.primary,
                  width: BAR_WIDTH,
                },
              ]}
            />
            <Text style={[styles.label, { color: tokens.textMuted }]} numberOfLines={1}>
              {item.date}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: CHART_HEIGHT + 28,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 2,
  },
  bar: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginBottom: 10,
  },
  label: { fontSize: 11, fontWeight: '600' },
});
