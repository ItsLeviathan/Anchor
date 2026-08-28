import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Task } from '../../types';
import { computeNextDueDate } from '../../lib/tasks/recurrence';
import { createTask, deleteTask, fetchTasks, setTaskStatus, updateTask } from './api';

const TASKS_KEY = ['tasks'] as const;

export function useTasks(userId: string | undefined) {
  return useQuery({
    queryKey: [...TASKS_KEY, userId],
    queryFn: fetchTasks,
    enabled: Boolean(userId),
  });
}

export function useCreateTask(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...TASKS_KEY, userId] });
    },
  });
}

export function useUpdateTask(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...TASKS_KEY, userId] });
    },
  });
}

/**
 * Completing and reopening are the two actions the user triggers constantly
 * (checkbox taps, swipes), so both update the cached list optimistically —
 * the UI reflects the change immediately rather than waiting on the round
 * trip, and rolls back only if the request actually fails.
 *
 * Completing a recurring task also spawns its next single occurrence (see
 * lib/tasks/recurrence.ts) — Anchor never pre-creates a batch of future
 * rows for a recurring task, only the next one, generated lazily.
 */
export function useCompleteTask(userId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = [...TASKS_KEY, userId];

  return useMutation({
    mutationFn: async (task: Task) => {
      const completed = await setTaskStatus(task.id, 'completed');

      if (task.recurrenceRule && task.dueDate) {
        await createTask({
          userId: task.userId,
          title: task.title,
          categoryId: task.categoryId,
          dueDate: computeNextDueDate(task.dueDate, task.recurrenceRule),
          dueTime: task.dueTime,
          priority: task.priority,
          recurrenceRule: task.recurrenceRule,
        });
      }

      return completed;
    },
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Task[]>(queryKey);

      queryClient.setQueryData<Task[]>(queryKey, (old) =>
        old?.map((t) =>
          t.id === task.id ? { ...t, status: 'completed', completedAt: new Date().toISOString() } : t
        )
      );

      return { previous };
    },
    onError: (_err, _task, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useReopenTask(userId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = [...TASKS_KEY, userId];

  return useMutation({
    mutationFn: (id: string) => setTaskStatus(id, 'pending'),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Task[]>(queryKey);

      queryClient.setQueryData<Task[]>(queryKey, (old) =>
        old?.map((t) => (t.id === id ? { ...t, status: 'pending', completedAt: null } : t))
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useDeleteTask(userId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = [...TASKS_KEY, userId];

  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Task[]>(queryKey);

      queryClient.setQueryData<Task[]>(queryKey, (old) => old?.filter((task) => task.id !== id));

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
