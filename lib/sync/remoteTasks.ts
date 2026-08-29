import type { TaskRow } from '../database/localTasks';
import { supabase } from '../supabase/client';

export async function fetchRemoteTasks(): Promise<TaskRow[]> {
  const { data, error } = await supabase.from('tasks').select('*');
  if (error) throw error;
  return data as TaskRow[];
}

export async function upsertRemoteTask(row: TaskRow): Promise<void> {
  const { error } = await supabase.from('tasks').upsert(row);
  if (error) throw error;
}

export async function deleteRemoteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}
