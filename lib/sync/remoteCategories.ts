import type { CategoryRow } from '../database/localCategories';
import { supabase } from '../supabase/client';

export async function fetchRemoteCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
  if (error) throw error;
  return data as CategoryRow[];
}
