import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createExpense, deleteExpense, fetchExpenses } from './api';

const EXPENSES_KEY = ['expenses'] as const;

export function useExpenses(userId: string | undefined) {
  return useQuery({
    queryKey: [...EXPENSES_KEY, userId],
    queryFn: () => fetchExpenses(userId as string),
    enabled: Boolean(userId),
  });
}

export function useCreateExpense(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...EXPENSES_KEY, userId] });
    },
  });
}

export function useDeleteExpense(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...EXPENSES_KEY, userId] });
    },
  });
}
