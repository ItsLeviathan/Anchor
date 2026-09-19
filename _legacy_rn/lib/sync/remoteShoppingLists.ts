import type { ShoppingListRow } from '../database/localShoppingLists';
import { supabase } from '../supabase/client';

export async function fetchRemoteShoppingLists(): Promise<ShoppingListRow[]> {
  const { data, error } = await supabase.from('shopping_lists').select('*');
  if (error) throw error;
  return data as ShoppingListRow[];
}

export async function upsertRemoteShoppingList(row: ShoppingListRow): Promise<void> {
  const { error } = await supabase.from('shopping_lists').upsert(row);
  if (error) throw error;
}

export async function deleteRemoteShoppingList(id: string): Promise<void> {
  const { error } = await supabase.from('shopping_lists').delete().eq('id', id);
  if (error) throw error;
}
