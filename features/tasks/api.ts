import { supabase } from '../../lib/supabase/client';
import type { RecurrenceRule, Task, TaskPriority, TaskStatus } from '../../types';

interface TaskRow {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  estimated_duration_minutes: number | null;
  actual_duration_minutes: number | null;
  recurrence_rule: RecurrenceRule | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: TaskRow): Task {
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    dueTime: row.due_time,
    priority: row.priority,
    status: row.status,
    estimatedDurationMinutes: row.estimated_duration_minutes,
    actualDurationMinutes: row.actual_duration_minutes,
    recurrenceRule: row.recurrence_rule,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Fetches all non-cancelled tasks; Today/lists filter further client-side. */
export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .neq('status', 'cancelled')
    .order('due_date', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data as TaskRow[]).map(mapRow);
}

export interface CreateTaskInput {
  userId: string;
  title: string;
  categoryId?: string | null;
  dueDate?: string | null;
  dueTime?: string | null;
  priority?: TaskPriority;
  recurrenceRule?: RecurrenceRule | null;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: input.userId,
      title: input.title.trim(),
      category_id: input.categoryId ?? null,
      due_date: input.dueDate ?? null,
      due_time: input.dueTime ?? null,
      priority: input.priority ?? 'medium',
      recurrence_rule: input.recurrenceRule ?? null,
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapRow(data as TaskRow);
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  categoryId?: string | null;
  dueDate?: string | null;
  dueTime?: string | null;
  priority?: TaskPriority;
}

export async function updateTask({ id, ...patch }: UpdateTaskInput): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
      ...(patch.categoryId !== undefined ? { category_id: patch.categoryId } : {}),
      ...(patch.dueDate !== undefined ? { due_date: patch.dueDate } : {}),
      ...(patch.dueTime !== undefined ? { due_time: patch.dueTime } : {}),
      ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return mapRow(data as TaskRow);
}

export async function setTaskStatus(id: string, status: TaskStatus): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return mapRow(data as TaskRow);
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}
