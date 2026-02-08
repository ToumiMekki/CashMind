import { getDatabase } from '../database';
import type { QrTransfer } from '../database/types';

type QrTransferRow = {
  txId: string;
  amount: number;
  note: string | null;
  currency: string;
  senderName: string;
  senderId: string;
  status: QrTransfer['status'];
  createdAt: number;
};

export async function insertQrTransfer(t: QrTransfer): Promise<void> {
  const db = await getDatabase();
  await db.executeSql(
    `INSERT INTO qr_transfers (txId, amount, note, currency, senderName, senderId, status, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      t.txId,
      t.amount,
      t.note ?? null,
      t.currency,
      t.senderName,
      t.senderId,
      t.status,
      t.createdAt,
    ]
  );
}

export async function getQrTransferByTxId(txId: string): Promise<QrTransfer | null> {
  const db = await getDatabase();
  const [r] = await db.executeSql(
    'SELECT txId, amount, note, currency, senderName, senderId, status, createdAt FROM qr_transfers WHERE txId = ?',
    [txId]
  );
  if (r.rows.length === 0) return null;
  const row = r.rows.item(0) as QrTransferRow;
  return {
    txId: row.txId,
    amount: row.amount,
    note: row.note,
    currency: row.currency,
    senderName: row.senderName,
    senderId: row.senderId,
    status: row.status,
    createdAt: row.createdAt,
  };
}

export async function updateQrTransferStatus(
  txId: string,
  status: QrTransfer['status']
): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('UPDATE qr_transfers SET status = ? WHERE txId = ?', [
    status,
    txId,
  ]);
}

export async function deleteQrTransfer(txId: string): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM qr_transfers WHERE txId = ?', [txId]);
}
