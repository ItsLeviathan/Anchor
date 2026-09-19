import { getDb } from './db';

export interface CategoryRow {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string | null;
  is_default: boolean;
  sort_order: number;
}

interface RawRow extends Omit<CategoryRow, 'is_default'> {
  is_default: number;
}

function fromRaw(row: RawRow): CategoryRow {
  return { ...row, is_default: row.is_default === 1 };
}

export async function getLocalCategories(userId: string): Promise<CategoryRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RawRow>(
    `SELECT * FROM local_categories WHERE user_id = ? ORDER BY sort_order ASC;`,
    [userId]
  );
  return rows.map(fromRaw);
}

/** Replaces the entire local cache with the latest server list - there's no local editing of categories yet, so there's nothing to preserve. */
export async function replaceLocalCategories(userId: string, categories: CategoryRow[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM local_categories WHERE user_id = ?;`, [userId]);
    for (const category of categories) {
      await db.runAsync(
        `INSERT INTO local_categories (id, user_id, name, color, icon, is_default, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          category.id,
          category.user_id,
          category.name,
          category.color,
          category.icon,
          category.is_default ? 1 : 0,
          category.sort_order,
        ]
      );
    }
  });
}


