import type { SubjectRow } from '../database/localSubjects';
import { supabase } from '../supabase/client';

export async function fetchRemoteSubjects(): Promise<SubjectRow[]> {
  const { data, error } = await supabase.from('subjects').select('*');
  if (error) throw error;
  return data as SubjectRow[];
}

export async function upsertRemoteSubject(row: SubjectRow): Promise<void> {
  const { error } = await supabase.from('subjects').upsert(row);
  if (error) throw error;
}

export async function deleteRemoteSubject(id: string): Promise<void> {
  const { error } = await supabase.from('subjects').delete().eq('id', id);
  if (error) throw error;
}
