import { getDatabase } from '../database';
import type { Debt, DebtType, DebtStatus } from '../database/types';
import { generateTransactionId } from '../utils/transactionId';

function rowToDebt(row: Record<string, unknown>): Debt {
  const relatedIds = row.related_transaction_ids as string;
  return {
    id: row.id as string,
    walletId: row.wallet_id as string,
    type: (row.type as string) as DebtType,
    personName: row.person_name as string,
    originalAmount: Number(row.original_amount),
    remainingAmount: Number(row.remaining_amount),
    description: (row.description as string) ?? undefined,
    createdAt: Number(row.created_at),
    dueDate: row.due_date != null ? Number(row.due_date) : null,
    status: (row.status as string) as DebtStatus,
    relatedTransactionIds: relatedIds ? JSON.parse(relatedIds) : [],
  };
}

function generateDebtId(): string {
  return `debt_${Date.now()}_${generateTransactionId().slice(-8)}`;
}

export async function getAllDebtsByWalletId(walletId: string): Promise<Debt[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `SELECT * FROM debts WHERE wallet_id = ? ORDER BY created_at DESC`,
    [walletId]
  );
  const debts: Debt[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    debts.push(rowToDebt(result.rows.item(i) as Record<string, unknown>));
  }
  return debts;
}

export async function getDebtsByWalletIdAndType(
  walletId: string,
  type: DebtType
): Promise<Debt[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `SELECT * FROM debts WHERE wallet_id = ? AND type = ? ORDER BY created_at DESC`,
    [walletId, type]
  );
  const debts: Debt[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    debts.push(rowToDebt(result.rows.item(i) as Record<string, unknown>));
  }
  return debts;
}

export async function getActiveDebtsByWalletId(walletId: string): Promise<Debt[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `SELECT * FROM debts WHERE wallet_id = ? AND status IN ('active', 'partial') ORDER BY created_at DESC`,
    [walletId]
  );
  const debts: Debt[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    debts.push(rowToDebt(result.rows.item(i) as Record<string, unknown>));
  }
  return debts;
}

export async function getDebtById(id: string): Promise<Debt | null> {
  const db = await getDatabase();
  const [result] = await db.executeSql(`SELECT * FROM debts WHERE id = ?`, [id]);
  if (result.rows.length === 0) return null;
  return rowToDebt(result.rows.item(0) as Record<string, unknown>);
}

export async function insertDebt(debt: Omit<Debt, 'id'>): Promise<Debt> {
  const db = await getDatabase();
  const id = generateDebtId();
  const relatedIdsJson = JSON.stringify(debt.relatedTransactionIds || []);
  await db.executeSql(
    `INSERT INTO debts (
      id, wallet_id, type, person_name, original_amount, remaining_amount,
      description, created_at, due_date, status, related_transaction_ids
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      debt.walletId,
      debt.type,
      debt.personName,
      debt.originalAmount,
      debt.remainingAmount,
      debt.description ?? null,
      debt.createdAt,
      debt.dueDate ?? null,
      debt.status,
      relatedIdsJson,
    ]
  );
  return { ...debt, id };
}

export async function updateDebt(
  id: string,
  updates: Partial<
    Pick<
      Debt,
      | 'remainingAmount'
      | 'status'
      | 'description'
      | 'dueDate'
      | 'relatedTransactionIds'
    >
  >
): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.remainingAmount !== undefined) {
    fields.push('remaining_amount = ?');
    values.push(updates.remainingAmount);
  }
  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description ?? null);
  }
  if (updates.dueDate !== undefined) {
    fields.push('due_date = ?');
    values.push(updates.dueDate ?? null);
  }
  if (updates.relatedTransactionIds !== undefined) {
    fields.push('related_transaction_ids = ?');
    values.push(JSON.stringify(updates.relatedTransactionIds));
  }

  if (fields.length === 0) return;
  values.push(id);
  await db.executeSql(
    `UPDATE debts SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteDebt(id: string): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM debts WHERE id = ?', [id]);
}

export async function addPaymentToDebt(
  debtId: string,
  transactionId: string,
  paymentAmount: number
): Promise<void> {
  const debt = await getDebtById(debtId);
  if (!debt) return;

  const relatedIds = [...(debt.relatedTransactionIds || []), transactionId];
  const newRemaining = Math.max(0, debt.remainingAmount - paymentAmount);
  const newStatus: DebtStatus =
    newRemaining === 0 ? 'paid' : newRemaining < debt.originalAmount ? 'partial' : debt.status;

  await updateDebt(debtId, {
    remainingAmount: newRemaining,
    status: newStatus,
    relatedTransactionIds: relatedIds,
  });
}

export async function getDebtSummaryByWalletId(walletId: string): Promise<{
  totalOwed: number;
  totalOwing: number;
  activeDebtsCount: number;
}> {
  const debts = await getAllDebtsByWalletId(walletId);
  const activeDebts = debts.filter((d) => d.status === 'active' || d.status === 'partial');
  const totalOwed = activeDebts
    .filter((d) => d.type === 'owed')
    .reduce((sum, d) => sum + d.remainingAmount, 0);
  const totalOwing = activeDebts
    .filter((d) => d.type === 'owe')
    .reduce((sum, d) => sum + d.remainingAmount, 0);

  return {
    totalOwed,
    totalOwing,
    activeDebtsCount: activeDebts.length,
  };
}
