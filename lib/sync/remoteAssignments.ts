import type { AssignmentRow } from '../database/localAssignments';
import { supabase } from '../supabase/client';

export async function fetchRemoteAssignments(): Promise<AssignmentRow[]> {
  const { data, error } = await supabase.from('assignments').select('*');
  if (error) throw error;
  return data as AssignmentRow[];
}

export async function upsertRemoteAssignment(row: AssignmentRow): Promise<void> {
  const { error } = await supabase.from('assignments').upsert(row);
  if (error) throw error;
}

export async function deleteRemoteAssignment(id: string): Promise<void> {
  const { error } = await supabase.from('assignments').delete().eq('id', id);
  if (error) throw error;
}
