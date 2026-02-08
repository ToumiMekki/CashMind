import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';
import {
  ALL_MIGRATIONS,
  MIGRATION_ADD_METHOD,
  MIGRATION_ADD_SENDER_ID,
  MIGRATION_ADD_RECEIVER_ID,
  MIGRATION_ADD_SETTINGS_THEME,
  MIGRATION_ADD_WALLET_FREEZE_BALANCE,
  MIGRATION_EXTEND_TX_TYPES,
  MIGRATION_6_COPY,
  MIGRATION_6_DROP,
  MIGRATION_6_RENAME,
  MIGRATION_6_IDX_TS,
  MIGRATION_6_IDX_TYPE,
  CREATE_EXERCICES_TABLE,
  MIGRATION_ADD_SETTINGS_CURRENT_EXERCICE,
  MIGRATION_ADD_TX_EXERCICE,
  MIGRATION_EXERCICE_IDX,
  MIGRATION_BACKFILL_TX_EXERCICE,
  MIGRATION_SEED_CURRENT_EXERCICE,
  MIGRATION_SET_CURRENT_EXERCICE,
  MIGRATION_ADD_SETTINGS_THEME_COLOR,
  CREATE_WALLETS_TABLE,
  CREATE_WALLET_EXERCICE_SNAPSHOTS_TABLE,
  MIGRATION_ADD_SETTINGS_ACTIVE_WALLET_ID,
  MIGRATION_ADD_FROZEN_FUNDS_WALLET_ID,
  MIGRATION_SEED_DEFAULT_WALLET,
  MIGRATION_MULTI_WALLET_TX_CREATE,
  MIGRATION_MULTI_WALLET_TX_COPY,
  MIGRATION_MULTI_WALLET_TX_DROP,
  MIGRATION_MULTI_WALLET_TX_RENAME,
  MIGRATION_MULTI_WALLET_TX_IDX_TS,
  MIGRATION_MULTI_WALLET_TX_IDX_TYPE,
  MIGRATION_MULTI_WALLET_TX_IDX_EXERCICE,
  MIGRATION_MULTI_WALLET_TX_IDX_WALLET,
  MIGRATION_BACKFILL_FROZEN_FUNDS_WALLET_ID,
  MIGRATION_SET_ACTIVE_WALLET_ID,
  DEFAULT_MIGRATION_WALLET_ID,
  MIGRATION_BUSINESS_PAYMENT_TX_TYPES,
  MIGRATION_BUSINESS_PAYMENT_TX_COPY,
  MIGRATION_BUSINESS_PAYMENT_TX_DROP,
  MIGRATION_BUSINESS_PAYMENT_TX_RENAME,
  MIGRATION_BUSINESS_PAYMENT_TX_IDX_TS,
  MIGRATION_BUSINESS_PAYMENT_TX_IDX_TYPE,
  MIGRATION_BUSINESS_PAYMENT_TX_IDX_EXERCICE,
  MIGRATION_BUSINESS_PAYMENT_TX_IDX_WALLET,
  MIGRATION_AUTH_PREFS_TABLE,
  MIGRATION_WALLET_FAMILY_TYPE,
  MIGRATION_WALLET_FAMILY_COPY,
  MIGRATION_WALLET_FAMILY_DROP,
  MIGRATION_WALLET_FAMILY_RENAME,
  MIGRATION_SHARED_TRANSACTIONS_VIEW_TABLE,
  MIGRATION_SHARED_VIEW_IDX,
  MIGRATION_SHARED_VIEW_EXPIRY_IDX,
  MIGRATION_CATEGORIES_TABLE,
  MIGRATION_CATEGORIES_IDX,
  MIGRATION_ADD_TX_CATEGORY_ID,
  MIGRATION_ADD_WALLET_THEME_COLOR,
  MIGRATION_ADD_TX_INVOICE_IMAGE,
  MIGRATION_ADD_SETTINGS_SOUND,
  MIGRATION_ADD_SETTINGS_SOUND_VOLUME,
  MIGRATION_ADD_SETTINGS_MUTE_IN_SILENT,
  MIGRATION_ADD_SETTINGS_AMOUNT_INPUT_SOUND,
} from './schema';

SQLite.DEBUG(false);
SQLite.enablePromise(true);

let db: SQLiteDatabase | null = null;

async function runMigration(db: SQLiteDatabase, id: number, sql: string): Promise<void> {
  const [r] = await db.executeSql('SELECT 1 FROM schema_migrations WHERE id = ?', [id]);
  if (r.rows.length > 0) return;
  await db.executeSql(sql);
  await db.executeSql('INSERT INTO schema_migrations (id) VALUES (?)', [id]);
}

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabase({
    name: 'cashmind.db',
    location: 'default',
  });
  for (const sql of ALL_MIGRATIONS) {
    await db.executeSql(sql);
  }
  await runMigration(db, 1, MIGRATION_ADD_METHOD);
  await runMigration(db, 2, MIGRATION_ADD_SENDER_ID);
  await runMigration(db, 3, MIGRATION_ADD_RECEIVER_ID);
  await runMigration(db, 4, MIGRATION_ADD_SETTINGS_THEME);
  await runMigration(db, 5, MIGRATION_ADD_WALLET_FREEZE_BALANCE);
  await runMigration(db, 6, MIGRATION_EXTEND_TX_TYPES);
  await runMigration(db, 7, MIGRATION_6_COPY);
  await runMigration(db, 8, MIGRATION_6_DROP);
  await runMigration(db, 9, MIGRATION_6_RENAME);
  await runMigration(db, 10, MIGRATION_6_IDX_TS);
  await runMigration(db, 11, MIGRATION_6_IDX_TYPE);
  await runMigration(db, 12, CREATE_EXERCICES_TABLE);
  await runMigration(db, 13, MIGRATION_ADD_SETTINGS_CURRENT_EXERCICE);
  await runMigration(db, 14, MIGRATION_ADD_TX_EXERCICE);
  await runMigration(db, 15, MIGRATION_EXERCICE_IDX);
  await runMigration(db, 16, MIGRATION_BACKFILL_TX_EXERCICE);
  await runMigration(db, 17, MIGRATION_SEED_CURRENT_EXERCICE);
  await runMigration(db, 18, MIGRATION_SET_CURRENT_EXERCICE);
  await runMigration(db, 19, MIGRATION_ADD_SETTINGS_THEME_COLOR);
  await runMigration(db, 20, CREATE_WALLETS_TABLE);
  await runMigration(db, 21, CREATE_WALLET_EXERCICE_SNAPSHOTS_TABLE);
  await runMigration(db, 22, MIGRATION_ADD_SETTINGS_ACTIVE_WALLET_ID);
  await runMigration(db, 23, MIGRATION_ADD_FROZEN_FUNDS_WALLET_ID);
  await runMigration(db, 24, MIGRATION_SEED_DEFAULT_WALLET);
  await runMigration(db, 25, MIGRATION_MULTI_WALLET_TX_CREATE);
  await runMigration(db, 26, MIGRATION_MULTI_WALLET_TX_COPY);
  await runMigration(db, 27, MIGRATION_MULTI_WALLET_TX_DROP);
  await runMigration(db, 28, MIGRATION_MULTI_WALLET_TX_RENAME);
  await runMigration(db, 29, MIGRATION_MULTI_WALLET_TX_IDX_TS);
  await runMigration(db, 30, MIGRATION_MULTI_WALLET_TX_IDX_TYPE);
  await runMigration(db, 31, MIGRATION_MULTI_WALLET_TX_IDX_EXERCICE);
  await runMigration(db, 32, MIGRATION_MULTI_WALLET_TX_IDX_WALLET);
  await runMigration(db, 33, MIGRATION_BACKFILL_FROZEN_FUNDS_WALLET_ID);
  await runMigration(db, 34, MIGRATION_SET_ACTIVE_WALLET_ID);
  await runMigration(db, 35, MIGRATION_BUSINESS_PAYMENT_TX_TYPES);
  await runMigration(db, 36, MIGRATION_BUSINESS_PAYMENT_TX_COPY);
  await runMigration(db, 37, MIGRATION_BUSINESS_PAYMENT_TX_DROP);
  await runMigration(db, 38, MIGRATION_BUSINESS_PAYMENT_TX_RENAME);
  await runMigration(db, 39, MIGRATION_BUSINESS_PAYMENT_TX_IDX_TS);
  await runMigration(db, 40, MIGRATION_BUSINESS_PAYMENT_TX_IDX_TYPE);
  await runMigration(db, 41, MIGRATION_BUSINESS_PAYMENT_TX_IDX_EXERCICE);
  await runMigration(db, 42, MIGRATION_BUSINESS_PAYMENT_TX_IDX_WALLET);
  await runMigration(db, 43, MIGRATION_AUTH_PREFS_TABLE);
  await runMigration(db, 44, MIGRATION_WALLET_FAMILY_TYPE);
  await runMigration(db, 45, MIGRATION_WALLET_FAMILY_COPY);
  await runMigration(db, 46, MIGRATION_WALLET_FAMILY_DROP);
  await runMigration(db, 47, MIGRATION_WALLET_FAMILY_RENAME);
  await runMigration(db, 48, MIGRATION_SHARED_TRANSACTIONS_VIEW_TABLE);
  await runMigration(db, 49, MIGRATION_SHARED_VIEW_IDX);
  await runMigration(db, 50, MIGRATION_SHARED_VIEW_EXPIRY_IDX);
  await runMigration(db, 51, MIGRATION_CATEGORIES_TABLE);
  await runMigration(db, 52, MIGRATION_CATEGORIES_IDX);
  await runMigration(db, 53, MIGRATION_ADD_TX_CATEGORY_ID);
  await runMigration(db, 54, MIGRATION_ADD_WALLET_THEME_COLOR);
  await runMigration(db, 55, MIGRATION_ADD_TX_INVOICE_IMAGE);
  await runMigration(db, 56, MIGRATION_ADD_SETTINGS_SOUND);
  await runMigration(db, 57, MIGRATION_ADD_SETTINGS_SOUND_VOLUME);
  await runMigration(db, 58, MIGRATION_ADD_SETTINGS_MUTE_IN_SILENT);
  await runMigration(db, 59, MIGRATION_ADD_SETTINGS_AMOUNT_INPUT_SOUND);
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
}

export async function resetDatabase(): Promise<void> {
  const database = await getDatabase();
  await database.executeSql('DELETE FROM transactions');
  await database.executeSql('DELETE FROM frozen_funds');
  await database.executeSql('DELETE FROM qr_transfers');
  await database.executeSql('DELETE FROM wallet_exercice_snapshots');
  await database.executeSql('UPDATE wallets SET balance = 0');
  await database.executeSql(
    'INSERT OR REPLACE INTO wallet (id, balance, freeze_balance) VALUES (1, 0, 0)'
  );
  const y = new Date().getFullYear();
  await database.executeSql('DELETE FROM exercices');
  await database.executeSql(
    `INSERT INTO exercices (year, opening_balance, closing_balance, freeze_balance, status) VALUES (?, 0, 0, 0, 'open')`,
    [y]
  );
  await database.executeSql(
    'UPDATE settings SET current_exercice = ?, active_wallet_id = ? WHERE id = 1',
    [y, DEFAULT_MIGRATION_WALLET_ID]
  );
  await database.executeSql('DELETE FROM auth_prefs');
  await database.executeSql('DELETE FROM shared_transactions_view');
  await database.executeSql('DELETE FROM categories');
}
