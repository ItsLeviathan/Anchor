import { getDb } from './db';

export interface ExpenseRow {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  payment_method: string | null;
  notes: string | null;
  recurrence_rule: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface RawRow extends Omit<ExpenseRow, 'recurrence_rule'> {
  recurrence_rule: string | null;
  deleted: number;
  synced_at: string | null;
}

function fromRaw({ deleted: _deleted, synced_at: _syncedAt, ...row }: RawRow): ExpenseRow {
  return { ...row, recurrence_rule: row.recurrence_rule ? JSON.parse(row.recurrence_rule) : null };
}

export async function getLocalExpenses(userId: string): Promise<ExpenseRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RawRow>(
    `SELECT * FROM local_expenses WHERE user_id = ? AND deleted = 0 ORDER BY date DESC;`,
    [userId]
  );
  return rows.map(fromRaw);
}

export async function getLocalExpenseIds(userId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string }>(`SELECT id FROM local_expenses WHERE user_id = ?;`, [userId]);
  return rows.map((row) => row.id);
}

export async function hasExpenseEverSynced(id: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ synced_at: string | null }>(
    `SELECT synced_at FROM local_expenses WHERE id = ?;`,
    [id]
  );
  return Boolean(row?.synced_at);
}

export async function upsertLocalExpense(row: ExpenseRow, options: { markSynced?: boolean } = {}): Promise<void> {
  const db = await getDb();
  const syncedAt = options.markSynced ? new Date().toISOString() : null;

  await db.runAsync(
    `INSERT INTO local_expenses (
       id, user_id, type, amount, currency, category, date, payment_method, notes,
       recurrence_rule, created_at, updated_at, deleted, synced_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
     ON CONFLICT(id) DO UPDATE SET
       type = excluded.type,
       amount = excluded.amount,
       currency = excluded.currency,
       category = excluded.category,
       date = excluded.date,
       payment_method = excluded.payment_method,
       notes = excluded.notes,
       recurrence_rule = excluded.recurrence_rule,
       updated_at = excluded.updated_at,
       deleted = 0,
       synced_at = COALESCE(excluded.synced_at, local_expenses.synced_at);`,
    [
      row.id,
      row.user_id,
      row.type,
      row.amount,
      row.currency,
      row.category,
      row.date,
      row.payment_method,
      row.notes,
      row.recurrence_rule ? JSON.stringify(row.recurrence_rule) : null,
      row.created_at,
      row.updated_at,
      syncedAt,
    ]
  );
}

export async function markExpenseSynced(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE local_expenses SET synced_at = ? WHERE id = ?;`, [new Date().toISOString(), id]);
}

export async function markExpenseDeletedLocally(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE local_expenses SET deleted = 1, updated_at = ? WHERE id = ?;`, [
    new Date().toISOString(),
    id,
  ]);
}

export async function removeLocalExpense(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM local_expenses WHERE id = ?;`, [id]);
}
