-- ANCHOR — Phase 2 schema (Calendar + Events)
-- Run this after 0001_init.sql and 0002_tasks.sql.

-- ---------------------------------------------------------------------------
-- calendars
--
-- Every user gets one default calendar automatically (Free plan includes
-- "Calendar" per the master spec). Creating *additional* calendars is an
-- Anchor Pro perk ("Multiple calendars" in the monetization spec) — the
-- schema supports it from day one, but the client only exposes calendar
-- creation UI when entitlements.canUseMultipleCalendars is true. Nothing
-- here enforces that at the database level (yet); enforcing entitlement
-- limits server-side belongs with the rest of the billing/Edge Function
-- work in a later phase, same as the AI usage limit.
-- ---------------------------------------------------------------------------

create table if not exists public.calendars (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'My Calendar',
  color text not null default '#2F6F5E',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.calendars enable row level security;

create policy "Users can view their own calendars"
  on public.calendars for select
  using (auth.uid() = user_id);

create policy "Users can insert their own calendars"
  on public.calendars for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own calendars"
  on public.calendars for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own calendars"
  on public.calendars for delete
  using (auth.uid() = user_id);

create index if not exists calendars_user_id_idx on public.calendars (user_id);

create or replace function public.seed_default_calendar()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.calendars (user_id, name, color, is_default)
  values (new.id, 'My Calendar', '#2F6F5E', true);
  return new;
end;
$$;

drop trigger if exists on_profile_created_seed_calendar on public.profiles;
create trigger on_profile_created_seed_calendar
  after insert on public.profiles
  for each row execute procedure public.seed_default_calendar();

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------

create table if not exists public.events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  calendar_id uuid not null references public.calendars (id) on delete cascade,
  title text not null,
  location text,
  description text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  all_day boolean not null default false,
  recurrence_rule jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_end_after_start check (end_at >= start_at)
);

alter table public.events enable row level security;

create policy "Users can view their own events"
  on public.events for select
  using (auth.uid() = user_id);

create policy "Users can insert their own events"
  on public.events for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own events"
  on public.events for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own events"
  on public.events for delete
  using (auth.uid() = user_id);

create index if not exists events_user_id_start_at_idx on public.events (user_id, start_at);
create index if not exists events_calendar_id_idx on public.events (calendar_id);
