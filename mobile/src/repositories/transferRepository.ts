import { getDatabase } from '../database';
import {
  getWalletById,
  setWalletBalance,
} from './walletsRepository';
import {
  getAllTransactionsOrderedByTimeAsc,
  insertTransaction,
} from './transactionRepository';
import { getWalletSnapshot } from './exerciceRepository';
import { generateTransactionId, generateTransferId } from '../utils/transactionId';
import type { Transaction } from '../database/types';

export interface TransferParams {
  sourceWalletId: string;
  destWalletId: string;
  amount: number;
  exchangeRate?: number;
  exercice: number;
}

/**
 * Execute wallet-to-wallet transfer atomically.
 * Creates transfer_out (source) and transfer_in (dest), updates both balances.
 * Same currency: rate = 1. Cross-currency: dest amount = amount * (rate ?? 1).
 */
export async function executeTransfer(
  params: TransferParams
): Promise<{ success: true; transferId: string } | { success: false; error: string }> {
  const { sourceWalletId, destWalletId, amount, exchangeRate, exercice } = params;
  if (sourceWalletId === destWalletId) {
    return { success: false, error: 'Source and destination must differ' };
  }
  if (amount <= 0) return { success: false, error: 'Invalid amount' };

  const source = await getWalletById(sourceWalletId);
  const dest = await getWalletById(destWalletId);
  if (!source) return { success: false, error: 'Source wallet not found' };
  if (!dest) return { success: false, error: 'Destination wallet not found' };

  const rate = exchangeRate ?? 1;
  const destAmount = amount * rate;

  const sourceTxs = await getAllTransactionsOrderedByTimeAsc(exercice, sourceWalletId);
  const openingSource = await getOpeningBalance(sourceWalletId, exercice);
  const { balance: sourceBalance } = replayTransactions(sourceTxs, openingSource);
  if (amount > sourceBalance) {
    return { success: false, error: 'Insufficient balance in source wallet' };
  }

  const transferId = generateTransferId();
  const now = Date.now();
  const outId = generateTransactionId();
  const inId = generateTransactionId();

  const openingDest = await getOpeningBalance(destWalletId, exercice);
  const destTxs = await getAllTransactionsOrderedByTimeAsc(exercice, destWalletId);
  const { balance: destBalance } = replayTransactions(destTxs, openingDest);

  const outTx: Transaction = {
    id: outId,
    walletId: sourceWalletId,
    amount,
    type: 'transfer_out',
    timestamp: now,
    balanceBefore: sourceBalance,
    balanceAfter: sourceBalance - amount,
    method: 'MANUAL',
    exercice,
    transferId,
    relatedWalletId: destWalletId,
    exchangeRateUsed: rate,
  };

  const inTx: Transaction = {
    id: inId,
    walletId: destWalletId,
    amount: destAmount,
    type: 'transfer_in',
    timestamp: now,
    balanceBefore: destBalance,
    balanceAfter: destBalance + destAmount,
    method: 'MANUAL',
    exercice,
    transferId,
    relatedWalletId: sourceWalletId,
    exchangeRateUsed: rate,
  };

  const db = await getDatabase();
  try {
    await db.executeSql('BEGIN TRANSACTION');
    await insertTransaction(outTx);
    await insertTransaction(inTx);
    await setWalletBalance(sourceWalletId, Math.max(0, sourceBalance - amount));
    await setWalletBalance(destWalletId, destBalance + destAmount);
    await db.executeSql('COMMIT');
  } catch (e) {
    await db.executeSql('ROLLBACK');
    return { success: false, error: (e as Error).message };
  }

  return { success: true, transferId };
}

async function getOpeningBalance(walletId: string, year: number): Promise<number> {
  const snap = await getWalletSnapshot(walletId, year - 1);
  return snap?.closingBalance ?? 0;
}

function replayTransactions(
  txs: Transaction[],
  opening: number
): { balance: number; freezeBalance: number } {
  let balance = opening;
  let freezeBalance = 0;
  for (const tx of txs) {
    switch (tx.type) {
      case 'receive':
      case 'transfer_in':
      case 'business_payment_receive':
        balance += tx.amount;
        break;
      case 'send':
      case 'transfer_out':
      case 'business_payment_send':
        balance -= tx.amount;
        break;
      case 'freeze':
        balance -= tx.amount;
        freezeBalance += tx.amount;
        break;
      case 'unfreeze':
        freezeBalance -= tx.amount;
        balance += tx.amount;
        break;
      case 'freeze_spend':
        freezeBalance -= tx.amount;
        break;
      default:
        break;
    }
  }
  return {
    balance: Math.max(0, balance),
    freezeBalance: Math.max(0, freezeBalance),
  };
}
