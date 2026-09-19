import type { ExpenseRow } from '../database/localExpenses';
import { supabase } from '../supabase/client';

interface RemoteExpenseRow extends Omit<ExpenseRow, 'amount'> {
  amount: string | number;
}

export async function fetchRemoteExpenses(): Promise<ExpenseRow[]> {
  const { data, error } = await supabase.from('expenses').select('*');
  if (error) throw error;
  return (data as RemoteExpenseRow[]).map((row) => ({ ...row, amount: Number(row.amount) }));
}

export async function upsertRemoteExpense(row: ExpenseRow): Promise<void> {
  const { error } = await supabase.from('expenses').upsert(row);
  if (error) throw error;
}

export async function deleteRemoteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}
