-- ANCHOR — Phase 5 schema, part 1 (Expenses + Bills)
-- Run this after 0001_init.sql, 0002_tasks.sql, and 0003_calendar.sql.

-- Expense/bill categories are a small fixed set (spec section 23) and
-- don't need per-user customization the way Life categories do, so a
-- check constraint is enough - no separate join table.
--
-- Amounts are stored as numeric(12,2). Per spec section 23, "Anchor is
-- not a banking application" - this is deliberately lightweight, not
-- built for currency-exact accounting at scale.

-- ---------------------------------------------------------------------------
-- expenses
-- ---------------------------------------------------------------------------

create table if not exists public.expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'PHP',
  category text not null check (
    category in ('Food', 'Transportation', 'Bills', 'Shopping', 'Entertainment', 'School', 'Health', 'Personal', 'Other')
  ),
  date date not null,
  payment_method text,
  notes text,
  recurrence_rule jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "Users can view their own expenses"
  on public.expenses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own expenses"
  on public.expenses for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own expenses"
  on public.expenses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own expenses"
  on public.expenses for delete
  using (auth.uid() = user_id);

create index if not exists expenses_user_id_date_idx on public.expenses (user_id, date);

-- ---------------------------------------------------------------------------
-- bills
-- Treated as recurring responsibilities (spec section 24); recurrence_rule
-- is nullable since a bill can also be a one-off.
-- ---------------------------------------------------------------------------

create table if not exists public.bills (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'PHP',
  category text not null check (
    category in ('Food', 'Transportation', 'Bills', 'Shopping', 'Entertainment', 'School', 'Health', 'Personal', 'Other')
  ),
  due_date date not null,
  payment_method text,
  notes text,
  recurrence_rule jsonb,
  status text not null default 'unpaid' check (status in ('unpaid', 'paid')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bills enable row level security;

create policy "Users can view their own bills"
  on public.bills for select
  using (auth.uid() = user_id);

create policy "Users can insert their own bills"
  on public.bills for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own bills"
  on public.bills for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own bills"
  on public.bills for delete
  using (auth.uid() = user_id);

create index if not exists bills_user_id_due_date_idx on public.bills (user_id, due_date);
create index if not exists bills_user_id_status_idx on public.bills (user_id, status);
