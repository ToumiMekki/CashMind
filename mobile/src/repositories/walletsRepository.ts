import { getDatabase } from '../database';
import type { Wallet, WalletType } from '../database/types';
import type { ThemeColorId } from '../theme/colorPalettes';
import { DEFAULT_MIGRATION_WALLET_ID } from '../database/schema';
import { generateWalletId } from '../utils/transactionId';
import { deleteTransactionsByWalletId } from './transactionRepository';
import { seedDefaultCategoriesForWallet, deleteCategoriesByWalletId } from './categoriesRepository';

function rowToWallet(row: Record<string, unknown>): Wallet {
  const themeId = row.theme_color_id as string | undefined;
  return {
    id: row.id as string,
    name: row.name as string,
    currency: row.currency as string,
    balance: Number(row.balance) || 0,
    type: (row.type as WalletType) || 'personal',
    exchangeRateToDZD: row.exchange_rate_to_dzd != null ? Number(row.exchange_rate_to_dzd) : null,
    createdAt: Number(row.created_at) || 0,
    themeColorId: themeId || null,
  };
}

export async function getAllWallets(): Promise<Wallet[]> {
  const db = await getDatabase();
  const [r] = await db.executeSql(
    `SELECT id, name, currency, balance, type, exchange_rate_to_dzd, created_at, theme_color_id
     FROM wallets ORDER BY created_at ASC`
  );
  const rows: Wallet[] = [];
  for (let i = 0; i < r.rows.length; i++) {
    rows.push(rowToWallet(r.rows.item(i) as Record<string, unknown>));
  }
  return rows;
}

export async function getWalletById(id: string): Promise<Wallet | null> {
  const db = await getDatabase();
  const [r] = await db.executeSql(
    `SELECT id, name, currency, balance, type, exchange_rate_to_dzd, created_at, theme_color_id
     FROM wallets WHERE id = ?`,
    [id]
  );
  if (r.rows.length === 0) return null;
  return rowToWallet(r.rows.item(0) as Record<string, unknown>);
}

export function getDefaultMigrationWalletId(): string {
  return DEFAULT_MIGRATION_WALLET_ID;
}

export async function createWallet(params: {
  name: string;
  currency: string;
  type?: WalletType;
  themeColorId?: ThemeColorId | null;
  exchangeRateToDZD?: number | null;
}): Promise<Wallet> {
  const db = await getDatabase();
  const id = generateWalletId();
  const type = params.type ?? 'personal';
  const now = Date.now();
  const rate = params.exchangeRateToDZD ?? null;
  const themeId = params.themeColorId ?? null;
  await db.executeSql(
    `INSERT INTO wallets (id, name, currency, balance, type, exchange_rate_to_dzd, created_at, theme_color_id)
     VALUES (?, ?, ?, 0, ?, ?, ?, ?)`,
    [id, params.name, params.currency, type, rate, now, themeId]
  );
  await seedDefaultCategoriesForWallet(id);
  return {
    id,
    name: params.name,
    currency: params.currency,
    balance: 0,
    type,
    exchangeRateToDZD: rate,
    createdAt: now,
    themeColorId: themeId,
  };
}

export async function updateWallet(
  id: string,
  updates: Partial<Pick<Wallet, 'name' | 'exchangeRateToDZD' | 'themeColorId'>>
): Promise<void> {
  const db = await getDatabase();
  if (updates.name != null) {
    await db.executeSql('UPDATE wallets SET name = ? WHERE id = ?', [updates.name, id]);
  }
  if (updates.exchangeRateToDZD !== undefined) {
    await db.executeSql('UPDATE wallets SET exchange_rate_to_dzd = ? WHERE id = ?', [
      updates.exchangeRateToDZD,
      id,
    ]);
  }
  if (updates.themeColorId !== undefined) {
    await db.executeSql('UPDATE wallets SET theme_color_id = ? WHERE id = ?', [
      updates.themeColorId ?? null,
      id,
    ]);
  }
}

export async function setWalletBalance(id: string, balance: number): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('UPDATE wallets SET balance = ? WHERE id = ?', [
    Math.max(0, balance),
    id,
  ]);
}

export async function deleteWallet(id: string): Promise<{ success: true } | { success: false; error: string }> {
  const db = await getDatabase();
  try {
    await db.executeSql('BEGIN TRANSACTION');
    await deleteTransactionsByWalletId(id);
    await deleteCategoriesByWalletId(id);
    await db.executeSql('DELETE FROM frozen_funds WHERE wallet_id = ?', [id]);
    await db.executeSql('DELETE FROM wallet_exercice_snapshots WHERE wallet_id = ?', [id]);
    await db.executeSql('DELETE FROM wallets WHERE id = ?', [id]);
    await db.executeSql('COMMIT');
  } catch (e) {
    await db.executeSql('ROLLBACK');
    return { success: false, error: (e as Error).message };
  }
  return { success: true };
}
