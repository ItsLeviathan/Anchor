import { getLocalTask, getLocalTasks, upsertLocalTask, type TaskRow } from '../../lib/database/localTasks';
import { enqueueDelete, enqueueUpsert } from '../../lib/sync/engine';
import { generateId } from '../../lib/sync/ids';
import type { RecurrenceRule, Task, TaskPriority, TaskStatus } from '../../types';

function mapRow(row: TaskRow): Task {
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    dueTime: row.due_time,
    priority: row.priority as TaskPriority,
    status: row.status as TaskStatus,
    estimatedDurationMinutes: row.estimated_duration_minutes,
    actualDurationMinutes: row.actual_duration_minutes,
    recurrenceRule: (row.recurrence_rule as unknown as RecurrenceRule | null) ?? null,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchTasks(userId: string): Promise<Task[]> {
  const rows = await getLocalTasks(userId);
  return rows.map(mapRow);
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
  const now = new Date().toISOString();
  const row: TaskRow = {
    id: generateId(),
    user_id: input.userId,
    category_id: input.categoryId ?? null,
    title: input.title.trim(),
    description: null,
    due_date: input.dueDate ?? null,
    due_time: input.dueTime ?? null,
    priority: input.priority ?? 'medium',
    status: 'pending',
    estimated_duration_minutes: null,
    actual_duration_minutes: null,
    recurrence_rule: (input.recurrenceRule as unknown as Record<string, unknown>) ?? null,
    completed_at: null,
    created_at: now,
    updated_at: now,
  };

  await upsertLocalTask(row);
  await enqueueUpsert('task', row.id, row as unknown as Record<string, unknown>);

  return mapRow(row);
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
  const existing = await getLocalTask(id);
  if (!existing) throw new Error(`Task ${id} not found locally`);

  const row: TaskRow = {
    ...existing,
    title: patch.title !== undefined ? patch.title.trim() : existing.title,
    category_id: patch.categoryId !== undefined ? patch.categoryId : existing.category_id,
    due_date: patch.dueDate !== undefined ? patch.dueDate : existing.due_date,
    due_time: patch.dueTime !== undefined ? patch.dueTime : existing.due_time,
    priority: patch.priority !== undefined ? patch.priority : existing.priority,
    updated_at: new Date().toISOString(),
  };

  await upsertLocalTask(row);
  await enqueueUpsert('task', row.id, row as unknown as Record<string, unknown>);

  return mapRow(row);
}

export async function setTaskStatus(id: string, status: TaskStatus): Promise<Task> {
  const existing = await getLocalTask(id);
  if (!existing) throw new Error(`Task ${id} not found locally`);

  const row: TaskRow = {
    ...existing,
    status,
    completed_at: status === 'completed' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  await upsertLocalTask(row);
  await enqueueUpsert('task', row.id, row as unknown as Record<string, unknown>);

  return mapRow(row);
}

export async function deleteTask(id: string): Promise<void> {
  await enqueueDelete('task', id);
}
