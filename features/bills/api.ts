import { getLocalBills, upsertLocalBill, type BillRow } from '../../lib/database/localBills';
import { enqueueDelete, enqueueUpsert } from '../../lib/sync/engine';
import { generateId } from '../../lib/sync/ids';
import type { Bill, BillStatus, MoneyCategory, RecurrenceRule } from '../../types';

function mapRow(row: BillRow): Bill {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    amount: row.amount,
    currency: row.currency,
    category: row.category as MoneyCategory,
    dueDate: row.due_date,
    paymentMethod: row.payment_method,
    notes: row.notes,
    recurrenceRule: (row.recurrence_rule as unknown as RecurrenceRule | null) ?? null,
    status: row.status as BillStatus,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchBills(userId: string): Promise<Bill[]> {
  const rows = await getLocalBills(userId);
  return rows.map(mapRow);
}

export interface CreateBillInput {
  userId: string;
  name: string;
  amount: number;
  category: MoneyCategory;
  dueDate: string;
  currency?: string;
  recurrenceRule?: RecurrenceRule | null;
  notes?: string | null;
}

export async function createBill(input: CreateBillInput): Promise<Bill> {
  const now = new Date().toISOString();
  const row: BillRow = {
    id: generateId(),
    user_id: input.userId,
    name: input.name.trim(),
    amount: input.amount,
    currency: input.currency ?? 'PHP',
    category: input.category,
    due_date: input.dueDate,
    payment_method: null,
    notes: input.notes ?? null,
    recurrence_rule: (input.recurrenceRule as unknown as Record<string, unknown>) ?? null,
    status: 'unpaid',
    paid_at: null,
    created_at: now,
    updated_at: now,
  };

  await upsertLocalBill(row);
  await enqueueUpsert('bill', row.id, row as unknown as Record<string, unknown>);

  return mapRow(row);
}

export async function setBillStatus(bill: Bill, status: BillStatus): Promise<Bill> {
  const row: BillRow = {
    id: bill.id,
    user_id: bill.userId,
    name: bill.name,
    amount: bill.amount,
    currency: bill.currency,
    category: bill.category,
    due_date: bill.dueDate,
    payment_method: bill.paymentMethod,
    notes: bill.notes,
    recurrence_rule: (bill.recurrenceRule as unknown as Record<string, unknown>) ?? null,
    status,
    paid_at: status === 'paid' ? new Date().toISOString() : null,
    created_at: bill.createdAt,
    updated_at: new Date().toISOString(),
  };

  await upsertLocalBill(row);
  await enqueueUpsert('bill', row.id, row as unknown as Record<string, unknown>);

  return mapRow(row);
}

export async function deleteBill(id: string): Promise<void> {
  await enqueueDelete('bill', id);
}
