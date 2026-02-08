import { getDatabase } from '../database';
import { getWalletById, setWalletBalance } from './walletsRepository';
import {
  getAllTransactionsOrderedByTimeAsc,
  insertTransaction,
  hasBusinessPaymentReceiveByTransferId,
} from './transactionRepository';
import { getWalletSnapshot } from './exerciceRepository';
import { generateTransactionId } from '../utils/transactionId';
import { buildBusinessPaymentConfirm } from '../utils/businessPaymentPayload';
import type {
  Transaction,
  BusinessPaymentPayload,
  BusinessPaymentConfirmPayload,
} from '../database/types';

async function getOpeningBalance(walletId: string, year: number): Promise<number> {
  const snap = await getWalletSnapshot(walletId, year - 1);
  return snap?.closingBalance ?? 0;
}

function replayBalance(txs: Transaction[], opening: number): number {
  let b = opening;
  for (const tx of txs) {
    switch (tx.type) {
      case 'receive':
      case 'transfer_in':
      case 'business_payment_receive':
        b += tx.amount;
        break;
      case 'send':
      case 'transfer_out':
      case 'business_payment_send':
        b -= tx.amount;
        break;
      case 'freeze':
        b -= tx.amount;
        break;
      case 'unfreeze':
        b += tx.amount;
        break;
      case 'freeze_spend':
        break;
      default:
        break;
    }
  }
  return Math.max(0, b);
}

const currentYear = () => new Date().getFullYear();

/**
 * Client pays: deduct from client wallet, create business_payment_send.
 * Returns confirm payload for client to display as QR (merchant scans it).
 */
export async function executeBusinessPaymentAsClient(
  request: BusinessPaymentPayload,
  clientWalletId: string
): Promise<
  | { success: true; confirmPayload: BusinessPaymentConfirmPayload }
  | { success: false; error: string }
> {
  const exercice = currentYear();
  const client = await getWalletById(clientWalletId);
  if (!client) return { success: false, error: 'Wallet not found' };
  if (request.amount <= 0) return { success: false, error: 'Invalid amount' };
  if (request.merchant_wallet_id === clientWalletId) {
    return { success: false, error: 'Cannot pay yourself' };
  }

  const txs = await getAllTransactionsOrderedByTimeAsc(exercice, clientWalletId);
  const opening = await getOpeningBalance(clientWalletId, exercice);
  const balance = replayBalance(txs, opening);
  if (request.amount > balance) {
    return { success: false, error: 'Insufficient balance' };
  }

  const now = Date.now();
  const txId = generateTransactionId();
  const sendTx: Transaction = {
    id: txId,
    walletId: clientWalletId,
    amount: request.amount,
    type: 'business_payment_send',
    timestamp: now,
    balanceBefore: balance,
    balanceAfter: balance - request.amount,
    receiver: request.merchant_name,
    method: 'QR',
    exercice,
    transferId: request.payment_id,
    relatedWalletId: request.merchant_wallet_id,
  };

  const db = await getDatabase();
  try {
    await db.executeSql('BEGIN TRANSACTION');
    await insertTransaction(sendTx);
    await setWalletBalance(clientWalletId, balance - request.amount);
    await db.executeSql('COMMIT');
  } catch (e) {
    await db.executeSql('ROLLBACK');
    return { success: false, error: (e as Error).message };
  }

  const confirmPayload = buildBusinessPaymentConfirm({
    paymentId: request.payment_id,
    clientWalletId,
    amount: request.amount,
    currency: request.currency,
    merchantWalletId: request.merchant_wallet_id,
  });
  return { success: true, confirmPayload };
}

/**
 * Merchant scans client's confirmation QR: create business_payment_receive, update balance.
 * Prevents duplicate via payment_id (transfer_id).
 */
export async function completeBusinessPaymentAsMerchant(
  confirm: BusinessPaymentConfirmPayload,
  merchantWalletId: string
): Promise<{ success: true } | { success: false; error: string }> {
  if (confirm.merchant_wallet_id !== merchantWalletId) {
    return { success: false, error: 'Confirmation not for this wallet' };
  }
  const exists = await hasBusinessPaymentReceiveByTransferId(confirm.payment_id);
  if (exists) return { success: false, error: 'Duplicate payment' };

  const exercice = currentYear();
  const merchant = await getWalletById(merchantWalletId);
  if (!merchant) return { success: false, error: 'Wallet not found' };
  if (confirm.amount <= 0) return { success: false, error: 'Invalid amount' };

  const txs = await getAllTransactionsOrderedByTimeAsc(exercice, merchantWalletId);
  const opening = await getOpeningBalance(merchantWalletId, exercice);
  const balance = replayBalance(txs, opening);

  const now = Date.now();
  const txId = generateTransactionId();
  const receiveTx: Transaction = {
    id: txId,
    walletId: merchantWalletId,
    amount: confirm.amount,
    type: 'business_payment_receive',
    timestamp: now,
    balanceBefore: balance,
    balanceAfter: balance + confirm.amount,
    sender: undefined,
    category: 'Business payment',
    method: 'QR',
    exercice,
    transferId: confirm.payment_id,
    relatedWalletId: confirm.client_wallet_id,
  };

  const db = await getDatabase();
  try {
    await db.executeSql('BEGIN TRANSACTION');
    await insertTransaction(receiveTx);
    await setWalletBalance(merchantWalletId, balance + confirm.amount);
    await db.executeSql('COMMIT');
  } catch (e) {
    await db.executeSql('ROLLBACK');
    return { success: false, error: (e as Error).message };
  }

  return { success: true };
}
