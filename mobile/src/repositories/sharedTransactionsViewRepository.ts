import { getDatabase } from '../database';
import type { SharedTransactionView } from '../database/types';
import { generateTransactionId } from '../utils/transactionId';

function rowToView(row: Record<string, unknown>): SharedTransactionView {
  return {
    id: row.id as string,
    target_family_wallet_id: row.target_family_wallet_id as string,
    source_wallet_id: row.source_wallet_id as string,
    owner_alias: row.owner_alias as string,
    currency: row.currency as string,
    shared_data: row.shared_data as string,
    expires_at: Number(row.expires_at) || 0,
    created_at: Number(row.created_at) || 0,
  };
}

export async function insertSharedView(params: {
  targetFamilyWalletId: string;
  sourceWalletId: string;
  ownerAlias: string;
  currency: string;
  sharedData: string; // JSON string of FamilySharedTransaction[]
  expiresAt: number;
}): Promise<SharedTransactionView> {
  const db = await getDatabase();
  const id = generateTransactionId();
  const now = Date.now();
  await db.executeSql(
    `INSERT INTO shared_transactions_view (id, target_family_wallet_id, source_wallet_id, owner_alias, currency, shared_data, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      params.targetFamilyWalletId,
      params.sourceWalletId,
      params.ownerAlias,
      params.currency,
      params.sharedData,
      params.expiresAt,
      now,
    ]
  );
  return {
    id,
    target_family_wallet_id: params.targetFamilyWalletId,
    source_wallet_id: params.sourceWalletId,
    owner_alias: params.ownerAlias,
    currency: params.currency,
    shared_data: params.sharedData,
    expires_at: params.expiresAt,
    created_at: now,
  };
}

export async function getSharedViewsByTargetWallet(
  targetFamilyWalletId: string
): Promise<SharedTransactionView[]> {
  const db = await getDatabase();
  const now = Date.now();
  const [r] = await db.executeSql(
    `SELECT id, target_family_wallet_id, source_wallet_id, owner_alias, currency, shared_data, expires_at, created_at
     FROM shared_transactions_view
     WHERE target_family_wallet_id = ? AND expires_at > ?
     ORDER BY created_at DESC`,
    [targetFamilyWalletId, now]
  );
  const rows: SharedTransactionView[] = [];
  for (let i = 0; i < r.rows.length; i++) {
    rows.push(rowToView(r.rows.item(i) as Record<string, unknown>));
  }
  return rows;
}

export async function deleteExpiredSharedViews(): Promise<void> {
  const db = await getDatabase();
  const now = Date.now();
  await db.executeSql(
    'DELETE FROM shared_transactions_view WHERE expires_at <= ?',
    [now]
  );
}
