export type Language = 'ar' | 'fr' | 'en';

export type TransactionMethod = 'MANUAL' | 'QR';

export type TransactionType =
  | 'send'
  | 'receive'
  | 'freeze'
  | 'unfreeze'
  | 'freeze_spend'
  | 'transfer_in'
  | 'transfer_out'
  | 'business_payment_send'
  | 'business_payment_receive';

export type WalletType = 'personal' | 'business' | 'family';

export type CategoryType = 'pay' | 'receive' | 'both';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  walletId: string;
}

export interface Wallet {
  id: string;
  name: string;
  currency: string;
  balance: number;
  type: WalletType;
  exchangeRateToDZD: number | null;
  createdAt: number;
  /** Per-wallet theme color (wallet card, accents when active). Uses ThemeColorId from color palettes. */
  themeColorId?: string | null;
}

export interface Transaction {
  id: string;
  walletId: string;
  amount: number;
  type: TransactionType;
  timestamp: number;
  balanceBefore: number;
  balanceAfter: number;
  receiver?: string;
  sender?: string;
  category?: string;
  categoryId?: string;
  method: TransactionMethod;
  senderId?: string;
  receiverId?: string;
  /** Fiscal year (exercice) — YYYY. Every transaction belongs to exactly one exercice. */
  exercice: number;
  /** For transfer_in / transfer_out: linked transfer pair. */
  transferId?: string;
  relatedWalletId?: string;
  exchangeRateUsed?: number;
  /** Local file URI of optional payment proof image. */
  invoiceImage?: string | null;
}

export type ExerciceStatus = 'open' | 'closed';

export interface ExerciceRow {
  year: number;
  openingBalance: number;
  closingBalance: number;
  freezeBalance: number;
  status: ExerciceStatus;
  closedAt: number | null;
}

export interface SettingsRow {
  id: number;
  language: string;
  hasOnboarded: number;
}

export interface WalletRow {
  id: number;
  balance: number;
}

export interface FrozenFund {
  id: string;
  walletId: string;
  title: string;
  amount: number;
  category: string;
  isFrozen: boolean;
  createdAt: number;
}

export interface QrTransfer {
  txId: string;
  amount: number;
  note: string | null;
  currency: string;
  senderName: string;
  senderId: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: number;
}

/** QR payload sent when generating a QR code for wallet transfer */
export interface WalletTransferPayload {
  type: 'WALLET_TRANSFER';
  txId: string;
  senderName: string;
  senderId: string;
  amount: number;
  currency: string;
  note: string;
  createdAt: string;
}

/** Business Mode: merchant payment request QR (merchant → client) */
export interface BusinessPaymentPayload {
  type: 'business_payment';
  transaction_type: 'business_payment';
  merchant_wallet_id: string;
  merchant_name: string;
  amount: number;
  currency: string;
  timestamp: number;
  payment_id: string;
}

/** Business Mode: client → merchant confirmation after payment */
export interface BusinessPaymentConfirmPayload {
  type: 'business_payment_confirm';
  payment_id: string;
  client_wallet_id: string;
  amount: number;
  currency: string;
  timestamp: number;
  merchant_wallet_id: string;
}

/** Family Wallet: shared transaction item in QR payload */
export interface FamilySharedTransaction {
  transaction_id: string;
  amount: number;
  category?: string;
  timestamp: number;
}

/** Family Wallet: QR share payload (sharer → scanner) */
export interface FamilySharePayload {
  type: 'family_share';
  wallet_id: string;
  wallet_name: string;
  wallet_type: 'family';
  owner_alias: string;
  currency: string;
  shared_transactions: FamilySharedTransaction[];
  permissions: { view: true; edit: false; delete: false };
  expires_at: number;
}

/** Family Wallet: stored shared view row (read-only from other members) */
export interface SharedTransactionView {
  id: string;
  target_family_wallet_id: string;
  source_wallet_id: string;
  owner_alias: string;
  currency: string;
  shared_data: string; // JSON: FamilySharedTransaction[]
  expires_at: number;
  created_at: number;
}

export type DebtType = 'owe' | 'owed';
export type DebtStatus = 'active' | 'paid' | 'partial';

export interface Debt {
  id: string;
  walletId: string;
  type: DebtType; // 'owe' = I owe, 'owed' = I'm owed
  personName: string;
  originalAmount: number;
  remainingAmount: number;
  description?: string;
  createdAt: number;
  dueDate?: number | null; // Optional due date
  status: DebtStatus;
  relatedTransactionIds: string; // JSON array of transaction IDs
}
