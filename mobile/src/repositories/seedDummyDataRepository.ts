/**
 * Seeds dummy transaction data for one year to test analytics and flows.
 */

import { insertTransaction } from './transactionRepository';
import { getCategoriesByWalletId } from './categoriesRepository';
import { setWalletBalance } from './walletsRepository';
import { generateTransactionId } from '../utils/transactionId';
import type { Transaction } from '../database/types';

const SEND_SENDERS = ['Grocery', 'Fuel station', 'Restaurant', 'Pharmacy', 'Online shop', 'Market', 'Cafe', 'Bakery'];
const RECEIVE_SENDERS = ['Employer', 'Client', 'Freelance', 'Bonus', 'Refund', 'Gift from family', 'Side project'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function randomTimeInDay(d: Date): number {
  const start = new Date(d);
  start.setHours(8, 0, 0, 0);
  const end = new Date(d);
  end.setHours(22, 0, 0, 0);
  return start.getTime() + Math.random() * (end.getTime() - start.getTime());
}

export async function seedDummyDataForWallet(walletId: string): Promise<{ count: number; finalBalance: number }> {
  const categories = await getCategoriesByWalletId(walletId);
  const payCats = categories.filter((c) => c.type === 'pay' || c.type === 'both');
  const recvCats = categories.filter((c) => c.type === 'receive' || c.type === 'both');

  const now = new Date();
  const currentYear = now.getFullYear();
  const yearStart = new Date(currentYear, 0, 1, 0, 0, 0, 0).getTime();
  const yearEnd = now.getTime();

  const txs: Transaction[] = [];
  let balance = 0;

  // Generate 80–150 transactions over the year (current year only for correct balance)
  const totalDays = Math.max(1, Math.floor((yearEnd - yearStart) / (24 * 60 * 60 * 1000)));
  const txCount = randomInt(80, 150);

  for (let i = 0; i < txCount; i++) {
    const dayOffset = randomInt(0, Math.max(0, totalDays - 1));
    const date = new Date(yearStart);
    date.setDate(date.getDate() + dayOffset);
    const timestamp = randomTimeInDay(date);
    const exercice = new Date(timestamp).getFullYear();

    const isReceive = Math.random() < 0.45;
    let amount: number;
    let type: 'send' | 'receive';
    let categoryId: string | undefined;
    let receiver: string | undefined;
    let sender: string | undefined;

    if (isReceive) {
      type = 'receive';
      amount = randomInt(500, 15000);
      if (Math.random() < 0.3) amount = randomInt(25000, 80000);
      categoryId = recvCats.length > 0 ? randomPick(recvCats).id : undefined;
      sender = randomPick(RECEIVE_SENDERS);
      balance += amount;
    } else {
      type = 'send';
      amount = randomInt(100, 5000);
      if (Math.random() < 0.15) amount = randomInt(5000, 20000);
      categoryId = payCats.length > 0 ? randomPick(payCats).id : undefined;
      receiver = randomPick(SEND_SENDERS);
      if (balance < amount) {
        balance += randomInt(5000, 15000);
        const extraRecv: Transaction = {
          id: generateTransactionId(),
          walletId,
          amount: balance,
          type: 'receive',
          timestamp: timestamp - 3600000,
          balanceBefore: 0,
          balanceAfter: balance,
          sender: 'Adjustment',
          method: 'MANUAL',
          exercice,
        };
        txs.push(extraRecv);
      }
      balance -= amount;
    }

    const balanceBefore = balance + (type === 'send' ? amount : -amount);
    const balanceAfter = balance;

    txs.push({
      id: generateTransactionId(),
      walletId,
      amount,
      type,
      timestamp,
      balanceBefore,
      balanceAfter,
      receiver,
      sender,
      categoryId,
      method: 'MANUAL',
      exercice,
    });
  }

  txs.sort((a, b) => a.timestamp - b.timestamp);

  let runningBalance = 0;
  for (let i = 0; i < txs.length; i++) {
    const tx = txs[i];
    if (tx.type === 'receive') {
      tx.balanceBefore = runningBalance;
      runningBalance += tx.amount;
      tx.balanceAfter = runningBalance;
    } else {
      tx.balanceBefore = runningBalance;
      runningBalance -= tx.amount;
      tx.balanceAfter = runningBalance;
    }
  }

  for (const tx of txs) {
    await insertTransaction(tx);
  }

  await setWalletBalance(walletId, Math.max(0, runningBalance));
  return { count: txs.length, finalBalance: Math.max(0, runningBalance) };
}
