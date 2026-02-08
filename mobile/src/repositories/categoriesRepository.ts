import { getDatabase } from '../database';
import type { Category, CategoryType } from '../database/types';
import { generateCategoryId } from '../utils/transactionId';

const DEFAULT_CATEGORIES: Array<{ name: string; icon: string; color: string; type: CategoryType }> = [
  { name: 'Food', icon: '🍔', color: '#F97316', type: 'both' },
  { name: 'Transport', icon: '🚕', color: '#3B82F6', type: 'both' },
  { name: 'Shopping', icon: '🛍️', color: '#EC4899', type: 'pay' },
  { name: 'Salary', icon: '💼', color: '#22C55E', type: 'receive' },
  { name: 'Gift', icon: '🎁', color: '#A855F7', type: 'both' },
];

function rowToCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    name: row.name as string,
    icon: row.icon as string,
    color: row.color as string,
    type: (row.type as CategoryType) || 'both',
    walletId: row.wallet_id as string,
  };
}

export async function getCategoriesByWalletId(walletId: string): Promise<Category[]> {
  const db = await getDatabase();
  const [r] = await db.executeSql(
    `SELECT id, name, icon, color, type, wallet_id FROM categories WHERE wallet_id = ? ORDER BY name ASC`,
    [walletId]
  );
  const rows: Category[] = [];
  for (let i = 0; i < r.rows.length; i++) {
    rows.push(rowToCategory(r.rows.item(i) as Record<string, unknown>));
  }
  return rows;
}

export async function getCategoriesForFlow(
  walletId: string,
  flowType: 'pay' | 'receive'
): Promise<Category[]> {
  const all = await getCategoriesByWalletId(walletId);
  return all.filter(
    (c) => c.type === flowType || c.type === 'both'
  );
}

export async function insertCategory(cat: Category): Promise<void> {
  const db = await getDatabase();
  await db.executeSql(
    `INSERT INTO categories (id, name, icon, color, type, wallet_id) VALUES (?, ?, ?, ?, ?, ?)`,
    [cat.id, cat.name, cat.icon, cat.color, cat.type, cat.walletId]
  );
}

export async function seedDefaultCategoriesForWallet(walletId: string): Promise<void> {
  const existing = await getCategoriesByWalletId(walletId);
  if (existing.length > 0) return;

  for (const d of DEFAULT_CATEGORIES) {
    await insertCategory({
      id: generateCategoryId(),
      name: d.name,
      icon: d.icon,
      color: d.color,
      type: d.type,
      walletId,
    });
  }
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const db = await getDatabase();
  const [r] = await db.executeSql(
    `SELECT id, name, icon, color, type, wallet_id FROM categories WHERE id = ?`,
    [id]
  );
  if (r.rows.length === 0) return null;
  return rowToCategory(r.rows.item(0) as Record<string, unknown>);
}

export async function deleteCategoriesByWalletId(walletId: string): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM categories WHERE wallet_id = ?', [walletId]);
}
