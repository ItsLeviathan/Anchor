import {
  getLocalShoppingLists,
  upsertLocalShoppingList,
  type ShoppingListRow,
} from '../../lib/database/localShoppingLists';
import { enqueueUpsert } from '../../lib/sync/engine';
import { generateId } from '../../lib/sync/ids';
import type { ShoppingItem, ShoppingList } from '../../types';

function mapRow(row: ShoppingListRow): ShoppingList {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    items: row.items,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Everyone has exactly one auto-seeded list (see migration 0005) - the client just uses whichever one it finds. */
export async function fetchDefaultShoppingList(userId: string): Promise<ShoppingList | null> {
  const rows = await getLocalShoppingLists(userId);
  return rows.length > 0 ? mapRow(rows[0]) : null;
}

async function saveList(list: ShoppingList): Promise<ShoppingList> {
  const row: ShoppingListRow = {
    id: list.id,
    user_id: list.userId,
    name: list.name,
    items: list.items,
    created_at: list.createdAt,
    updated_at: new Date().toISOString(),
  };

  await upsertLocalShoppingList(row);
  await enqueueUpsert('shopping_list', row.id, row as unknown as Record<string, unknown>);

  return mapRow(row);
}

export async function addShoppingItem(
  list: ShoppingList,
  name: string,
  quantity?: string | null
): Promise<ShoppingList> {
  const item: ShoppingItem = {
    id: generateId(),
    name: name.trim(),
    quantity: quantity?.trim() || null,
    estimatedCost: null,
    isCompleted: false,
    store: null,
  };

  return saveList({ ...list, items: [...list.items, item] });
}

export async function toggleShoppingItem(list: ShoppingList, itemId: string): Promise<ShoppingList> {
  const items = list.items.map((item) => (item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item));
  return saveList({ ...list, items });
}

export async function removeShoppingItem(list: ShoppingList, itemId: string): Promise<ShoppingList> {
  return saveList({ ...list, items: list.items.filter((item) => item.id !== itemId) });
}

export async function clearCompletedItems(list: ShoppingList): Promise<ShoppingList> {
  return saveList({ ...list, items: list.items.filter((item) => !item.isCompleted) });
}
