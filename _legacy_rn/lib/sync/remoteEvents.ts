import type { EventRow } from '../database/localEvents';
import { supabase } from '../supabase/client';

export async function fetchRemoteEvents(): Promise<EventRow[]> {
  const { data, error } = await supabase.from('events').select('*');
  if (error) throw error;
  return data as EventRow[];
}

export async function upsertRemoteEvent(row: EventRow): Promise<void> {
  const { error } = await supabase.from('events').upsert(row);
  if (error) throw error;
}

export async function deleteRemoteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}
