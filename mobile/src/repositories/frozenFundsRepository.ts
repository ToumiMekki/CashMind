import { getDatabase } from '../database';
import type { FrozenFund } from '../database/types';

function rowToFrozenFund(row: Record<string, unknown>): FrozenFund {
  return {
    id: row.id as string,
    walletId: row.wallet_id as string,
    title: row.title as string,
    amount: Number(row.amount) || 0,
    category: row.category as string,
    isFrozen: (row.isFrozen as number) === 1,
    createdAt: Number(row.createdAt) || 0,
  };
}

export async function getAllFrozenFunds(): Promise<FrozenFund[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'SELECT id, wallet_id, title, amount, category, isFrozen, createdAt FROM frozen_funds WHERE isFrozen = 1 ORDER BY createdAt DESC'
  );
  const rows: FrozenFund[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    rows.push(rowToFrozenFund(result.rows.item(i) as Record<string, unknown>));
  }
  return rows;
}

export async function getFrozenFundsByWalletId(walletId: string): Promise<FrozenFund[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'SELECT id, wallet_id, title, amount, category, isFrozen, createdAt FROM frozen_funds WHERE wallet_id = ? AND isFrozen = 1 ORDER BY createdAt DESC',
    [walletId]
  );
  const rows: FrozenFund[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    rows.push(rowToFrozenFund(result.rows.item(i) as Record<string, unknown>));
  }
  return rows;
}

export async function insertFrozenFund(f: Omit<FrozenFund, 'isFrozen'>): Promise<void> {
  const db = await getDatabase();
  await db.executeSql(
    'INSERT INTO frozen_funds (id, wallet_id, title, amount, category, isFrozen, createdAt) VALUES (?, ?, ?, ?, ?, 1, ?)',
    [f.id, f.walletId, f.title, f.amount, f.category, f.createdAt]
  );
}

export async function deleteFrozenFund(id: string): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM frozen_funds WHERE id = ?', [id]);
}

export async function deleteAllFrozenFunds(): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM frozen_funds');
}
