import { create } from 'zustand';
import type { Language, Transaction, Wallet, WalletTransferPayload } from '../database/types';
import {
  getSettings,
  setHasOnboarded,
  setLanguage as setLanguageRepo,
  setTheme as setThemeRepo,
  setThemeColor as setThemeColorRepo,
  setActiveWalletId as setActiveWalletIdRepo,
  setSoundSettings as setSoundSettingsRepo,
  type Theme,
  type SoundSettings as RepoSoundSettings,
} from '../repositories/settingsRepository';
import { configureSoundManager, preloadSounds } from '../services/soundManager';
import type { ThemeColorId } from '../theme/colorPalettes';
import {
  getAllWallets,
  getWalletById,
  setWalletBalance,
  createWallet,
  getDefaultMigrationWalletId,
  deleteWallet,
} from '../repositories/walletsRepository';
import {
  getTransactionsByWalletAndExercice,
  insertTransaction,
  getTransactionById,
  deleteTransactionById,
  getAllTransactionsOrderedByTimeAsc,
  getTransactionCountByWalletId,
} from '../repositories/transactionRepository';
import {
  getExercices,
  getExercice,
  getCurrentExercice,
  setCurrentExercice as setCurrentExerciceRepo,
  createExercice,
  closeExercice as closeExerciceRepo,
  getWalletSnapshot,
  upsertWalletSnapshot,
  currentYear,
} from '../repositories/exerciceRepository';
import {
  insertQrTransfer,
  getQrTransferByTxId,
  updateQrTransferStatus,
} from '../repositories/qrTransfersRepository';
import {
  insertFrozenFund,
  deleteFrozenFund,
} from '../repositories/frozenFundsRepository';
import {
  executeBusinessPaymentAsClient as executeBusinessPaymentAsClientRepo,
  completeBusinessPaymentAsMerchant as completeBusinessPaymentAsMerchantRepo,
} from '../repositories/businessPaymentRepository';
import {
  insertSharedView,
  deleteExpiredSharedViews,
} from '../repositories/sharedTransactionsViewRepository';
import { seedDefaultCategoriesForWallet } from '../repositories/categoriesRepository';
import { seedDummyDataForWallet } from '../repositories/seedDummyDataRepository';
import { resetDatabase } from '../database';
import { i18n } from '../i18n';
import { setI18nLanguage } from '../i18n';
import { generateTransactionId } from '../utils/transactionId';
import { deleteTransactionImage } from '../services/imageService';
import {
  getAuthState,
  type AuthState,
} from '../services/authService';

export type OverlayType =
  | 'pay'
  | 'qrScan'
  | 'receive'
  | 'freeze'
  | 'spendFromFreeze'
  | 'unfreeze'
  | 'addWallet'
  | 'transfer'
  | 'businessScanConfirm'
  | 'businessMode'
  | 'familyShare'
  | 'pinSetup'
  | 'verifyPinEnableBiometric'
  | 'verifyPinDisablePin'
  | 'debtList'
  | 'addDebt'
  | 'debtDetails'
  | null;

export const FROZEN_SPEND_ERROR =
  'This amount is frozen and cannot be spent';

export const EXERCICE_CLOSED_ERROR =
  'This fiscal year is closed. No transactions allowed.';

interface AppState {
  initialized: boolean;
  hasOnboarded: boolean;
  language: Language;
  theme: Theme;
  themeColor: ThemeColorId;
  /** Multi-wallet: all wallets. */
  wallets: Wallet[];
  /** Currently selected wallet id. All actions use this. */
  activeWalletId: string;
  balance: number;
  freezeBalance: number;
  /** Active wallet's transactions (also in transactionsByWallet[activeWalletId]). */
  transactions: Transaction[];
  /** Per-wallet transactions for current exercice. Used for carousel today-spending. */
  transactionsByWallet: Record<string, Transaction[]>;
  overlay: OverlayType;
  selectedTransaction: Transaction | null;
  selectedDebt: import('../database/types').Debt | null;

  /** Incremented when family shared view is ingested; triggers FamilyWalletMergeView refetch. */
  sharedViewRefreshTrigger: number;

  /** Current fiscal year (exercice) — YYYY. */
  currentExercice: number;
  /** List of exercice years with status; used for selector. */
  exercices: { year: number; status: 'open' | 'closed' }[];

  /** Global balance/amount visibility. When false, mask all amounts (balance + transactions). */
  balanceVisible: boolean;
  toggleBalanceVisibility: () => void;

  /** Sound effects: enabled, volume 0–1, mute in silent mode, amount keypad taps */
  soundSettings: RepoSoundSettings;
  setSoundSettings: (settings: Partial<RepoSoundSettings>) => Promise<void>;

  /** App lock: when hasPin and !isUnlocked, show LockScreen. */
  isUnlocked: boolean;
  authState: AuthState | null;
  setUnlocked: (v: boolean) => void;
  lock: () => void;
  refreshAuthState: () => Promise<void>;

  availableBalance: () => number;
  totalFrozenBalance: () => number;
  isCurrentExerciceOpen: () => boolean;

  init: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  completeOnboardingWithWallet: (name: string, currency: string) => Promise<void>;
  setLanguage: (lang: Language) => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  setThemeColor: (color: ThemeColorId) => Promise<void>;
  setCurrentExercice: (year: number) => Promise<void>;
  closeExercice: () => Promise<{ success: true } | { success: false; error: string }>;
  openNewExercice: () => Promise<{ success: true } | { success: false; error: string }>;
  setActiveWallet: (walletId: string) => Promise<void>;
  addTransaction: (
    params: Omit<
      Transaction,
      'id' | 'timestamp' | 'balanceBefore' | 'balanceAfter' | 'method' | 'exercice' | 'walletId'
    > & { method?: 'MANUAL' | 'QR' }
  ) => Promise<{ success: true } | { success: false; error: string }>;
  freezeAmount: (params: {
    amount: number;
    title?: string;
    category?: string;
  }) => Promise<{ success: true } | { success: false; error: string }>;
  unfreezeAmount: (amount: number) => Promise<{ success: true } | { success: false; error: string }>;
  spendFromFreeze: (amount: number) => Promise<{ success: true } | { success: false; error: string }>;
  deleteTransaction: (id: string) => Promise<{ success: true } | { success: false; error: string }>;
  removeTransactionImage: (txId: string) => Promise<{ success: true } | { success: false; error: string }>;
  setOverlay: (overlay: OverlayType) => void;
  setSelectedTransaction: (tx: Transaction | null) => void;
  setSelectedDebt: (debt: import('../database/types').Debt | null) => void;
  refreshDebts: () => Promise<void>;
  resetData: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshWallets: () => Promise<void>;
  seedDummyData: () => Promise<{ success: true; count: number; balance: number } | { success: false; error: string }>;
  deleteWalletAndSwitch: (id: string) => Promise<{ success: true } | { success: false; error: string }>;

  freezeQrTransfer: (params: {
    txId: string;
    amount: number;
    note: string;
    currency: string;
    senderName: string;
    senderId: string;
  }) => Promise<{ success: true } | { success: false; error: string }>;
  cancelQrTransfer: (txId: string) => Promise<void>;
  confirmQrSend: (txId: string, categoryId?: string | null, invoiceImage?: string | null) => Promise<{ success: true } | { success: false; error: string }>;
  addReceiveFromQR: (payload: WalletTransferPayload, categoryId?: string | null) => Promise<{ success: true } | { success: false; error: string }>;

  executeBusinessPaymentAsClient: (
    request: import('../database/types').BusinessPaymentPayload
  ) => Promise<
    | { success: true; confirmPayload: import('../database/types').BusinessPaymentConfirmPayload }
    | { success: false; error: string }
  >;
  completeBusinessPaymentAsMerchant: (
    confirm: import('../database/types').BusinessPaymentConfirmPayload
  ) => Promise<{ success: true } | { success: false; error: string }>;

  ingestFamilyShare: (
    payload: import('../database/types').FamilySharePayload
  ) => Promise<{ success: true } | { success: false; error: string }>;
}

function replayTransactions(
  txs: Transaction[],
  openingBalance: number = 0
): { balance: number; freezeBalance: number } {
  let balance = openingBalance;
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

export const useAppStore = create<AppState>((set, get) => ({
  initialized: false,
  hasOnboarded: false,
  language: 'ar',
  theme: 'system',
  themeColor: 'blue',
  wallets: [],
  activeWalletId: '',
  balance: 0,
  freezeBalance: 0,
  transactions: [],
  transactionsByWallet: {},
  overlay: null,
  selectedTransaction: null,
  sharedViewRefreshTrigger: 0,
  currentExercice: currentYear(),
  exercices: [],
  balanceVisible: false,
  toggleBalanceVisibility: () => set((s) => ({ balanceVisible: !s.balanceVisible })),

  soundSettings: {
    soundsEnabled: true,
    soundVolume: 0.4,
    muteInSilentMode: true,
    amountInputSound: false,
  },
  setSoundSettings: async (next) => {
    await setSoundSettingsRepo(next);
    const settings = await getSettings();
    configureSoundManager({
      enabled: settings.soundSettings.soundsEnabled,
      volume: settings.soundSettings.soundVolume,
      muteInSilentMode: settings.soundSettings.muteInSilentMode,
      amountInputEnabled: settings.soundSettings.amountInputSound,
    });
    set((s) => ({
      soundSettings: { ...s.soundSettings, ...next },
    }));
  },

  authState: null as AuthState | null,
  isUnlocked: true,
  setUnlocked: (v: boolean) => set({ isUnlocked: v }),
  lock: () => set({ isUnlocked: false }),
  refreshAuthState: async () => {
    const authState = await getAuthState();
    set({ authState });
  },

  availableBalance: () => get().balance,
  totalFrozenBalance: () => get().freezeBalance,
  isCurrentExerciceOpen: () => {
    const ex = get().exercices.find((e) => e.year === get().currentExercice);
    return ex?.status === 'open';
  },

  init: async () => {
    await deleteExpiredSharedViews();
    const walletsForInit = await getAllWallets();
    for (const w of walletsForInit) {
      await seedDefaultCategoriesForWallet(w.id);
    }
    const settings = await getSettings();
    const cur = await getCurrentExercice();
    const exercices = await getExercices();
    const exList = exercices.map((e) => ({ year: e.year, status: e.status }));
    const wallets = walletsForInit;
    const activeWalletId = settings.activeWalletId;
    const ex = await getExercice(cur);
    const snap = activeWalletId ? await getWalletSnapshot(activeWalletId, cur - 1) : null;
    const opening = snap?.closingBalance ?? (ex?.openingBalance ?? 0);
    const isClosed = ex?.status === 'closed';
    const transactions = activeWalletId
      ? await getTransactionsByWalletAndExercice(activeWalletId, cur)
      : [];
    const { balance, freezeBalance } = isClosed && ex
      ? { balance: snap?.closingBalance ?? ex.closingBalance, freezeBalance: snap?.freezeBalance ?? 0 }
      : replayTransactions(transactions, opening);
    setI18nLanguage(settings.language);
    if (activeWalletId) await setWalletBalance(activeWalletId, balance);
    const byWallet: Record<string, Transaction[]> = {};
    for (const w of wallets) {
      const txs = await getTransactionsByWalletAndExercice(w.id, cur);
      byWallet[w.id] = txs;
    }
    const authState = await getAuthState();
    configureSoundManager({
      enabled: settings.soundSettings.soundsEnabled,
      volume: settings.soundSettings.soundVolume,
      muteInSilentMode: settings.soundSettings.muteInSilentMode,
      amountInputEnabled: settings.soundSettings.amountInputSound,
    });
    preloadSounds();
    set({
      hasOnboarded: settings.hasOnboarded,
      language: settings.language,
      theme: settings.theme,
      themeColor: settings.themeColor,
      wallets,
      activeWalletId,
      currentExercice: cur,
      exercices: exList,
      balance,
      freezeBalance,
      transactions: activeWalletId ? (byWallet[activeWalletId] ?? []) : [],
      transactionsByWallet: byWallet,
      initialized: true,
      authState,
      isUnlocked: !authState.hasPin,
      soundSettings: settings.soundSettings,
    });
  },

  setActiveWallet: async (walletId: string) => {
    await setActiveWalletIdRepo(walletId);
    const cur = get().currentExercice;
    const ex = await getExercice(cur);
    const snap = await getWalletSnapshot(walletId, cur - 1);
    const opening = snap?.closingBalance ?? 0;
    const isClosed = ex?.status === 'closed';
    const transactions = await getTransactionsByWalletAndExercice(walletId, cur);
    const { balance, freezeBalance } = isClosed && ex
      ? { balance: snap?.closingBalance ?? ex.closingBalance, freezeBalance: snap?.freezeBalance ?? 0 }
      : replayTransactions(transactions, opening);
    await setWalletBalance(walletId, balance);
    const byWallet = { ...get().transactionsByWallet, [walletId]: transactions };
    set({
      activeWalletId: walletId,
      balance,
      freezeBalance,
      transactions,
      transactionsByWallet: byWallet,
    });
  },

  setCurrentExercice: async (year: number) => {
    const activeWalletId = get().activeWalletId;
    const exercices = await getExercices();
    const exList = exercices.map((e) => ({ year: e.year, status: e.status }));
    const ex = await getExercice(year);
    const transactions = activeWalletId
      ? await getTransactionsByWalletAndExercice(activeWalletId, year)
      : [];
    const snap = activeWalletId ? await getWalletSnapshot(activeWalletId, year - 1) : null;
    const opening = snap?.closingBalance ?? (ex?.openingBalance ?? 0);
    const isClosed = ex?.status === 'closed';
    const { balance, freezeBalance } = isClosed && ex
      ? { balance: snap?.closingBalance ?? ex.closingBalance, freezeBalance: snap?.freezeBalance ?? 0 }
      : replayTransactions(transactions, opening);
    await setCurrentExerciceRepo(year);
    if (activeWalletId) await setWalletBalance(activeWalletId, balance);
    const wallets = get().wallets.length ? get().wallets : await getAllWallets();
    const byWallet: Record<string, Transaction[]> = {};
    for (const w of wallets) {
      const txs = await getTransactionsByWalletAndExercice(w.id, year);
      byWallet[w.id] = txs;
    }
    set({
      currentExercice: year,
      exercices: exList,
      balance,
      freezeBalance,
      transactions,
      transactionsByWallet: byWallet,
    });
  },

  closeExercice: async () => {
    const cur = get().currentExercice;
    const ex = await getExercice(cur);
    if (!ex) return { success: false, error: 'Exercice not found' };
    if (ex.status === 'closed') return { success: false, error: 'Exercice already closed' };
    const wallets = get().wallets.length ? get().wallets : await getAllWallets();
    let totalClosing = 0;
    let totalFreeze = 0;
    for (const w of wallets) {
      const txs = await getTransactionsByWalletAndExercice(w.id, cur);
      const snap = await getWalletSnapshot(w.id, cur - 1);
      const opening = snap?.closingBalance ?? 0;
      const { balance: closingBalance, freezeBalance } = replayTransactions(txs, opening);
      await upsertWalletSnapshot(w.id, cur, closingBalance, freezeBalance);
      totalClosing += closingBalance;
      totalFreeze += freezeBalance;
    }
    await closeExerciceRepo(cur, totalClosing, totalFreeze);
    const exercices = await getExercices();
    const exList = exercices.map((e) => ({ year: e.year, status: e.status }));
    const activeWalletId = get().activeWalletId;
    const activeSnap = activeWalletId ? await getWalletSnapshot(activeWalletId, cur) : null;
    set({
      exercices: exList,
      balance: activeSnap?.closingBalance ?? 0,
      freezeBalance: 0,
    });
    return { success: true };
  },

  openNewExercice: async () => {
    const cur = get().currentExercice;
    const next = cur + 1;
    const existing = await getExercice(next);
    if (existing) return { success: false, error: `Exercice ${next} already exists` };
    const wallets = get().wallets.length ? get().wallets : await getAllWallets();
    let totalOpening = 0;
    for (const w of wallets) {
      const snap = await getWalletSnapshot(w.id, cur);
      const opening = snap?.closingBalance ?? 0;
      await upsertWalletSnapshot(w.id, next, opening, 0);
      totalOpening += opening;
    }
    await createExercice(next, totalOpening);
    await setCurrentExerciceRepo(next);
    const exercices = await getExercices();
    const exList = exercices.map((e) => ({ year: e.year, status: e.status }));
    const activeWalletId = get().activeWalletId;
    const transactions = activeWalletId
      ? await getTransactionsByWalletAndExercice(activeWalletId, next)
      : [];
    const activeSnap = activeWalletId ? await getWalletSnapshot(activeWalletId, next) : null;
    const opening = activeSnap?.closingBalance ?? 0;
    if (activeWalletId) await setWalletBalance(activeWalletId, opening);
    const byWallet: Record<string, Transaction[]> = {};
    for (const w of wallets) {
      const txs = await getTransactionsByWalletAndExercice(w.id, next);
      byWallet[w.id] = txs;
    }
    set({
      currentExercice: next,
      exercices: exList,
      balance: opening,
      freezeBalance: 0,
      transactions,
      transactionsByWallet: byWallet,
    });
    return { success: true };
  },

  completeOnboarding: async () => {
    await setHasOnboarded(true);
    setI18nLanguage(get().language);
    set({ hasOnboarded: true });
  },

  completeOnboardingWithWallet: async (name: string, currency: string) => {
    const defaultId = getDefaultMigrationWalletId();
    const count = await getTransactionCountByWalletId(defaultId);
    if (count === 0) {
      await deleteWallet(defaultId);
    }
    const wallet = await createWallet({
      name: (name || 'Main').trim() || 'Main',
      currency: currency || 'DZD',
      type: 'personal',
    });
    await setActiveWalletIdRepo(wallet.id);
    await setHasOnboarded(true);
    setI18nLanguage(get().language);
    const wallets = await getAllWallets();
    const cur = await getCurrentExercice();
    const byWallet: Record<string, Transaction[]> = {};
    for (const w of wallets) {
      const txs = await getTransactionsByWalletAndExercice(w.id, cur);
      byWallet[w.id] = txs;
    }
    set({
      hasOnboarded: true,
      wallets,
      activeWalletId: wallet.id,
      balance: 0,
      freezeBalance: 0,
      transactions: [],
      transactionsByWallet: byWallet,
    });
  },

  setLanguage: async (lang: Language) => {
    await setLanguageRepo(lang);
    setI18nLanguage(lang);
    set({ language: lang });
  },

  setTheme: async (theme: Theme) => {
    await setThemeRepo(theme);
    set({ theme });
  },

  setThemeColor: async (themeColor: ThemeColorId) => {
    await setThemeColorRepo(themeColor);
    set({ themeColor });
  },

  addTransaction: async (params) => {
    const { balance, currentExercice, activeWalletId } = get();
    if (!activeWalletId) return { success: false, error: 'No wallet selected' };
    if (!get().isCurrentExerciceOpen()) {
      return { success: false, error: EXERCICE_CLOSED_ERROR };
    }
    if (params.type === 'send') {
      if (params.amount > balance) {
        return { success: false, error: FROZEN_SPEND_ERROR };
      }
    }
    const balanceBefore = balance;
    const isIncome = params.type === 'receive' || params.type === 'business_payment_receive';
    const newBalance = isIncome ? balance + params.amount : balance - params.amount;
    const tx: Transaction = {
      ...params,
      walletId: activeWalletId,
      method: (params as { method?: 'MANUAL' | 'QR' }).method ?? 'MANUAL',
      id: generateTransactionId(),
      timestamp: Date.now(),
      balanceBefore,
      balanceAfter: newBalance,
      exercice: currentExercice,
    };
    await insertTransaction(tx);
    await setWalletBalance(activeWalletId, newBalance);
    const nextTx = [tx, ...get().transactions];
    const byWallet = { ...get().transactionsByWallet, [activeWalletId]: nextTx };
    set({
      balance: newBalance,
      transactions: nextTx,
      transactionsByWallet: byWallet,
    });
    return { success: true };
  },

  freezeAmount: async (params) => {
    const { balance, freezeBalance, currentExercice, activeWalletId } = get();
    if (!activeWalletId) return { success: false, error: 'No wallet selected' };
    if (!get().isCurrentExerciceOpen()) {
      return { success: false, error: EXERCICE_CLOSED_ERROR };
    }
    const { amount, title, category } = params;
    if (amount <= 0) return { success: false, error: 'Invalid amount' };
    if (amount > balance) return { success: false, error: FROZEN_SPEND_ERROR };
    const newBalance = balance - amount;
    const newFreeze = freezeBalance + amount;
    const txId = generateTransactionId();
    const tx: Transaction = {
      id: txId,
      walletId: activeWalletId,
      amount,
      type: 'freeze',
      timestamp: Date.now(),
      balanceBefore: balance,
      balanceAfter: newBalance,
      category: (title ?? category ?? '').trim() || 'Freeze',
      method: 'MANUAL',
      exercice: currentExercice,
    };
    await insertTransaction(tx);
    await setWalletBalance(activeWalletId, newBalance);
    const nextTx = [tx, ...get().transactions];
    const byWallet = { ...get().transactionsByWallet, [activeWalletId]: nextTx };
    set({
      balance: newBalance,
      freezeBalance: newFreeze,
      transactions: nextTx,
      transactionsByWallet: byWallet,
    });
    return { success: true };
  },

  unfreezeAmount: async (amount: number) => {
    const { balance, freezeBalance, currentExercice, activeWalletId } = get();
    if (!activeWalletId) return { success: false, error: 'No wallet selected' };
    if (!get().isCurrentExerciceOpen()) {
      return { success: false, error: EXERCICE_CLOSED_ERROR };
    }
    if (amount <= 0) return { success: false, error: 'Invalid amount' };
    if (amount > freezeBalance) {
      return { success: false, error: 'Insufficient frozen balance' };
    }
    const newFreeze = freezeBalance - amount;
    const newBalance = balance + amount;
    const txId = generateTransactionId();
    const tx: Transaction = {
      id: txId,
      walletId: activeWalletId,
      amount,
      type: 'unfreeze',
      timestamp: Date.now(),
      balanceBefore: balance,
      balanceAfter: newBalance,
      category: 'Unfreeze',
      method: 'MANUAL',
      exercice: currentExercice,
    };
    await insertTransaction(tx);
    await setWalletBalance(activeWalletId, newBalance);
    const nextTx = [tx, ...get().transactions];
    const byWallet = { ...get().transactionsByWallet, [activeWalletId]: nextTx };
    set({
      balance: newBalance,
      freezeBalance: newFreeze,
      transactions: nextTx,
      transactionsByWallet: byWallet,
    });
    return { success: true };
  },

  spendFromFreeze: async (amount: number) => {
    const { freezeBalance, currentExercice, activeWalletId } = get();
    if (!activeWalletId) return { success: false, error: 'No wallet selected' };
    if (!get().isCurrentExerciceOpen()) {
      return { success: false, error: EXERCICE_CLOSED_ERROR };
    }
    if (amount <= 0) return { success: false, error: 'Invalid amount' };
    if (amount > freezeBalance) {
      return { success: false, error: 'Insufficient frozen balance' };
    }
    const newFreeze = freezeBalance - amount;
    const txId = generateTransactionId();
    const tx: Transaction = {
      id: txId,
      walletId: activeWalletId,
      amount,
      type: 'freeze_spend',
      timestamp: Date.now(),
      balanceBefore: get().balance,
      balanceAfter: get().balance,
      category: 'Spend from frozen',
      method: 'MANUAL',
      exercice: currentExercice,
    };
    await insertTransaction(tx);
    const nextTx = [tx, ...get().transactions];
    const byWallet = { ...get().transactionsByWallet, [activeWalletId]: nextTx };
    set({
      freezeBalance: newFreeze,
      transactions: nextTx,
      transactionsByWallet: byWallet,
    });
    return { success: true };
  },

  deleteTransaction: async (id: string) => {
    const { currentExercice, activeWalletId } = get();
    if (!activeWalletId) return { success: false, error: 'No wallet selected' };
    if (!get().isCurrentExerciceOpen()) {
      return { success: false, error: EXERCICE_CLOSED_ERROR };
    }
    const existing = await getTransactionById(id);
    if (!existing) return { success: false, error: 'Transaction not found' };
    if (existing.walletId !== activeWalletId) {
      return { success: false, error: 'Transaction belongs to another wallet' };
    }
    if (existing.exercice !== currentExercice) {
      return { success: false, error: 'Transaction belongs to another fiscal year' };
    }
    await deleteTransactionImage(existing.invoiceImage);
    await deleteTransactionById(id);
    const ordered = await getAllTransactionsOrderedByTimeAsc(currentExercice, activeWalletId);
    const filtered = ordered.filter((t) => t.id !== id);
    const snap = await getWalletSnapshot(activeWalletId, currentExercice - 1);
    const opening = snap?.closingBalance ?? 0;
    const { balance: newBalance, freezeBalance: newFreeze } =
      replayTransactions(filtered, opening);
    await setWalletBalance(activeWalletId, newBalance);
    const transactions = await getTransactionsByWalletAndExercice(activeWalletId, currentExercice);
    const byWallet = { ...get().transactionsByWallet, [activeWalletId]: transactions };
    set({ balance: newBalance, freezeBalance: newFreeze, transactions, transactionsByWallet: byWallet });
    return { success: true };
  },

  removeTransactionImage: async (txId: string) => {
    const { activeWalletId } = get();
    if (!activeWalletId) return { success: false, error: 'No wallet selected' };
    const existing = await getTransactionById(txId);
    if (!existing) return { success: false, error: 'Transaction not found' };
    if (existing.walletId !== activeWalletId) return { success: false, error: 'Transaction belongs to another wallet' };
    if (!existing.invoiceImage) return { success: true };
    await deleteTransactionImage(existing.invoiceImage);
    await updateTransactionInvoiceImage(txId, null);
    const txs = get().transactions.map((t) =>
      t.id === txId ? { ...t, invoiceImage: null } : t
    );
    const byWallet = { ...get().transactionsByWallet, [activeWalletId]: txs };
    const sel = get().selectedTransaction;
    set({
      transactions: txs,
      transactionsByWallet: byWallet,
      selectedTransaction: sel?.id === txId ? { ...sel, invoiceImage: null } : sel,
    });
    return { success: true };
  },

  setOverlay: (overlay) => set({ overlay }),
  setSelectedTransaction: (tx) => set({ selectedTransaction: tx }),
  setSelectedDebt: (debt) => set({ selectedDebt: debt }),
  refreshDebts: async () => {
    // This will trigger re-renders in components that use debt data
    // Components will refetch when they mount or when activeWalletId changes
  },

  resetData: async () => {
    await resetDatabase();
    const y = currentYear();
    const wallets = await getAllWallets();
    const settings = await getSettings();
    const activeWalletId = settings.activeWalletId;
    const byWallet: Record<string, Transaction[]> = {};
    for (const w of wallets) {
      byWallet[w.id] = [];
    }
    set({
      wallets,
      activeWalletId,
      balance: 0,
      freezeBalance: 0,
      transactions: [],
      transactionsByWallet: byWallet,
      currentExercice: y,
      exercices: [{ year: y, status: 'open' }],
    });
  },

  refreshTransactions: async () => {
    const cur = get().currentExercice;
    const activeWalletId = get().activeWalletId;
    const wallets = get().wallets;
    const byWallet = { ...get().transactionsByWallet };
    for (const w of wallets) {
      const txs = await getTransactionsByWalletAndExercice(w.id, cur);
      byWallet[w.id] = txs;
    }
    const transactions = activeWalletId ? (byWallet[activeWalletId] ?? []) : [];
    set({ transactions, transactionsByWallet: byWallet });
  },

  refreshWallets: async () => {
    const wallets = await getAllWallets();
    const cur = get().currentExercice;
    let activeWalletId = get().activeWalletId;
    if (wallets.length > 0 && (!activeWalletId || !wallets.some((w) => w.id === activeWalletId))) {
      activeWalletId = wallets[0].id;
      await setActiveWalletIdRepo(activeWalletId);
      set({ activeWalletId });
    }
    const byWallet: Record<string, Transaction[]> = {};
    for (const w of wallets) {
      const txs = await getTransactionsByWalletAndExercice(w.id, cur);
      byWallet[w.id] = txs;
    }
    const transactions = activeWalletId ? (byWallet[activeWalletId] ?? []) : [];
    const snap = activeWalletId ? await getWalletSnapshot(activeWalletId, cur - 1) : null;
    const ex = await getExercice(cur);
    const opening = snap?.closingBalance ?? 0;
    const isClosed = ex?.status === 'closed';
    const { balance, freezeBalance } = isClosed && ex
      ? { balance: snap?.closingBalance ?? ex.closingBalance, freezeBalance: snap?.freezeBalance ?? 0 }
      : replayTransactions(transactions, opening);
    set({
      wallets,
      transactions,
      transactionsByWallet: byWallet,
      balance,
      freezeBalance,
    });
  },

  seedDummyData: async () => {
    const activeWalletId = get().activeWalletId;
    if (!activeWalletId) return { success: false, error: 'No wallet selected' };
    try {
      const { count, finalBalance } = await seedDummyDataForWallet(activeWalletId);
      await get().refreshWallets();
      return { success: true, count, balance: finalBalance };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  },

  deleteWalletAndSwitch: async (id: string) => {
    const out = await deleteWallet(id);
    if (out.success === false) return out;
    const wallets = await getAllWallets();
    const activeId = get().activeWalletId;
    if (activeId === id && wallets.length > 0) {
      await setActiveWalletIdRepo(wallets[0].id);
      set({ activeWalletId: wallets[0].id });
    } else if (activeId === id) {
      set({
        activeWalletId: '',
        wallets: [],
        transactions: [],
        transactionsByWallet: {},
        balance: 0,
        freezeBalance: 0,
      });
    }
    await get().refreshWallets();
    return { success: true };
  },

  freezeQrTransfer: async (params) => {
    const { balance, freezeBalance, activeWalletId } = get();
    if (!activeWalletId) return { success: false, error: 'No wallet selected' };
    if (!get().isCurrentExerciceOpen()) {
      return { success: false, error: EXERCICE_CLOSED_ERROR };
    }
    if (params.amount <= 0) return { success: false, error: 'Invalid amount' };
    if (params.amount > balance) return { success: false, error: FROZEN_SPEND_ERROR };
    const newBalance = balance - params.amount;
    const newFreeze = freezeBalance + params.amount;
    const createdAt = Date.now();
    const f = {
      id: `qr_${params.txId}`,
      walletId: activeWalletId,
      title: `QR: ${params.amount} ${params.currency}`,
      amount: params.amount,
      category: 'qr_transfer',
      createdAt,
    };
    await insertFrozenFund(f);
    await insertQrTransfer({
      txId: params.txId,
      amount: params.amount,
      note: params.note || null,
      currency: params.currency,
      senderName: params.senderName,
      senderId: params.senderId,
      status: 'pending',
      createdAt,
    });
    await setWalletBalance(activeWalletId, newBalance);
    set({ balance: newBalance, freezeBalance: newFreeze });
    return { success: true };
  },

  cancelQrTransfer: async (txId: string) => {
    const qr = await getQrTransferByTxId(txId);
    if (!qr || qr.status !== 'pending') return;
    const { balance, freezeBalance, activeWalletId } = get();
    if (!activeWalletId) return;
    const newFreeze = freezeBalance - qr.amount;
    const newBalance = balance + qr.amount;
    await deleteFrozenFund(`qr_${txId}`);
    await updateQrTransferStatus(txId, 'cancelled');
    await setWalletBalance(activeWalletId, newBalance);
    set({ balance: newBalance, freezeBalance: newFreeze });
  },

  confirmQrSend: async (txId: string, categoryId?: string | null, invoiceImage?: string | null) => {
    const { balance, freezeBalance, currentExercice, activeWalletId } = get();
    if (!activeWalletId) return { success: false, error: 'No wallet selected' };
    if (!get().isCurrentExerciceOpen()) {
      return { success: false, error: EXERCICE_CLOSED_ERROR };
    }
    const qr = await getQrTransferByTxId(txId);
    if (!qr || qr.status !== 'pending') {
      return { success: false, error: 'Invalid or already completed transfer' };
    }
    if (qr.amount > freezeBalance) {
      return { success: false, error: 'Insufficient frozen balance' };
    }
    const newFreeze = freezeBalance - qr.amount;
    const tx: Transaction = {
      id: txId,
      walletId: activeWalletId,
      amount: qr.amount,
      type: 'send',
      timestamp: Date.now(),
      balanceBefore: balance,
      balanceAfter: balance,
      receiver: 'QR transfer',
      sender: undefined,
      category: qr.note ?? '',
      categoryId: categoryId ?? undefined,
      method: 'QR',
      senderId: qr.senderId,
      receiverId: undefined,
      exercice: currentExercice,
      invoiceImage: invoiceImage ?? undefined,
    };
    await insertTransaction(tx);
    await deleteFrozenFund(`qr_${txId}`);
    await updateQrTransferStatus(txId, 'completed');
    const nextTx = [tx, ...get().transactions];
    const byWallet = { ...get().transactionsByWallet, [activeWalletId]: nextTx };
    set({
      freezeBalance: newFreeze,
      transactions: nextTx,
      transactionsByWallet: byWallet,
    });
    return { success: true };
  },

  addReceiveFromQR: async (payload, categoryId?: string | null) => {
    const { balance, currentExercice, activeWalletId } = get();
    if (!activeWalletId) return { success: false, error: 'No wallet selected' };
    if (!get().isCurrentExerciceOpen()) {
      return { success: false, error: EXERCICE_CLOSED_ERROR };
    }
    const existing = await getTransactionById(payload.txId);
    if (existing) return { success: false, error: 'Transaction already received' };
    const balanceBefore = balance;
    const newBalance = balance + payload.amount;
    const tx: Transaction = {
      id: payload.txId,
      walletId: activeWalletId,
      amount: payload.amount,
      type: 'receive',
      timestamp: Date.now(),
      balanceBefore,
      balanceAfter: newBalance,
      sender: payload.senderName,
      receiver: undefined,
      category: payload.note ?? '',
      categoryId: categoryId ?? undefined,
      method: 'QR',
      senderId: payload.senderId,
      receiverId: undefined,
      exercice: currentExercice,
    };
    await insertTransaction(tx);
    await setWalletBalance(activeWalletId, newBalance);
    const nextTx = [tx, ...get().transactions];
    const byWallet = { ...get().transactionsByWallet, [activeWalletId]: nextTx };
    set({
      balance: newBalance,
      transactions: nextTx,
      transactionsByWallet: byWallet,
    });
    return { success: true };
  },

  executeBusinessPaymentAsClient: async (request) => {
    const { activeWalletId } = get();
    if (!activeWalletId) return { success: false, error: 'No wallet selected' };
    if (!get().isCurrentExerciceOpen()) {
      return { success: false, error: EXERCICE_CLOSED_ERROR };
    }
    const out = await executeBusinessPaymentAsClientRepo(request, activeWalletId);
    if (out.success === false) return out;
    await get().refreshTransactions();
    return out;
  },

  completeBusinessPaymentAsMerchant: async (confirm) => {
    const { activeWalletId } = get();
    if (!activeWalletId) return { success: false, error: 'No wallet selected' };
    if (!get().isCurrentExerciceOpen()) {
      return { success: false, error: EXERCICE_CLOSED_ERROR };
    }
    const out = await completeBusinessPaymentAsMerchantRepo(confirm, activeWalletId);
    if (out.success === false) return out;
    await get().refreshTransactions();
    return out;
  },

  ingestFamilyShare: async (payload) => {
    const { activeWalletId, wallets } = get();
    if (!activeWalletId) return { success: false, error: 'No wallet selected' };
    const activeWallet = wallets.find((w) => w.id === activeWalletId);
    if (!activeWallet || activeWallet.type !== 'family') {
      return { success: false, error: 'Only family wallets can receive shared transactions' };
    }
    const expectedName = (payload.wallet_name ?? '').trim();
    if (!expectedName || activeWallet.name.trim() !== expectedName) {
      return { success: false, error: i18n.t('familyShare.sameWalletRequired') };
    }
    if (activeWallet.currency !== payload.currency) {
      return { success: false, error: 'Currency must match family wallet' };
    }
    if (payload.expires_at < Date.now()) {
      return { success: false, error: 'QR expired' };
    }
    try {
      await insertSharedView({
        targetFamilyWalletId: activeWalletId,
        sourceWalletId: payload.wallet_id,
        ownerAlias: payload.owner_alias,
        currency: payload.currency,
        sharedData: JSON.stringify(payload.shared_transactions),
        expiresAt: payload.expires_at,
      });
      set((s) => ({ sharedViewRefreshTrigger: (s.sharedViewRefreshTrigger ?? 0) + 1 }));
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  },
}));
