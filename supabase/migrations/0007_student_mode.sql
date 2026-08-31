-- ANCHOR — Phase 6 schema (Student Mode)
-- Run this after 0001–0006.
--
-- Study sessions are deliberately NOT a new table here - they're
-- represented as regular Calendar events (see features/events/). An
-- event already has everything a study session needs (title, start/end
-- time, reminders), so a dedicated entity would only duplicate that.
-- Enabling Student Mode just surfaces a shortcut for creating one.
--
-- Assignments, exams, and projects share one table with a `kind` column
-- rather than three separate tables - they're the same shape (a subject,
-- a title, a due date, optional notes), and the master spec's own
-- suggested schema (section 37) lists only `subjects` and `assignments`,
-- not a separate `exams` table.

alter table public.profiles
  add column if not exists student_mode_enabled boolean not null default false;

-- ---------------------------------------------------------------------------
-- subjects
-- ---------------------------------------------------------------------------

create table if not exists public.subjects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#3B6EA5',
  instructor text,
  term text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subjects enable row level security;

create policy "Users can view their own subjects" on public.subjects for select using (auth.uid() = user_id);
create policy "Users can insert their own subjects" on public.subjects for insert with check (auth.uid() = user_id);
create policy "Users can update their own subjects" on public.subjects for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own subjects" on public.subjects for delete using (auth.uid() = user_id);

create index if not exists subjects_user_id_idx on public.subjects (user_id);

-- ---------------------------------------------------------------------------
-- assignments (covers assignments, exams, and projects via `kind`)
-- ---------------------------------------------------------------------------

create table if not exists public.assignments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  kind text not null default 'assignment' check (kind in ('assignment', 'exam', 'project')),
  title text not null,
  due_date date,
  due_time time,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.assignments enable row level security;

create policy "Users can view their own assignments" on public.assignments for select using (auth.uid() = user_id);
create policy "Users can insert their own assignments" on public.assignments for insert with check (auth.uid() = user_id);
create policy "Users can update their own assignments" on public.assignments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own assignments" on public.assignments for delete using (auth.uid() = user_id);

create index if not exists assignments_user_id_due_date_idx on public.assignments (user_id, due_date);
create index if not exists assignments_subject_id_idx on public.assignments (subject_id);
