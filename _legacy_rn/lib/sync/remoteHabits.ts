import type { HabitRow } from '../database/localHabits';
import { supabase } from '../supabase/client';

export async function fetchRemoteHabits(): Promise<HabitRow[]> {
  const { data, error } = await supabase.from('habits').select('*');
  if (error) throw error;
  return data as HabitRow[];
}

export async function upsertRemoteHabit(row: HabitRow): Promise<void> {
  const { error } = await supabase.from('habits').upsert(row);
  if (error) throw error;
}

export async function deleteRemoteHabit(id: string): Promise<void> {
  const { error } = await supabase.from('habits').delete().eq('id', id);
  if (error) throw error;
}
