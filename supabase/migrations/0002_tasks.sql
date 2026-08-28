-- ANCHOR — Phase 2 schema (Categories + Tasks)
-- Run this after 0001_init.sql in the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#6B6B66',
  icon text,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.categories enable row level security;

create policy "Users can view their own categories"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Users can insert their own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own categories"
  on public.categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own categories"
  on public.categories for delete
  using (auth.uid() = user_id);

create index if not exists categories_user_id_idx on public.categories (user_id);

-- Every new user gets the default category set (see spec section 29)
-- automatically, right after their profile row is created.
create or replace function public.seed_default_categories()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.categories (user_id, name, color, icon, is_default, sort_order)
  values
    (new.id, 'Personal', '#6B6B66', 'person-outline', true, 0),
    (new.id, 'Home', '#8A6D3B', 'home-outline', true, 1),
    (new.id, 'Work', '#2F6F5E', 'briefcase-outline', true, 2),
    (new.id, 'School', '#3B6EA5', 'school-outline', true, 3),
    (new.id, 'Money', '#3D8361', 'cash-outline', true, 4),
    (new.id, 'Health', '#C1473C', 'heart-outline', true, 5),
    (new.id, 'Family', '#A5673B', 'people-outline', true, 6),
    (new.id, 'Social', '#6E5BA6', 'chatbubbles-outline', true, 7),
    (new.id, 'Documents', '#4A4A46', 'folder-outline', true, 8),
    (new.id, 'Other', '#9A9A94', 'ellipsis-horizontal-outline', true, 9);
  return new;
end;
$$;

drop trigger if exists on_profile_created_seed_categories on public.profiles;
create trigger on_profile_created_seed_categories
  after insert on public.profiles
  for each row execute procedure public.seed_default_categories();

-- ---------------------------------------------------------------------------
-- tasks
--
-- `recurrence_rule` holds a small JSON pattern (e.g.
-- {"freq":"weekly","interval":1,"byweekday":[6]}) for recurring tasks. Per
-- spec section 18 ("do not generate unnecessary future database records"),
-- Phase 2 does NOT materialize one row per future occurrence — the client
-- computes the next occurrence from the rule on the fly. A dedicated
-- `task_recurrences`/instance-tracking table can be added later if
-- per-instance completion history for recurring tasks is needed.
-- ---------------------------------------------------------------------------

create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  title text not null,
  description text,
  due_date date,
  due_time time,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  estimated_duration_minutes integer,
  actual_duration_minutes integer,
  recurrence_rule jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Users can view their own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on public.tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

create index if not exists tasks_user_id_status_idx on public.tasks (user_id, status);
create index if not exists tasks_user_id_due_date_idx on public.tasks (user_id, due_date);
create index if not exists tasks_category_id_idx on public.tasks (category_id);
