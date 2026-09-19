import { getLocalCategories } from '../../lib/database/localCategories';
import type { Category } from '../../types';
import type { CategoryRow } from '../../lib/database/localCategories';

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

/**
 * Categories are read-only from the client for now (no create/edit UI
 * yet), so this just serves the local cache that the sync engine's pull
 * step keeps fresh - no direct network call needed, which is what makes
 * category pickers work offline.
 */
export async function fetchCategories(userId: string): Promise<Category[]> {
  const rows = await getLocalCategories(userId);
  return rows.map(mapRow);
}
