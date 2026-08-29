import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { cancelTaskReminder, scheduleTaskReminder } from '../../lib/notifications/scheduler';
import { computeNextDueDate } from '../../lib/tasks/recurrence';
import type { Task } from '../../types';
import { createTask, deleteTask, fetchTasks, setTaskStatus, updateTask } from './api';

const TASKS_KEY = ['tasks'] as const;

/**
 * Reads come from the local SQLite repo (features/tasks/api.ts), which is
 * why this works identically online or offline - there's no network call
 * in the read path at all. Writes go local-first too; the sync engine
 * (lib/sync/engine.ts) reconciles with Supabase in the background.
 */
export function useTasks(userId: string | undefined) {
  return useQuery({
    queryKey: [...TASKS_KEY, userId],
    queryFn: () => fetchTasks(userId as string),
    enabled: Boolean(userId),
  });
}

export function useCreateTask(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTask,
    onSuccess: (createdTask) => {
      queryClient.invalidateQueries({ queryKey: [...TASKS_KEY, userId] });
      scheduleTaskReminder(createdTask).catch((err) => console.error('Failed to schedule task reminder', err));
    },
  });
}

export function useUpdateTask(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTask,
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: [...TASKS_KEY, userId] });
      scheduleTaskReminder(updatedTask).catch((err) => console.error('Failed to reschedule task reminder', err));
    },
  });
}

/**
 * Completing a recurring task also spawns its next single occurrence (see
 * lib/tasks/recurrence.ts) — Anchor never pre-creates a batch of future
 * rows for a recurring task, only the next one, generated lazily. Both the
 * completion and the new occurrence are local-first writes, queued for
 * sync like any other change.
 */
export function useCompleteTask(userId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = [...TASKS_KEY, userId];

  return useMutation({
    mutationFn: async (task: Task) => {
      const completed = await setTaskStatus(task.id, 'completed');
      await cancelTaskReminder(task.id);

      if (task.recurrenceRule && task.dueDate) {
        const nextTask = await createTask({
          userId: task.userId,
          title: task.title,
          categoryId: task.categoryId,
          dueDate: computeNextDueDate(task.dueDate, task.recurrenceRule),
          dueTime: task.dueTime,
          priority: task.priority,
          recurrenceRule: task.recurrenceRule,
        });
        await scheduleTaskReminder(nextTask);
      }

      return completed;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useReopenTask(userId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = [...TASKS_KEY, userId];

  return useMutation({
    mutationFn: async (id: string) => {
      const reopened = await setTaskStatus(id, 'pending');
      await scheduleTaskReminder(reopened);
      return reopened;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useDeleteTask(userId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = [...TASKS_KEY, userId];

  return useMutation({
    mutationFn: async (id: string) => {
      await cancelTaskReminder(id);
      await deleteTask(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
