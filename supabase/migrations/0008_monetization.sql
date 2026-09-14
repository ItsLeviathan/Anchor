-- Phase 10 — Monetization
--
-- Add a unique constraint on subscriptions.user_id so that
-- validate-purchase can upsert (update-or-insert) rather than always
-- inserting a new row. Each user has exactly one current subscription
-- record; RevenueCat tracks the full purchase history on their side.

alter table public.subscriptions
  add constraint subscriptions_user_id_key unique (user_id);
