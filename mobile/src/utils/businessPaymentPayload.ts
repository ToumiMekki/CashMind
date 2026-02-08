import type {
  BusinessPaymentPayload,
  BusinessPaymentConfirmPayload,
} from '../database/types';
import { generateBusinessPaymentId } from './transactionId';

const BUSINESS_PAYMENT = 'business_payment';
const BUSINESS_PAYMENT_CONFIRM = 'business_payment_confirm';

export function buildBusinessPaymentRequest(params: {
  merchantWalletId: string;
  merchantName: string;
  amount: number;
  currency: string;
  paymentId?: string;
}): BusinessPaymentPayload {
  const ts = Date.now();
  return {
    type: BUSINESS_PAYMENT,
    transaction_type: 'business_payment',
    merchant_wallet_id: params.merchantWalletId,
    merchant_name: params.merchantName,
    amount: params.amount,
    currency: params.currency,
    timestamp: ts,
    payment_id: params.paymentId ?? generateBusinessPaymentId(),
  };
}

export function buildBusinessPaymentConfirm(params: {
  paymentId: string;
  clientWalletId: string;
  amount: number;
  currency: string;
  merchantWalletId: string;
}): BusinessPaymentConfirmPayload {
  return {
    type: BUSINESS_PAYMENT_CONFIRM,
    payment_id: params.paymentId,
    client_wallet_id: params.clientWalletId,
    amount: params.amount,
    currency: params.currency,
    timestamp: Date.now(),
    merchant_wallet_id: params.merchantWalletId,
  };
}

export function businessPaymentRequestToJson(p: BusinessPaymentPayload): string {
  return JSON.stringify(p);
}

export function businessPaymentConfirmToJson(p: BusinessPaymentConfirmPayload): string {
  return JSON.stringify(p);
}

export type ParseBusinessRequestResult =
  | { ok: true; payload: BusinessPaymentPayload }
  | { ok: false; error: string };

export function parseBusinessPaymentRequest(raw: string): ParseBusinessRequestResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'Invalid QR data' };
  }
  if (data == null || typeof data !== 'object') return { ok: false, error: 'Invalid QR data' };
  const o = data as Record<string, unknown>;
  if (o.type !== BUSINESS_PAYMENT || o.transaction_type !== 'business_payment') {
    return { ok: false, error: 'Not a business payment' };
  }
  if (typeof o.merchant_wallet_id !== 'string' || !o.merchant_wallet_id.trim()) {
    return { ok: false, error: 'Invalid merchant' };
  }
  const merchant_name = typeof o.merchant_name === 'string' ? o.merchant_name.trim() : '';
  const amount = Number(o.amount);
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: 'Invalid amount' };
  if (typeof o.currency !== 'string' || !o.currency.trim()) return { ok: false, error: 'Invalid currency' };
  const ts = typeof o.timestamp === 'number' ? o.timestamp : Date.now();
  if (typeof o.payment_id !== 'string' || !o.payment_id.trim()) {
    return { ok: false, error: 'Invalid payment id' };
  }
  const payload: BusinessPaymentPayload = {
    type: BUSINESS_PAYMENT,
    transaction_type: 'business_payment',
    merchant_wallet_id: String(o.merchant_wallet_id).trim(),
    merchant_name: merchant_name || 'Merchant',
    amount,
    currency: String(o.currency).trim(),
    timestamp: ts,
    payment_id: String(o.payment_id).trim(),
  };
  return { ok: true, payload };
}

export type ParseBusinessConfirmResult =
  | { ok: true; payload: BusinessPaymentConfirmPayload }
  | { ok: false; error: string };

export function parseBusinessPaymentConfirm(raw: string): ParseBusinessConfirmResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'Invalid QR data' };
  }
  if (data == null || typeof data !== 'object') return { ok: false, error: 'Invalid QR data' };
  const o = data as Record<string, unknown>;
  if (o.type !== BUSINESS_PAYMENT_CONFIRM) return { ok: false, error: 'Not a business confirmation' };
  if (typeof o.payment_id !== 'string' || !o.payment_id.trim()) {
    return { ok: false, error: 'Invalid payment id' };
  }
  if (typeof o.client_wallet_id !== 'string' || !o.client_wallet_id.trim()) {
    return { ok: false, error: 'Invalid client' };
  }
  const amount = Number(o.amount);
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: 'Invalid amount' };
  if (typeof o.currency !== 'string' || !o.currency.trim()) return { ok: false, error: 'Invalid currency' };
  const ts = typeof o.timestamp === 'number' ? o.timestamp : Date.now();
  if (typeof o.merchant_wallet_id !== 'string' || !o.merchant_wallet_id.trim()) {
    return { ok: false, error: 'Invalid merchant' };
  }
  const payload: BusinessPaymentConfirmPayload = {
    type: BUSINESS_PAYMENT_CONFIRM,
    payment_id: String(o.payment_id).trim(),
    client_wallet_id: String(o.client_wallet_id).trim(),
    amount,
    currency: String(o.currency).trim(),
    timestamp: ts,
    merchant_wallet_id: String(o.merchant_wallet_id).trim(),
  };
  return { ok: true, payload };
}
