/**
 * Analytics repository — per-wallet, per-date aggregation with category breakdown.
 * Hard logic: date ranges, category joins, daily/weekly buckets, variance, trends.
 */

import { getDatabase } from '../database';
import { getCategoriesByWalletId } from './categoriesRepository';
import type { Transaction, Category } from '../database/types';

/** Spend types (outflows) — exclude transfers for "real" spending. */
const SPEND_TYPES = ['send', 'business_payment_send'] as const;

/** Receive types (inflows) */
const RECEIVE_TYPES = ['receive', 'business_payment_receive'] as const;

/** Transfer types — excluded from spend/receive for clean analytics */
const TRANSFER_TYPES = ['transfer_in', 'transfer_out'] as const;

export type DateRangePreset = 'today' | '7d' | '30d' | '90d' | 'this_month' | 'last_month' | 'custom';

export interface DateRange {
  from: number;
  to: number;
  label: string;
}

export function getDateRangeForPreset(preset: DateRangePreset): DateRange {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000 - 1;

  switch (preset) {
    case 'today':
      return {
        from: todayStart,
        to: Date.now(),
        label: 'today',
      };
    case '7d': {
      const from7 = new Date(todayStart);
      from7.setDate(from7.getDate() - 6);
      return {
        from: from7.getTime(),
        to: todayEnd,
        label: '7d',
      };
    }
    case '30d': {
      const from30 = new Date(todayStart);
      from30.setDate(from30.getDate() - 29);
      return {
        from: from30.getTime(),
        to: todayEnd,
        label: '30d',
      };
    }
    case '90d': {
      const from90 = new Date(todayStart);
      from90.setDate(from90.getDate() - 89);
      return {
        from: from90.getTime(),
        to: todayEnd,
        label: '90d',
      };
    }
    case 'this_month': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return {
        from: monthStart,
        to: Date.now(),
        label: 'this_month',
      };
    }
    case 'last_month': {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      const from = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1).getTime();
      const to = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
      return {
        from,
        to,
        label: 'last_month',
      };
    }
    case 'custom':
      return getDateRangeForPreset('30d');
    default:
      return getDateRangeForPreset('30d');
  }
}

/** Build date range for custom from/to timestamps. */
export function getDateRangeCustom(fromTs: number, toTs: number): DateRange {
  return {
    from: fromTs,
    to: toTs,
    label: 'custom',
  };
}

export async function getTransactionsByWalletAndDateRange(
  walletId: string,
  fromTs: number,
  toTs: number
): Promise<Transaction[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `SELECT id, wallet_id, amount, type, timestamp, balance_before, balance_after, receiver, sender, category, category_id, method, sender_id, receiver_id, exercice, transfer_id, related_wallet_id, exchange_rate_used
     FROM transactions
     WHERE wallet_id = ? AND timestamp >= ? AND timestamp <= ?
     ORDER BY timestamp ASC`,
    [walletId, fromTs, toTs]
  );
  const rows: Transaction[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    const r = result.rows.item(i) as Record<string, unknown>;
    rows.push({
      id: r.id as string,
      walletId: r.wallet_id as string,
      amount: r.amount as number,
      type: r.type as Transaction['type'],
      timestamp: r.timestamp as number,
      balanceBefore: Number(r.balance_before) ?? 0,
      balanceAfter: Number(r.balance_after) ?? 0,
      receiver: (r.receiver as string) ?? undefined,
      sender: (r.sender as string) ?? undefined,
      category: (r.category as string) ?? undefined,
      categoryId: (r.category_id as string) ?? undefined,
      method: ((r.method as string) || 'MANUAL') as Transaction['method'],
      senderId: (r.sender_id as string) ?? undefined,
      receiverId: (r.receiver_id as string) ?? undefined,
      exercice: Number(r.exercice) ?? new Date().getFullYear(),
      transferId: (r.transfer_id as string) ?? undefined,
      relatedWalletId: (r.related_wallet_id as string) ?? undefined,
      exchangeRateUsed: r.exchange_rate_used != null ? Number(r.exchange_rate_used) : undefined,
    });
  }
  return rows;
}

export interface CategoryBreakdown {
  categoryId: string | null;
  categoryName: string;
  icon: string;
  color: string;
  amount: number;
  count: number;
  percent: number;
}

export async function getSpendByCategory(
  walletId: string,
  fromTs: number,
  toTs: number
): Promise<{ breakdown: CategoryBreakdown[]; total: number }> {
  const txs = await getTransactionsByWalletAndDateRange(walletId, fromTs, toTs);
  const spendTxs = txs.filter(
    (tx) => (SPEND_TYPES as readonly string[]).includes(tx.type) && !(TRANSFER_TYPES as readonly string[]).includes(tx.type)
  );
  const total = spendTxs.reduce((s, tx) => s + tx.amount, 0);

  const byCategory = new Map<string, { amount: number; count: number }>();
  for (const tx of spendTxs) {
    const key = tx.categoryId ?? '__uncategorized__';
    const cur = byCategory.get(key) ?? { amount: 0, count: 0 };
    cur.amount += tx.amount;
    cur.count += 1;
    byCategory.set(key, cur);
  }

  const categories = await getCategoriesByWalletId(walletId);
  const catMap = new Map(categories.map((c) => [c.id, c]));

  const breakdown: CategoryBreakdown[] = [];
  for (const [key, { amount, count }] of byCategory) {
    const percent = total > 0 ? (amount / total) * 100 : 0;
    if (key === '__uncategorized__') {
      breakdown.push({
        categoryId: null,
        categoryName: 'Uncategorized',
        icon: '📦',
        color: '#94A3B8',
        amount,
        count,
        percent,
      });
    } else {
      const cat = catMap.get(key);
      breakdown.push({
        categoryId: key,
        categoryName: cat?.name ?? 'Unknown',
        icon: cat?.icon ?? '📦',
        color: cat?.color ?? '#94A3B8',
        amount,
        count,
        percent,
      });
    }
  }
  breakdown.sort((a, b) => b.amount - a.amount);
  return { breakdown, total };
}

export async function getReceiveByCategory(
  walletId: string,
  fromTs: number,
  toTs: number
): Promise<{ breakdown: CategoryBreakdown[]; total: number }> {
  const txs = await getTransactionsByWalletAndDateRange(walletId, fromTs, toTs);
  const recvTxs = txs.filter((tx) => (RECEIVE_TYPES as readonly string[]).includes(tx.type));
  const total = recvTxs.reduce((s, tx) => s + tx.amount, 0);

  const byCategory = new Map<string, { amount: number; count: number }>();
  for (const tx of recvTxs) {
    const key = tx.categoryId ?? '__uncategorized__';
    const cur = byCategory.get(key) ?? { amount: 0, count: 0 };
    cur.amount += tx.amount;
    cur.count += 1;
    byCategory.set(key, cur);
  }

  const categories = await getCategoriesByWalletId(walletId);
  const catMap = new Map(categories.map((c) => [c.id, c]));

  const breakdown: CategoryBreakdown[] = [];
  for (const [key, { amount, count }] of byCategory) {
    const percent = total > 0 ? (amount / total) * 100 : 0;
    if (key === '__uncategorized__') {
      breakdown.push({
        categoryId: null,
        categoryName: 'Uncategorized',
        icon: '📦',
        color: '#94A3B8',
        amount,
        count,
        percent,
      });
    } else {
      const cat = catMap.get(key);
      breakdown.push({
        categoryId: key,
        categoryName: cat?.name ?? 'Unknown',
        icon: cat?.icon ?? '📦',
        color: cat?.color ?? '#94A3B8',
        amount,
        count,
        percent,
      });
    }
  }
  breakdown.sort((a, b) => b.amount - a.amount);
  return { breakdown, total };
}

export interface DailyBucket {
  date: string;
  dateKey: string;
  timestamp: number;
  spent: number;
  received: number;
  net: number;
}

export async function getDailyBuckets(
  walletId: string,
  fromTs: number,
  toTs: number,
  tzOffsetMs: number = 0
): Promise<DailyBucket[]> {
  const txs = await getTransactionsByWalletAndDateRange(walletId, fromTs, toTs);
  const buckets = new Map<string, { spent: number; received: number }>();

  const dayMs = 24 * 60 * 60 * 1000;
  for (const tx of txs) {
    const d = new Date(tx.timestamp + tzOffsetMs);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const ts = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const cur = buckets.get(dateKey) ?? { spent: 0, received: 0 };
    if ((SPEND_TYPES as readonly string[]).includes(tx.type) && !(TRANSFER_TYPES as readonly string[]).includes(tx.type)) {
      cur.spent += tx.amount;
    } else if ((RECEIVE_TYPES as readonly string[]).includes(tx.type)) {
      cur.received += tx.amount;
    }
    buckets.set(dateKey, cur);
  }

  const result: DailyBucket[] = [];
  const walk = new Date(fromTs);
  const end = new Date(toTs);
  while (walk.getTime() <= end.getTime()) {
    const dateKey = `${walk.getFullYear()}-${String(walk.getMonth() + 1).padStart(2, '0')}-${String(walk.getDate()).padStart(2, '0')}`;
    const b = buckets.get(dateKey) ?? { spent: 0, received: 0 };
    result.push({
      date: dateKey,
      dateKey,
      timestamp: walk.getTime(),
      spent: b.spent,
      received: b.received,
      net: b.received - b.spent,
    });
    walk.setDate(walk.getDate() + 1);
  }
  return result;
}

export interface AnalyticsSummary {
  totalSpent: number;
  totalReceived: number;
  netFlow: number;
  spendCount: number;
  receiveCount: number;
  avgDailySpend: number;
  avgDailyReceive: number;
  largestSpend: number;
  largestReceive: number;
  /** Week-over-week spend change (if 7d range), percent */
  spendTrendPercent: number | null;
  /** Previous period total spent for comparison */
  previousPeriodSpent: number | null;
}

export async function getAnalyticsSummary(
  walletId: string,
  range: DateRange
): Promise<AnalyticsSummary> {
  const txs = await getTransactionsByWalletAndDateRange(walletId, range.from, range.to);
  const spendTxs = txs.filter(
    (tx) => (SPEND_TYPES as readonly string[]).includes(tx.type) && !(TRANSFER_TYPES as readonly string[]).includes(tx.type)
  );
  const recvTxs = txs.filter((tx) => (RECEIVE_TYPES as readonly string[]).includes(tx.type));

  const totalSpent = spendTxs.reduce((s, tx) => s + tx.amount, 0);
  const totalReceived = recvTxs.reduce((s, tx) => s + tx.amount, 0);
  const days = Math.max(1, Math.ceil((range.to - range.from) / (24 * 60 * 60 * 1000)));

  let previousPeriodSpent: number | null = null;
  let spendTrendPercent: number | null = null;

  if (range.label === '7d' || range.label === '30d') {
    const periodMs = range.to - range.from + 1;
    const prevFrom = range.from - periodMs;
    const prevTo = range.from - 1;
    const prevTxs = await getTransactionsByWalletAndDateRange(walletId, prevFrom, prevTo);
    previousPeriodSpent = prevTxs
      .filter(
        (tx) =>
          (SPEND_TYPES as readonly string[]).includes(tx.type) && !(TRANSFER_TYPES as readonly string[]).includes(tx.type)
      )
      .reduce((s, tx) => s + tx.amount, 0);
    if (previousPeriodSpent > 0) {
      spendTrendPercent = ((totalSpent - previousPeriodSpent) / previousPeriodSpent) * 100;
    } else if (totalSpent > 0) {
      spendTrendPercent = 100;
    }
  }

  return {
    totalSpent,
    totalReceived,
    netFlow: totalReceived - totalSpent,
    spendCount: spendTxs.length,
    receiveCount: recvTxs.length,
    avgDailySpend: totalSpent / days,
    avgDailyReceive: totalReceived / days,
    largestSpend: spendTxs.length > 0 ? Math.max(...spendTxs.map((t) => t.amount)) : 0,
    largestReceive: recvTxs.length > 0 ? Math.max(...recvTxs.map((t) => t.amount)) : 0,
    spendTrendPercent,
    previousPeriodSpent,
  };
}
