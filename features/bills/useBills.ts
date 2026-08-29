import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { computeNextDueDate } from '../../lib/tasks/recurrence';
import type { Bill } from '../../types';
import { createExpense } from '../expenses/api';
import { createBill, deleteBill, fetchBills, setBillStatus } from './api';

const BILLS_KEY = ['bills'] as const;
const EXPENSES_KEY = ['expenses'] as const;

function toLocalDatePart(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function useBills(userId: string | undefined) {
  return useQuery({
    queryKey: [...BILLS_KEY, userId],
    queryFn: () => fetchBills(userId as string),
    enabled: Boolean(userId),
  });
}

export function useCreateBill(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...BILLS_KEY, userId] });
    },
  });
}

/**
 * Paying a bill also logs it as an expense (spec section 24 + 23 overlap
 * naturally here) and, for recurring bills, spawns the next occurrence -
 * the same generate-one-at-a-time approach used for recurring tasks
 * (spec section 18), never a batch of future rows.
 */
export function useMarkBillPaid(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bill: Bill) => {
      const paid = await setBillStatus(bill, 'paid');

      await createExpense({
        userId: bill.userId,
        type: 'expense',
        amount: bill.amount,
        category: bill.category,
        date: toLocalDatePart(new Date()),
        currency: bill.currency,
        notes: `Paid: ${bill.name}`,
      });

      if (bill.recurrenceRule) {
        await createBill({
          userId: bill.userId,
          name: bill.name,
          amount: bill.amount,
          category: bill.category,
          dueDate: computeNextDueDate(bill.dueDate, bill.recurrenceRule),
          currency: bill.currency,
          recurrenceRule: bill.recurrenceRule,
        });
      }

      return paid;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...BILLS_KEY, userId] });
      queryClient.invalidateQueries({ queryKey: [...EXPENSES_KEY, userId] });
    },
  });
}

export function useDeleteBill(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...BILLS_KEY, userId] });
    },
  });
}
