import { getDatabase } from '../database';

export async function getBalance(): Promise<number> {
  const w = await getWallet();
  return w.balance;
}

export async function getFreezeBalance(): Promise<number> {
  const w = await getWallet();
  return w.freezeBalance;
}

export async function getWallet(): Promise<{
  balance: number;
  freezeBalance: number;
}> {
  const db = await getDatabase();
  const [r] = await db.executeSql(
    'SELECT balance, freeze_balance AS freezeBalance FROM wallet WHERE id = 1'
  );
  if (r.rows.length > 0) {
    const row = r.rows.item(0) as { balance: number; freezeBalance: number };
    return {
      balance: Number(row.balance) || 0,
      freezeBalance: Number(row.freezeBalance) || 0,
    };
  }
  await db.executeSql(
    'INSERT INTO wallet (id, balance, freeze_balance) VALUES (1, 0, 0)'
  );
  return { balance: 0, freezeBalance: 0 };
}

export async function setBalance(balance: number): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('UPDATE wallet SET balance = ? WHERE id = 1', [
    Math.max(0, balance),
  ]);
}

export async function setFreezeBalance(freezeBalance: number): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('UPDATE wallet SET freeze_balance = ? WHERE id = 1', [
    Math.max(0, freezeBalance),
  ]);
}
