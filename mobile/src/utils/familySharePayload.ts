import type { FamilySharePayload, FamilySharedTransaction } from '../database/types';
import { generateTransactionId } from './transactionId';

const FAMILY_SHARE = 'family_share';

export type TimeRange = 'this_week' | 'this_month' | 'custom';

export function buildFamilySharePayload(params: {
  walletId: string;
  walletName: string;
  ownerAlias: string;
  currency: string;
  sharedTransactions: FamilySharedTransaction[];
  expiresInMs?: number;
}): FamilySharePayload {
  const expiresIn = params.expiresInMs ?? 7 * 24 * 60 * 60 * 1000; // 7 days default
  return {
    type: FAMILY_SHARE,
    wallet_id: params.walletId,
    wallet_name: params.walletName.trim() || 'Family',
    wallet_type: 'family',
    owner_alias: params.ownerAlias,
    currency: params.currency,
    shared_transactions: params.sharedTransactions,
    permissions: { view: true, edit: false, delete: false },
    expires_at: Date.now() + expiresIn,
  };
}

export function familyShareToJson(p: FamilySharePayload): string {
  return JSON.stringify(p);
}

export type ParseFamilyShareResult =
  | { ok: true; payload: FamilySharePayload }
  | { ok: false; error: string };

export function parseFamilySharePayload(raw: string): ParseFamilyShareResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'Invalid QR data' };
  }
  if (data == null || typeof data !== 'object') return { ok: false, error: 'Invalid QR data' };
  const o = data as Record<string, unknown>;
  if (o.type !== FAMILY_SHARE) return { ok: false, error: 'Not a family share' };
  if (o.wallet_type !== 'family') return { ok: false, error: 'Wallet must be family type' };
  if (typeof o.wallet_id !== 'string' || !o.wallet_id.trim()) {
    return { ok: false, error: 'Invalid wallet' };
  }
  const wallet_name = typeof o.wallet_name === 'string' ? String(o.wallet_name).trim() || 'Family' : 'Family';
  const owner_alias = typeof o.owner_alias === 'string' ? String(o.owner_alias).trim() || 'Member' : 'Member';
  if (typeof o.currency !== 'string' || !o.currency.trim()) {
    return { ok: false, error: 'Invalid currency' };
  }
  const expires_at = typeof o.expires_at === 'number' ? o.expires_at : 0;
  if (expires_at < Date.now()) return { ok: false, error: 'QR expired' };

  const rawTx = o.shared_transactions;
  if (!Array.isArray(rawTx)) return { ok: false, error: 'Invalid shared transactions' };

  const shared_transactions: FamilySharedTransaction[] = [];
  for (const item of rawTx) {
    if (item == null || typeof item !== 'object') continue;
    const t = item as Record<string, unknown>;
    const txId = typeof t.transaction_id === 'string' ? t.transaction_id : generateTransactionId();
    const amount = Number(t.amount);
    const timestamp = typeof t.timestamp === 'number' ? t.timestamp : Date.now();
    if (!Number.isFinite(amount)) continue;
    shared_transactions.push({
      transaction_id: txId,
      amount,
      category: typeof t.category === 'string' ? t.category : undefined,
      timestamp,
    });
  }

  const payload: FamilySharePayload = {
    type: FAMILY_SHARE,
    wallet_id: String(o.wallet_id).trim(),
    wallet_name,
    wallet_type: 'family',
    owner_alias: owner_alias,
    currency: String(o.currency).trim(),
    shared_transactions,
    permissions: { view: true, edit: false, delete: false },
    expires_at,
  };
  return { ok: true, payload };
}
