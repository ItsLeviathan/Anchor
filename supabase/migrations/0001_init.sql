-- ANCHOR — Phase 1 schema
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query),
-- or via `supabase db push` once the CLI is linked to your project.

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  is_anonymous boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No client-side insert policy: the row is created automatically by the
-- trigger below whenever a new auth user (anonymous or registered) is
-- created, so the client never needs to insert its own profile row.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, is_anonymous)
  values (new.id, coalesce(new.is_anonymous, true));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create index if not exists profiles_updated_at_idx on public.profiles (updated_at);

-- ---------------------------------------------------------------------------
-- subscriptions
-- (see ANCHOR — MONETIZATION & SUBSCRIPTION SPECIFICATION)
--
-- Clients may only ever READ their own subscription row, to know their
-- current entitlement. There is deliberately no insert/update/delete policy
-- for authenticated users: writes happen only from a Supabase Edge Function
-- (using the service-role key) that verifies purchase receipts/webhooks
-- from the App Store and Play Store. This is what "don't trust a
-- client-side isPro boolean" looks like at the database layer — the client
-- physically cannot grant itself Pro access.
-- ---------------------------------------------------------------------------

create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('apple', 'google')),
  product_id text not null,
  status text not null check (status in ('trialing', 'active', 'expired', 'cancelled', 'grace_period')),
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  auto_renewing boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can view their own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);

-- ---------------------------------------------------------------------------
-- ai_usage
-- Tracks AI requests to enforce the free-tier monthly limit and to
-- understand infrastructure cost. Written only by Edge Functions once AI
-- features exist (Phase 4) — no client write policy is defined.
-- ---------------------------------------------------------------------------

create table if not exists public.ai_usage (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  request_type text not null,
  model text,
  input_tokens integer,
  output_tokens integer,
  estimated_cost numeric(10, 6),
  created_at timestamptz not null default now()
);

alter table public.ai_usage enable row level security;

create policy "Users can view their own AI usage"
  on public.ai_usage for select
  using (auth.uid() = user_id);

create index if not exists ai_usage_user_id_created_at_idx on public.ai_usage (user_id, created_at);

-- ---------------------------------------------------------------------------
-- app_config
-- Simple remote-config table so values like the free AI action limit can
-- change without an app release. Readable by any signed-in user (including
-- anonymous sessions); writable only via the Supabase dashboard/service
-- role, never by the client.
-- ---------------------------------------------------------------------------

create table if not exists public.app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;

create policy "Any signed-in user can read app config"
  on public.app_config for select
  using (auth.role() = 'authenticated');

insert into public.app_config (key, value)
values ('free_ai_monthly_limit', '10'::jsonb)
on conflict (key) do nothing;
