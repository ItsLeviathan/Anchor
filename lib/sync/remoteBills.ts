import type { BillRow } from '../database/localBills';
import { supabase } from '../supabase/client';

interface RemoteBillRow extends Omit<BillRow, 'amount'> {
  amount: string | number;
}

export async function fetchRemoteBills(): Promise<BillRow[]> {
  const { data, error } = await supabase.from('bills').select('*');
  if (error) throw error;
  return (data as RemoteBillRow[]).map((row) => ({ ...row, amount: Number(row.amount) }));
}

export async function upsertRemoteBill(row: BillRow): Promise<void> {
  const { error } = await supabase.from('bills').upsert(row);
  if (error) throw error;
}

export async function deleteRemoteBill(id: string): Promise<void> {
  const { error } = await supabase.from('bills').delete().eq('id', id);
  if (error) throw error;
}
