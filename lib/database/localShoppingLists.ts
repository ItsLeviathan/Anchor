import { getDb } from './db';

export interface ShoppingListItemData {
  id: string;
  name: string;
  quantity: string | null;
  estimatedCost: number | null;
  isCompleted: boolean;
  store: string | null;
}

export interface ShoppingListRow {
  id: string;
  user_id: string;
  name: string;
  items: ShoppingListItemData[];
  created_at: string;
  updated_at: string;
}

interface RawRow extends Omit<ShoppingListRow, 'items'> {
  items: string;
  deleted: number;
  synced_at: string | null;
}

function fromRaw({ deleted: _deleted, synced_at: _syncedAt, ...row }: RawRow): ShoppingListRow {
  return { ...row, items: JSON.parse(row.items) };
}

export async function getLocalShoppingLists(userId: string): Promise<ShoppingListRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RawRow>(
    `SELECT * FROM local_shopping_lists WHERE user_id = ? AND deleted = 0 ORDER BY created_at ASC;`,
    [userId]
  );
  return rows.map(fromRaw);
}

export async function getLocalShoppingListIds(userId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string }>(`SELECT id FROM local_shopping_lists WHERE user_id = ?;`, [
    userId,
  ]);
  return rows.map((row) => row.id);
}

export async function hasShoppingListEverSynced(id: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ synced_at: string | null }>(
    `SELECT synced_at FROM local_shopping_lists WHERE id = ?;`,
    [id]
  );
  return Boolean(row?.synced_at);
}

export async function upsertLocalShoppingList(
  row: ShoppingListRow,
  options: { markSynced?: boolean } = {}
): Promise<void> {
  const db = await getDb();
  const syncedAt = options.markSynced ? new Date().toISOString() : null;

  await db.runAsync(
    `INSERT INTO local_shopping_lists (id, user_id, name, items, created_at, updated_at, deleted, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       items = excluded.items,
       updated_at = excluded.updated_at,
       deleted = 0,
       synced_at = COALESCE(excluded.synced_at, local_shopping_lists.synced_at);`,
    [row.id, row.user_id, row.name, JSON.stringify(row.items), row.created_at, row.updated_at, syncedAt]
  );
}

export async function markShoppingListSynced(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE local_shopping_lists SET synced_at = ? WHERE id = ?;`, [new Date().toISOString(), id]);
}

export async function markShoppingListDeletedLocally(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE local_shopping_lists SET deleted = 1, updated_at = ? WHERE id = ?;`, [
    new Date().toISOString(),
    id,
  ]);
}

export async function removeLocalShoppingList(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM local_shopping_lists WHERE id = ?;`, [id]);
}
