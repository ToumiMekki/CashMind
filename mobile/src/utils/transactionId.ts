export function generateTransactionId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export function generateQRTransferId(): string {
  return `qrt_${Date.now()}_${Math.random().toString(36).slice(2, 15)}`;
}

/** UUID-like id for wallets. */
export function generateWalletId(): string {
  const hex = () => Math.floor(Math.random() * 16).toString(16);
  const u = Array.from({ length: 8 }, hex).join('') +
    '-' + Array.from({ length: 4 }, hex).join('') +
    '-4' + Array.from({ length: 3 }, hex).join('') +
    '-' + ((Math.floor(Math.random() * 4) + 8).toString(16)) + Array.from({ length: 3 }, hex).join('') +
    '-' + Array.from({ length: 12 }, hex).join('');
  return u;
}

/** Id linking transfer_out and transfer_in pair. */
export function generateTransferId(): string {
  return `xf_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

/** Business Mode: unique payment session id (request + confirm). */
export function generateBusinessPaymentId(): string {
  return `bp_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
}

/** Category id for per-wallet categories. */
export function generateCategoryId(): string {
  return `cat_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
