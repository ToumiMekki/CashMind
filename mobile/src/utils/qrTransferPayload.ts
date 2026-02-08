import type { WalletTransferPayload } from '../database/types';

const WALLET_TRANSFER = 'WALLET_TRANSFER';

export function buildPayload(params: {
  txId: string;
  senderName: string;
  senderId: string;
  amount: number;
  currency: string;
  note: string;
}): WalletTransferPayload {
  return {
    type: WALLET_TRANSFER,
    txId: params.txId,
    senderName: params.senderName,
    senderId: params.senderId,
    amount: params.amount,
    currency: params.currency,
    note: params.note || '',
    createdAt: new Date().toISOString(),
  };
}

export function payloadToJson(payload: WalletTransferPayload): string {
  return JSON.stringify(payload);
}

export type ParseResult =
  | { ok: true; payload: WalletTransferPayload }
  | { ok: false; error: string };

export function parsePayload(raw: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'Invalid QR data' };
  }
  if (data == null || typeof data !== 'object') {
    return { ok: false, error: 'Invalid QR data' };
  }
  const o = data as Record<string, unknown>;
  if (o.type !== WALLET_TRANSFER) {
    return { ok: false, error: 'Not a wallet transfer' };
  }
  if (typeof o.txId !== 'string' || !o.txId.trim()) {
    return { ok: false, error: 'Invalid transaction ID' };
  }
  if (typeof o.senderName !== 'string' || !o.senderName.trim()) {
    return { ok: false, error: 'Invalid sender' };
  }
  if (typeof o.senderId !== 'string' || !o.senderId.trim()) {
    return { ok: false, error: 'Invalid sender ID' };
  }
  const amount = Number(o.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: 'Invalid amount' };
  }
  if (typeof o.currency !== 'string' || !o.currency.trim()) {
    return { ok: false, error: 'Invalid currency' };
  }
  const note = typeof o.note === 'string' ? o.note : '';
  const createdAt = typeof o.createdAt === 'string' ? o.createdAt : new Date().toISOString();

  const payload: WalletTransferPayload = {
    type: WALLET_TRANSFER,
    txId: String(o.txId).trim(),
    senderName: String(o.senderName).trim(),
    senderId: String(o.senderId).trim(),
    amount,
    currency: String(o.currency).trim(),
    note,
    createdAt,
  };
  return { ok: true, payload };
}
