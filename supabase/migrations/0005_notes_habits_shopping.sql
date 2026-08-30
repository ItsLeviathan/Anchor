-- ANCHOR — Phase 5 schema, part 2 (Notes + Habits + Shopping)
-- Run this after 0001–0004.

-- ---------------------------------------------------------------------------
-- notes
-- ---------------------------------------------------------------------------

create table if not exists public.notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  title text,
  content text not null default '',
  tags jsonb not null default '[]'::jsonb,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notes enable row level security;

create policy "Users can view their own notes" on public.notes for select using (auth.uid() = user_id);
create policy "Users can insert their own notes" on public.notes for insert with check (auth.uid() = user_id);
create policy "Users can update their own notes" on public.notes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own notes" on public.notes for delete using (auth.uid() = user_id);

create index if not exists notes_user_id_updated_at_idx on public.notes (user_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- habits
--
-- Simplification worth knowing about: completion history lives as a jsonb
-- array of 'YYYY-MM-DD' strings directly on the habit row, rather than a
-- separate habit_entries join table. This keeps habits a single
-- offline-sync entity (one adapter, one queue entry per edit) instead of
-- two, which is a reasonable trade-off at the scale of one person's own
-- habit list. If cross-habit entry queries or per-entry metadata (notes on
-- a specific day, etc.) become needed, that's the point to split it out.
-- ---------------------------------------------------------------------------

create table if not exists public.habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  frequency text not null default 'daily' check (frequency in ('daily', 'weekly')),
  -- For weekly habits: which weekdays count (0=Sun..6=Sat). Null means any day counts.
  days_of_week jsonb,
  completed_dates jsonb not null default '[]'::jsonb,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.habits enable row level security;

create policy "Users can view their own habits" on public.habits for select using (auth.uid() = user_id);
create policy "Users can insert their own habits" on public.habits for insert with check (auth.uid() = user_id);
create policy "Users can update their own habits" on public.habits for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own habits" on public.habits for delete using (auth.uid() = user_id);

create index if not exists habits_user_id_idx on public.habits (user_id);

-- ---------------------------------------------------------------------------
-- shopping_lists
--
-- Same simplification as habits: items live as a jsonb array on the list
-- row instead of a separate shopping_items table. Every user gets one
-- default list auto-seeded (same pattern as categories/calendars);
-- multiple named lists are a natural future addition once there's a UI
-- for managing more than one.
-- ---------------------------------------------------------------------------

create table if not exists public.shopping_lists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Shopping List',
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shopping_lists enable row level security;

create policy "Users can view their own shopping lists" on public.shopping_lists for select using (auth.uid() = user_id);
create policy "Users can insert their own shopping lists" on public.shopping_lists for insert with check (auth.uid() = user_id);
create policy "Users can update their own shopping lists" on public.shopping_lists for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own shopping lists" on public.shopping_lists for delete using (auth.uid() = user_id);

create index if not exists shopping_lists_user_id_idx on public.shopping_lists (user_id);

create or replace function public.seed_default_shopping_list()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.shopping_lists (user_id, name, items)
  values (new.id, 'Shopping List', '[]'::jsonb);
  return new;
end;
$$;

drop trigger if exists on_profile_created_seed_shopping_list on public.profiles;
create trigger on_profile_created_seed_shopping_list
  after insert on public.profiles
  for each row execute procedure public.seed_default_shopping_list();
