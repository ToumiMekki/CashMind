import { getDatabase } from '../database';
import type {
  Transaction,
  TransactionMethod,
  TransactionType,
} from '../database/types';

const COLS =
  'id, wallet_id, amount, type, timestamp, balance_before, balance_after, receiver, sender, category, category_id, method, sender_id, receiver_id, exercice, transfer_id, related_wallet_id, exchange_rate_used, invoice_image';

function rowToTx(row: Record<string, unknown>): Transaction {
  const exercice = row.exercice != null ? Number(row.exercice) : new Date().getFullYear();
  return {
    id: row.id as string,
    walletId: row.wallet_id as string,
    amount: row.amount as number,
    type: (row.type as string) as TransactionType,
    timestamp: row.timestamp as number,
    balanceBefore: Number(row.balance_before) ?? 0,
    balanceAfter: Number(row.balance_after) ?? 0,
    receiver: (row.receiver as string) ?? undefined,
    sender: (row.sender as string) ?? undefined,
    category: (row.category as string) ?? undefined,
    categoryId: (row.category_id as string) ?? undefined,
    method: ((row.method as string) || 'MANUAL') as TransactionMethod,
    senderId: (row.sender_id as string) ?? undefined,
    receiverId: (row.receiver_id as string) ?? undefined,
    exercice: Number.isNaN(exercice) ? new Date().getFullYear() : exercice,
    transferId: (row.transfer_id as string) ?? undefined,
    relatedWalletId: (row.related_wallet_id as string) ?? undefined,
    exchangeRateUsed: row.exchange_rate_used != null ? Number(row.exchange_rate_used) : undefined,
    invoiceImage: (row.invoice_image as string) ?? undefined,
  };
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `SELECT ${COLS} FROM transactions ORDER BY timestamp DESC`
  );
  const rows: Transaction[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    rows.push(rowToTx(result.rows.item(i) as Record<string, unknown>));
  }
  return rows;
}

export async function getTransactionsByWalletId(walletId: string): Promise<Transaction[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `SELECT ${COLS} FROM transactions WHERE wallet_id = ? ORDER BY timestamp DESC`,
    [walletId]
  );
  const rows: Transaction[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    rows.push(rowToTx(result.rows.item(i) as Record<string, unknown>));
  }
  return rows;
}

export async function getTransactionsByWalletAndExercice(
  walletId: string,
  exercice: number
): Promise<Transaction[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `SELECT ${COLS} FROM transactions WHERE wallet_id = ? AND exercice = ? ORDER BY timestamp DESC`,
    [walletId, exercice]
  );
  const rows: Transaction[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    rows.push(rowToTx(result.rows.item(i) as Record<string, unknown>));
  }
  return rows;
}

export async function getTransactionsByExercice(exercice: number): Promise<Transaction[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `SELECT ${COLS} FROM transactions WHERE exercice = ? ORDER BY timestamp DESC`,
    [exercice]
  );
  const rows: Transaction[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    rows.push(rowToTx(result.rows.item(i) as Record<string, unknown>));
  }
  return rows;
}

export async function insertTransaction(tx: Transaction): Promise<void> {
  const db = await getDatabase();
  const exercice = tx.exercice ?? new Date().getFullYear();
  await db.executeSql(
    `INSERT INTO transactions (id, wallet_id, amount, type, timestamp, balance_before, balance_after, receiver, sender, category, category_id, method, sender_id, receiver_id, exercice, transfer_id, related_wallet_id, exchange_rate_used, invoice_image)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tx.id,
      tx.walletId,
      tx.amount,
      tx.type,
      tx.timestamp,
      tx.balanceBefore,
      tx.balanceAfter,
      tx.receiver ?? null,
      tx.sender ?? null,
      tx.category ?? null,
      tx.categoryId ?? null,
      tx.method ?? 'MANUAL',
      tx.senderId ?? null,
      tx.receiverId ?? null,
      exercice,
      tx.transferId ?? null,
      tx.relatedWalletId ?? null,
      tx.exchangeRateUsed ?? null,
      tx.invoiceImage ?? null,
    ]
  );
}

export async function getTransactionsByType(
  type: 'send' | 'receive'
): Promise<Transaction[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `SELECT ${COLS} FROM transactions WHERE type = ? ORDER BY timestamp DESC`,
    [type]
  );
  const rows: Transaction[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    rows.push(rowToTx(result.rows.item(i) as Record<string, unknown>));
  }
  return rows;
}

export async function getTransactionsInRange(
  fromTs: number,
  toTs: number,
  type: 'send' | 'receive'
): Promise<Transaction[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `SELECT ${COLS} FROM transactions WHERE type = ? AND timestamp >= ? AND timestamp < ? ORDER BY timestamp DESC`,
    [type, fromTs, toTs]
  );
  const rows: Transaction[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    rows.push(rowToTx(result.rows.item(i) as Record<string, unknown>));
  }
  return rows;
}

export async function deleteAllTransactions(): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM transactions');
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `SELECT ${COLS} FROM transactions WHERE id = ?`,
    [id]
  );
  if (result.rows.length === 0) return null;
  return rowToTx(result.rows.item(0) as Record<string, unknown>);
}

export async function deleteTransactionById(id: string): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM transactions WHERE id = ?', [id]);
}

export async function updateTransactionInvoiceImage(
  id: string,
  invoiceImage: string | null
): Promise<void> {
  const db = await getDatabase();
  await db.executeSql(
    'UPDATE transactions SET invoice_image = ? WHERE id = ?',
    [invoiceImage ?? null, id]
  );
}

export async function getAllTransactionsOrderedByTimeAsc(
  exercice?: number,
  walletId?: string
): Promise<Transaction[]> {
  const db = await getDatabase();
  const conditions: string[] = [];
  const params: (number | string)[] = [];
  if (exercice != null) {
    conditions.push('exercice = ?');
    params.push(exercice);
  }
  if (walletId != null) {
    conditions.push('wallet_id = ?');
    params.push(walletId);
  }
  const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
  const [result] = await db.executeSql(
    `SELECT ${COLS} FROM transactions${where} ORDER BY timestamp ASC`,
    params
  );
  const rows: Transaction[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    rows.push(rowToTx(result.rows.item(i) as Record<string, unknown>));
  }
  return rows;
}

export async function getTransactionCountByWalletId(walletId: string): Promise<number> {
  const db = await getDatabase();
  const [r] = await db.executeSql(
    'SELECT COUNT(*) AS c FROM transactions WHERE wallet_id = ?',
    [walletId]
  );
  return (r.rows.item(0) as { c: number }).c;
}

/** Check if a business_payment_receive with this transfer_id (payment_id) already exists. */
export async function hasBusinessPaymentReceiveByTransferId(transferId: string): Promise<boolean> {
  const db = await getDatabase();
  const [r] = await db.executeSql(
    "SELECT 1 FROM transactions WHERE transfer_id = ? AND type = 'business_payment_receive' LIMIT 1",
    [transferId]
  );
  return r.rows.length > 0;
}

/** Delete all transactions for a wallet and their qr_transfers. */
export async function deleteTransactionsByWalletId(walletId: string): Promise<void> {
  const db = await getDatabase();
  await db.executeSql(
    'DELETE FROM qr_transfers WHERE txId IN (SELECT id FROM transactions WHERE wallet_id = ?)',
    [walletId]
  );
  await db.executeSql('DELETE FROM transactions WHERE wallet_id = ?', [walletId]);
}
