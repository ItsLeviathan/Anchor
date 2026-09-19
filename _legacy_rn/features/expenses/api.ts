import {
  getLocalExpenses,
  upsertLocalExpense,
  type ExpenseRow,
} from '../../lib/database/localExpenses';
import { enqueueDelete, enqueueUpsert } from '../../lib/sync/engine';
import { generateId } from '../../lib/sync/ids';
import type { Expense, ExpenseType, MoneyCategory } from '../../types';

function mapRow(row: ExpenseRow): Expense {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as ExpenseType,
    amount: row.amount,
    currency: row.currency,
    category: row.category as MoneyCategory,
    date: row.date,
    paymentMethod: row.payment_method,
    notes: row.notes,
    recurrenceRule: null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchExpenses(userId: string): Promise<Expense[]> {
  const rows = await getLocalExpenses(userId);
  return rows.map(mapRow);
}

export interface CreateExpenseInput {
  userId: string;
  type: ExpenseType;
  amount: number;
  category: MoneyCategory;
  date: string;
  currency?: string;
  paymentMethod?: string | null;
  notes?: string | null;
}

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const now = new Date().toISOString();
  const row: ExpenseRow = {
    id: generateId(),
    user_id: input.userId,
    type: input.type,
    amount: input.amount,
    currency: input.currency ?? 'PHP',
    category: input.category,
    date: input.date,
    payment_method: input.paymentMethod ?? null,
    notes: input.notes ?? null,
    recurrence_rule: null,
    created_at: now,
    updated_at: now,
  };

  await upsertLocalExpense(row);
  await enqueueUpsert('expense', row.id, row as unknown as Record<string, unknown>);

  return mapRow(row);
}

export async function deleteExpense(id: string): Promise<void> {
  await enqueueDelete('expense', id);
}
