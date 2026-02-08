import { getDatabase } from '../database';
import type { ExerciceRow, ExerciceStatus } from '../database/types';

export function currentYear(): number {
  return new Date().getFullYear();
}

export async function getExercices(): Promise<ExerciceRow[]> {
  const db = await getDatabase();
  const [r] = await db.executeSql(
    'SELECT year, opening_balance AS openingBalance, closing_balance AS closingBalance, freeze_balance AS freezeBalance, status, closed_at AS closedAt FROM exercices ORDER BY year DESC'
  );
  const rows: ExerciceRow[] = [];
  for (let i = 0; i < r.rows.length; i++) {
    const x = r.rows.item(i) as Record<string, unknown>;
    rows.push({
      year: Number(x.year),
      openingBalance: Number(x.openingBalance) || 0,
      closingBalance: Number(x.closingBalance) || 0,
      freezeBalance: Number(x.freezeBalance) || 0,
      status: (x.status as ExerciceStatus) || 'open',
      closedAt: x.closedAt != null ? Number(x.closedAt) : null,
    });
  }
  return rows;
}

export async function getExercice(year: number): Promise<ExerciceRow | null> {
  const db = await getDatabase();
  const [r] = await db.executeSql(
    'SELECT year, opening_balance AS openingBalance, closing_balance AS closingBalance, freeze_balance AS freezeBalance, status, closed_at AS closedAt FROM exercices WHERE year = ?',
    [year]
  );
  if (r.rows.length === 0) return null;
  const x = r.rows.item(0) as Record<string, unknown>;
  return {
    year: Number(x.year),
    openingBalance: Number(x.openingBalance) || 0,
    closingBalance: Number(x.closingBalance) || 0,
    freezeBalance: Number(x.freezeBalance) || 0,
    status: (x.status as ExerciceStatus) || 'open',
    closedAt: x.closedAt != null ? Number(x.closedAt) : null,
  };
}

export async function getCurrentExercice(): Promise<number> {
  const db = await getDatabase();
  const [r] = await db.executeSql(
    'SELECT current_exercice AS currentExercice FROM settings WHERE id = 1'
  );
  if (r.rows.length > 0) {
    const v = (r.rows.item(0) as { currentExercice: number | null })
      .currentExercice;
    if (v != null && !Number.isNaN(Number(v))) return Number(v);
  }
  return currentYear();
}

export async function setCurrentExercice(year: number): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('UPDATE settings SET current_exercice = ? WHERE id = 1', [
    year,
  ]);
}

export async function createExercice(
  year: number,
  openingBalance: number
): Promise<void> {
  const db = await getDatabase();
  await db.executeSql(
    `INSERT INTO exercices (year, opening_balance, closing_balance, freeze_balance, status)
     VALUES (?, ?, ?, 0, 'open')`,
    [year, Math.max(0, openingBalance), Math.max(0, openingBalance)]
  );
}

export async function updateExerciceFreeze(
  year: number,
  freezeBalance: number
): Promise<void> {
  const db = await getDatabase();
  await db.executeSql(
    'UPDATE exercices SET freeze_balance = ? WHERE year = ?',
    [Math.max(0, freezeBalance), year]
  );
}

export async function closeExercice(
  year: number,
  closingBalance: number,
  freezeBalance: number
): Promise<void> {
  const db = await getDatabase();
  const now = Date.now();
  await db.executeSql(
    `UPDATE exercices SET closing_balance = ?, freeze_balance = ?, status = 'closed', closed_at = ? WHERE year = ?`,
    [Math.max(0, closingBalance), Math.max(0, freezeBalance), now, year]
  );
}

export interface WalletSnapshot {
  walletId: string;
  year: number;
  closingBalance: number;
  freezeBalance: number;
}

export async function getWalletSnapshot(
  walletId: string,
  year: number
): Promise<{ closingBalance: number; freezeBalance: number } | null> {
  const db = await getDatabase();
  const [r] = await db.executeSql(
    'SELECT closing_balance AS closingBalance, freeze_balance AS freezeBalance FROM wallet_exercice_snapshots WHERE wallet_id = ? AND year = ?',
    [walletId, year]
  );
  if (r.rows.length === 0) return null;
  const x = r.rows.item(0) as { closingBalance: number; freezeBalance: number };
  return {
    closingBalance: Number(x.closingBalance) || 0,
    freezeBalance: Number(x.freezeBalance) || 0,
  };
}

export async function upsertWalletSnapshot(
  walletId: string,
  year: number,
  closingBalance: number,
  freezeBalance: number
): Promise<void> {
  const db = await getDatabase();
  await db.executeSql(
    `INSERT INTO wallet_exercice_snapshots (wallet_id, year, closing_balance, freeze_balance)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (wallet_id, year) DO UPDATE SET closing_balance = excluded.closing_balance, freeze_balance = excluded.freeze_balance`,
    [walletId, year, Math.max(0, closingBalance), Math.max(0, freezeBalance)]
  );
}
