import type { NoteRow } from '../database/localNotes';
import { supabase } from '../supabase/client';

export async function fetchRemoteNotes(): Promise<NoteRow[]> {
  const { data, error } = await supabase.from('notes').select('*');
  if (error) throw error;
  return data as NoteRow[];
}

export async function upsertRemoteNote(row: NoteRow): Promise<void> {
  const { error } = await supabase.from('notes').upsert(row);
  if (error) throw error;
}

export async function deleteRemoteNote(id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw error;
}
