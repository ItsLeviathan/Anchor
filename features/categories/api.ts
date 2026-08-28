import { supabase } from '../../lib/supabase/client';
import type { Category } from '../../types';

interface CategoryRow {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string | null;
  is_default: boolean;
  sort_order: number;
}

function mapRow(row: CategoryRow): Category {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    isDefault: row.is_default,
    sortOrder: row.sort_order,
  };
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data as CategoryRow[]).map(mapRow);
}
