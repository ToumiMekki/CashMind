export const CREATE_SETTINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    language TEXT NOT NULL DEFAULT 'ar',
    hasOnboarded INTEGER NOT NULL DEFAULT 0
  );
`;

export const CREATE_WALLET_TABLE = `
  CREATE TABLE IF NOT EXISTS wallet (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    balance REAL NOT NULL DEFAULT 0
  );
`;

export const CREATE_TRANSACTIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('send', 'receive')),
    timestamp INTEGER NOT NULL,
    balanceBefore REAL NOT NULL,
    balanceAfter REAL NOT NULL,
    receiver TEXT,
    sender TEXT,
    category TEXT
  );
`;

export const CREATE_INDEX_TIMESTAMP = `
  CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
`;

export const CREATE_INDEX_TYPE = `
  CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
`;

export const CREATE_FROZEN_FUNDS_TABLE = `
  CREATE TABLE IF NOT EXISTS frozen_funds (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    isFrozen INTEGER NOT NULL DEFAULT 1,
    createdAt INTEGER NOT NULL
  );
`;

export const CREATE_DEVICE_TABLE = `
  CREATE TABLE IF NOT EXISTS device (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    deviceId TEXT NOT NULL,
    senderName TEXT NOT NULL DEFAULT 'User'
  );
`;

export const CREATE_QR_TRANSFERS_TABLE = `
  CREATE TABLE IF NOT EXISTS qr_transfers (
    txId TEXT PRIMARY KEY,
    amount REAL NOT NULL,
    note TEXT,
    currency TEXT NOT NULL,
    senderName TEXT NOT NULL,
    senderId TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled')),
    createdAt INTEGER NOT NULL
  );
`;

export const CREATE_SCHEMA_MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (id INTEGER PRIMARY KEY);
`;

export const MIGRATION_ADD_METHOD = `
  ALTER TABLE transactions ADD COLUMN method TEXT NOT NULL DEFAULT 'MANUAL';
`;
export const MIGRATION_ADD_SENDER_ID = `
  ALTER TABLE transactions ADD COLUMN senderId TEXT;
`;
export const MIGRATION_ADD_RECEIVER_ID = `
  ALTER TABLE transactions ADD COLUMN receiverId TEXT;
`;

export const MIGRATION_ADD_SETTINGS_THEME = `
  ALTER TABLE settings ADD COLUMN theme TEXT NOT NULL DEFAULT 'system';
`;

export const MIGRATION_ADD_WALLET_FREEZE_BALANCE = `
  ALTER TABLE wallet ADD COLUMN freeze_balance REAL NOT NULL DEFAULT 0;
`;

export const MIGRATION_EXTEND_TX_TYPES = `
  CREATE TABLE IF NOT EXISTS _tx_new (
    id TEXT PRIMARY KEY,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('send', 'receive', 'freeze', 'unfreeze', 'freeze_spend')),
    timestamp INTEGER NOT NULL,
    balanceBefore REAL NOT NULL,
    balanceAfter REAL NOT NULL,
    receiver TEXT,
    sender TEXT,
    category TEXT,
    method TEXT NOT NULL DEFAULT 'MANUAL',
    senderId TEXT,
    receiverId TEXT
  );
`;
export const MIGRATION_6_COPY = `INSERT INTO _tx_new SELECT id, amount, type, timestamp, balanceBefore, balanceAfter, receiver, sender, category, method, senderId, receiverId FROM transactions`;
export const MIGRATION_6_DROP = `DROP TABLE transactions`;
export const MIGRATION_6_RENAME = `ALTER TABLE _tx_new RENAME TO transactions`;
export const MIGRATION_6_IDX_TS = `CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp)`;
export const MIGRATION_6_IDX_TYPE = `CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)`;

/** Fiscal year (exercice) — ERP-style accounting container per year */
export const CREATE_EXERCICES_TABLE = `
  CREATE TABLE IF NOT EXISTS exercices (
    year INTEGER PRIMARY KEY,
    opening_balance REAL NOT NULL DEFAULT 0,
    closing_balance REAL NOT NULL DEFAULT 0,
    freeze_balance REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('open', 'closed')) DEFAULT 'open',
    closed_at INTEGER
  );
`;

export const MIGRATION_ADD_SETTINGS_CURRENT_EXERCICE = `
  ALTER TABLE settings ADD COLUMN current_exercice INTEGER;
`;

export const MIGRATION_ADD_TX_EXERCICE = `
  ALTER TABLE transactions ADD COLUMN exercice INTEGER;
`;

export const MIGRATION_EXERCICE_IDX = `
  CREATE INDEX IF NOT EXISTS idx_transactions_exercice ON transactions(exercice);
`;

/** Backfill exercice for existing transactions (use local current year) */
export const MIGRATION_BACKFILL_TX_EXERCICE = `
  UPDATE transactions SET exercice = cast(strftime('%Y', datetime('now', 'localtime')) as INTEGER) WHERE exercice IS NULL;
`;

/** Ensure current-year exercice exists */
export const MIGRATION_SEED_CURRENT_EXERCICE = `
  INSERT OR IGNORE INTO exercices (year, opening_balance, closing_balance, freeze_balance, status)
  VALUES (cast(strftime('%Y', datetime('now', 'localtime')) as INTEGER), 0, 0, 0, 'open');
`;

/** Set current_exercice in settings if null */
export const MIGRATION_SET_CURRENT_EXERCICE = `
  UPDATE settings SET current_exercice = cast(strftime('%Y', datetime('now', 'localtime')) as INTEGER) WHERE id = 1 AND current_exercice IS NULL;
`;

export const MIGRATION_ADD_SETTINGS_THEME_COLOR = `
  ALTER TABLE settings ADD COLUMN theme_color TEXT;
`;

/** Multi-wallet: wallets table */
export const CREATE_WALLETS_TABLE = `
  CREATE TABLE IF NOT EXISTS wallets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    currency TEXT NOT NULL,
    balance REAL NOT NULL DEFAULT 0,
    type TEXT NOT NULL CHECK (type IN ('personal', 'business')) DEFAULT 'personal',
    exchange_rate_to_dzd REAL,
    created_at INTEGER NOT NULL
  );
`;

/** Multi-wallet: per-wallet per-year snapshots for exercice close/open */
export const CREATE_WALLET_EXERCICE_SNAPSHOTS_TABLE = `
  CREATE TABLE IF NOT EXISTS wallet_exercice_snapshots (
    wallet_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    closing_balance REAL NOT NULL DEFAULT 0,
    freeze_balance REAL NOT NULL DEFAULT 0,
    PRIMARY KEY (wallet_id, year),
    FOREIGN KEY (wallet_id) REFERENCES wallets(id)
  );
`;

export const MIGRATION_ADD_SETTINGS_ACTIVE_WALLET_ID = `
  ALTER TABLE settings ADD COLUMN active_wallet_id TEXT;
`;

/** Add wallet_id to frozen_funds */
export const MIGRATION_ADD_FROZEN_FUNDS_WALLET_ID = `
  ALTER TABLE frozen_funds ADD COLUMN wallet_id TEXT;
`;

/** Transactions: add wallet_id, transfer fields; extend type. Recreate table. */
export const MIGRATION_MULTI_WALLET_TX_CREATE = `
  CREATE TABLE IF NOT EXISTS _tx_mw (
    id TEXT PRIMARY KEY,
    wallet_id TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('send', 'receive', 'freeze', 'unfreeze', 'freeze_spend', 'transfer_in', 'transfer_out')),
    timestamp INTEGER NOT NULL,
    balance_before REAL NOT NULL,
    balance_after REAL NOT NULL,
    receiver TEXT,
    sender TEXT,
    category TEXT,
    method TEXT NOT NULL DEFAULT 'MANUAL',
    sender_id TEXT,
    receiver_id TEXT,
    exercice INTEGER NOT NULL,
    transfer_id TEXT,
    related_wallet_id TEXT,
    exchange_rate_used REAL
  );
`;

/** Default wallet id used when migrating existing data into multi-wallet */
export const DEFAULT_MIGRATION_WALLET_ID = 'wallet_default_dzd';

export const MIGRATION_MULTI_WALLET_TX_COPY = `
  INSERT INTO _tx_mw (id, wallet_id, amount, type, timestamp, balance_before, balance_after, receiver, sender, category, method, sender_id, receiver_id, exercice, transfer_id, related_wallet_id, exchange_rate_used)
  SELECT id, '${DEFAULT_MIGRATION_WALLET_ID}', amount, type, timestamp, balanceBefore, balanceAfter, receiver, sender, category, method, senderId, receiverId, exercice, NULL, NULL, NULL
  FROM transactions;
`;

export const MIGRATION_MULTI_WALLET_TX_DROP = `DROP TABLE transactions;`;
export const MIGRATION_MULTI_WALLET_TX_RENAME = `ALTER TABLE _tx_mw RENAME TO transactions;`;
export const MIGRATION_MULTI_WALLET_TX_IDX_TS = `CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);`;
export const MIGRATION_MULTI_WALLET_TX_IDX_TYPE = `CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);`;
export const MIGRATION_MULTI_WALLET_TX_IDX_EXERCICE = `CREATE INDEX IF NOT EXISTS idx_transactions_exercice ON transactions(exercice);`;
export const MIGRATION_MULTI_WALLET_TX_IDX_WALLET = `CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);`;

/** Seed default DZD wallet from legacy wallet table when migrating to multi-wallet */
export const MIGRATION_SEED_DEFAULT_WALLET = `
  INSERT INTO wallets (id, name, currency, balance, type, exchange_rate_to_dzd, created_at)
  SELECT '${DEFAULT_MIGRATION_WALLET_ID}', 'Main (DZD)', 'DZD',
    COALESCE((SELECT balance FROM wallet WHERE id = 1 LIMIT 1), 0),
    'personal', NULL, cast(strftime('%s', 'now') as INTEGER) * 1000
  WHERE NOT EXISTS (SELECT 1 FROM wallets LIMIT 1);
`;

/** Backfill frozen_funds.wallet_id for existing rows */
export const MIGRATION_BACKFILL_FROZEN_FUNDS_WALLET_ID = `
  UPDATE frozen_funds SET wallet_id = '${DEFAULT_MIGRATION_WALLET_ID}' WHERE wallet_id IS NULL;
`;

/** Set active_wallet_id in settings when migrating */
export const MIGRATION_SET_ACTIVE_WALLET_ID = `
  UPDATE settings SET active_wallet_id = '${DEFAULT_MIGRATION_WALLET_ID}' WHERE id = 1 AND active_wallet_id IS NULL;
`;

/** Extend transactions type CHECK for business_payment_send / business_payment_receive */
export const MIGRATION_BUSINESS_PAYMENT_TX_TYPES = `
  CREATE TABLE IF NOT EXISTS _tx_bp (
    id TEXT PRIMARY KEY,
    wallet_id TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('send', 'receive', 'freeze', 'unfreeze', 'freeze_spend', 'transfer_in', 'transfer_out', 'business_payment_send', 'business_payment_receive')),
    timestamp INTEGER NOT NULL,
    balance_before REAL NOT NULL,
    balance_after REAL NOT NULL,
    receiver TEXT,
    sender TEXT,
    category TEXT,
    method TEXT NOT NULL DEFAULT 'MANUAL',
    sender_id TEXT,
    receiver_id TEXT,
    exercice INTEGER NOT NULL,
    transfer_id TEXT,
    related_wallet_id TEXT,
    exchange_rate_used REAL
  );
`;

export const MIGRATION_BUSINESS_PAYMENT_TX_COPY = `
  INSERT INTO _tx_bp SELECT id, wallet_id, amount, type, timestamp, balance_before, balance_after, receiver, sender, category, method, sender_id, receiver_id, exercice, transfer_id, related_wallet_id, exchange_rate_used FROM transactions;
`;

export const MIGRATION_BUSINESS_PAYMENT_TX_DROP = `DROP TABLE transactions;`;
export const MIGRATION_BUSINESS_PAYMENT_TX_RENAME = `ALTER TABLE _tx_bp RENAME TO transactions;`;
export const MIGRATION_BUSINESS_PAYMENT_TX_IDX_TS = `CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);`;
export const MIGRATION_BUSINESS_PAYMENT_TX_IDX_TYPE = `CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);`;
export const MIGRATION_BUSINESS_PAYMENT_TX_IDX_EXERCICE = `CREATE INDEX IF NOT EXISTS idx_transactions_exercice ON transactions(exercice);`;
export const MIGRATION_BUSINESS_PAYMENT_TX_IDX_WALLET = `CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);`;

/** Fallback for PIN hash when Keychain/Keystore fails on some Android devices */
export const MIGRATION_AUTH_PREFS_TABLE = `
  CREATE TABLE IF NOT EXISTS auth_prefs (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`;

/** Family Wallet: extend wallets type CHECK to include 'family' */
export const MIGRATION_WALLET_FAMILY_TYPE = `
  CREATE TABLE IF NOT EXISTS _wallets_family (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    currency TEXT NOT NULL,
    balance REAL NOT NULL DEFAULT 0,
    type TEXT NOT NULL CHECK (type IN ('personal', 'business', 'family')) DEFAULT 'personal',
    exchange_rate_to_dzd REAL,
    created_at INTEGER NOT NULL
  );
`;
export const MIGRATION_WALLET_FAMILY_COPY = `
  INSERT INTO _wallets_family SELECT id, name, currency, balance, type, exchange_rate_to_dzd, created_at FROM wallets;
`;
export const MIGRATION_WALLET_FAMILY_DROP = `DROP TABLE wallets;`;
export const MIGRATION_WALLET_FAMILY_RENAME = `ALTER TABLE _wallets_family RENAME TO wallets;`;

/** Per-wallet theme color (uses ThemeColorId from color palettes) */
export const MIGRATION_ADD_WALLET_THEME_COLOR = `
  ALTER TABLE wallets ADD COLUMN theme_color_id TEXT;
`;

/** Family Wallet: shared_transactions_view for read-only shared data from other members */
export const MIGRATION_SHARED_TRANSACTIONS_VIEW_TABLE = `
  CREATE TABLE IF NOT EXISTS shared_transactions_view (
    id TEXT PRIMARY KEY,
    target_family_wallet_id TEXT NOT NULL,
    source_wallet_id TEXT NOT NULL,
    owner_alias TEXT NOT NULL,
    currency TEXT NOT NULL,
    shared_data TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
`;
export const MIGRATION_SHARED_VIEW_IDX = `
  CREATE INDEX IF NOT EXISTS idx_shared_view_target ON shared_transactions_view(target_family_wallet_id);
`;
export const MIGRATION_SHARED_VIEW_EXPIRY_IDX = `
  CREATE INDEX IF NOT EXISTS idx_shared_view_expires ON shared_transactions_view(expires_at);
`;

/** Splash Category: per-wallet categories for Pay/Receive flows */
export const MIGRATION_CATEGORIES_TABLE = `
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('pay', 'receive', 'both')),
    wallet_id TEXT NOT NULL
  );
`;
export const MIGRATION_CATEGORIES_IDX = `
  CREATE INDEX IF NOT EXISTS idx_categories_wallet ON categories(wallet_id);
`;

export const MIGRATION_ADD_TX_CATEGORY_ID = `
  ALTER TABLE transactions ADD COLUMN category_id TEXT;
`;

export const MIGRATION_ADD_TX_INVOICE_IMAGE = `
  ALTER TABLE transactions ADD COLUMN invoice_image TEXT;
`;

/** Sound effects: global toggle, volume (0–1), mute in silent mode, optional amount keypad taps */
export const MIGRATION_ADD_SETTINGS_SOUND = `
  ALTER TABLE settings ADD COLUMN sounds_enabled INTEGER NOT NULL DEFAULT 1;
`;
export const MIGRATION_ADD_SETTINGS_SOUND_VOLUME = `
  ALTER TABLE settings ADD COLUMN sound_volume REAL NOT NULL DEFAULT 0.4;
`;
export const MIGRATION_ADD_SETTINGS_MUTE_IN_SILENT = `
  ALTER TABLE settings ADD COLUMN mute_in_silent_mode INTEGER NOT NULL DEFAULT 1;
`;
export const MIGRATION_ADD_SETTINGS_AMOUNT_INPUT_SOUND = `
  ALTER TABLE settings ADD COLUMN amount_input_sound INTEGER NOT NULL DEFAULT 0;
`;

export const CREATE_DEBTS_TABLE = `
  CREATE TABLE IF NOT EXISTS debts (
    id TEXT PRIMARY KEY,
    wallet_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('owe', 'owed')),
    person_name TEXT NOT NULL,
    original_amount REAL NOT NULL,
    remaining_amount REAL NOT NULL,
    description TEXT,
    created_at INTEGER NOT NULL,
    due_date INTEGER,
    status TEXT NOT NULL CHECK (status IN ('active', 'paid', 'partial')) DEFAULT 'active',
    related_transaction_ids TEXT NOT NULL DEFAULT '[]'
  );
`;

export const CREATE_DEBTS_INDEX_WALLET = `
  CREATE INDEX IF NOT EXISTS idx_debts_wallet_id ON debts(wallet_id);
`;

export const CREATE_DEBTS_INDEX_STATUS = `
  CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
`;

export const ALL_MIGRATIONS = [
  CREATE_SETTINGS_TABLE,
  CREATE_WALLET_TABLE,
  CREATE_TRANSACTIONS_TABLE,
  CREATE_INDEX_TIMESTAMP,
  CREATE_INDEX_TYPE,
  CREATE_FROZEN_FUNDS_TABLE,
  CREATE_DEVICE_TABLE,
  CREATE_QR_TRANSFERS_TABLE,
  CREATE_SCHEMA_MIGRATIONS_TABLE,
  CREATE_DEBTS_TABLE,
  CREATE_DEBTS_INDEX_WALLET,
  CREATE_DEBTS_INDEX_STATUS,
];
