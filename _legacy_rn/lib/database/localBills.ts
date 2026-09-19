import { getDb } from './db';

export interface BillRow {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  currency: string;
  category: string;
  due_date: string;
  payment_method: string | null;
  notes: string | null;
  recurrence_rule: Record<string, unknown> | null;
  status: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

interface RawRow extends Omit<BillRow, 'recurrence_rule'> {
  recurrence_rule: string | null;
  deleted: number;
  synced_at: string | null;
}

function fromRaw({ deleted: _deleted, synced_at: _syncedAt, ...row }: RawRow): BillRow {
  return { ...row, recurrence_rule: row.recurrence_rule ? JSON.parse(row.recurrence_rule) : null };
}

export async function getLocalBills(userId: string): Promise<BillRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RawRow>(
    `SELECT * FROM local_bills WHERE user_id = ? AND deleted = 0 ORDER BY due_date ASC;`,
    [userId]
  );
  return rows.map(fromRaw);
}

export async function getLocalBillIds(userId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string }>(`SELECT id FROM local_bills WHERE user_id = ?;`, [userId]);
  return rows.map((row) => row.id);
}

export async function hasBillEverSynced(id: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ synced_at: string | null }>(`SELECT synced_at FROM local_bills WHERE id = ?;`, [
    id,
  ]);
  return Boolean(row?.synced_at);
}

export async function upsertLocalBill(row: BillRow, options: { markSynced?: boolean } = {}): Promise<void> {
  const db = await getDb();
  const syncedAt = options.markSynced ? new Date().toISOString() : null;

  await db.runAsync(
    `INSERT INTO local_bills (
       id, user_id, name, amount, currency, category, due_date, payment_method, notes,
       recurrence_rule, status, paid_at, created_at, updated_at, deleted, synced_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       amount = excluded.amount,
       currency = excluded.currency,
       category = excluded.category,
       due_date = excluded.due_date,
       payment_method = excluded.payment_method,
       notes = excluded.notes,
       recurrence_rule = excluded.recurrence_rule,
       status = excluded.status,
       paid_at = excluded.paid_at,
       updated_at = excluded.updated_at,
       deleted = 0,
       synced_at = COALESCE(excluded.synced_at, local_bills.synced_at);`,
    [
      row.id,
      row.user_id,
      row.name,
      row.amount,
      row.currency,
      row.category,
      row.due_date,
      row.payment_method,
      row.notes,
      row.recurrence_rule ? JSON.stringify(row.recurrence_rule) : null,
      row.status,
      row.paid_at,
      row.created_at,
      row.updated_at,
      syncedAt,
    ]
  );
}

export async function markBillSynced(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE local_bills SET synced_at = ? WHERE id = ?;`, [new Date().toISOString(), id]);
}

export async function markBillDeletedLocally(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE local_bills SET deleted = 1, updated_at = ? WHERE id = ?;`, [
    new Date().toISOString(),
    id,
  ]);
}

export async function removeLocalBill(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM local_bills WHERE id = ?;`, [id]);
}
