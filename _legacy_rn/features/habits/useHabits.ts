import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Habit } from '../../types';
import { createHabit, deleteHabit, fetchHabits, toggleHabitToday } from './api';

const HABITS_KEY = ['habits'] as const;

export function useHabits(userId: string | undefined) {
  return useQuery({
    queryKey: [...HABITS_KEY, userId],
    queryFn: () => fetchHabits(userId as string),
    enabled: Boolean(userId),
  });
}

export function useCreateHabit(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHabit,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...HABITS_KEY, userId] }),
  });
}

export function useToggleHabitToday(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (habit: Habit) => toggleHabitToday(habit),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...HABITS_KEY, userId] }),
  });
}

export function useDeleteHabit(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHabit,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...HABITS_KEY, userId] }),
  });
}
