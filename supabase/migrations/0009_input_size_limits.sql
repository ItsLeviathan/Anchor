-- ANCHOR — Security/production-readiness hardening
--
-- Anchor allows anonymous sign-in (see lib/supabase/useSession.ts), which
-- means anyone can obtain a valid, RLS-scoped session with zero
-- verification (no email, no phone, no CAPTCHA). RLS correctly limits every
-- table to auth.uid() = user_id, so this can't be used to read or write
-- another user's data — but nothing previously stopped a script from
-- authenticating anonymously and flooding `notes.content`,
-- `shopping_lists.items`, `habits.completed_dates`, etc. with
-- multi-megabyte payloads per row, or uploading arbitrarily large files to
-- the `documents` storage bucket. Since Postgres text/jsonb columns and
-- Supabase Storage objects are unbounded by default, this was a trivial,
-- unauthenticated-effort storage/cost exhaustion vector.
--
-- This migration adds generous CHECK constraints (well above any realistic
-- legitimate use — long-form notes, big shopping lists, years of habit
-- history) and a per-object Storage file size cap. All constraints are
-- added NOT VALID so this migration cannot fail against any pre-existing
-- production data; they still apply to every new insert/update going
-- forward. A follow-up migration can VALIDATE CONSTRAINT once historical
-- data has been confirmed to fit, if that matters.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table public.profiles
  add constraint profiles_display_name_len check (char_length(display_name) <= 200) not valid;

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
alter table public.categories
  add constraint categories_name_len check (char_length(name) <= 100) not valid;
alter table public.categories
  add constraint categories_icon_len check (char_length(icon) <= 100) not valid;

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
alter table public.tasks
  add constraint tasks_title_len check (char_length(title) <= 500) not valid;
alter table public.tasks
  add constraint tasks_description_len check (char_length(description) <= 20000) not valid;
alter table public.tasks
  add constraint tasks_recurrence_rule_len check (length(recurrence_rule::text) <= 5000) not valid;

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
alter table public.events
  add constraint events_title_len check (char_length(title) <= 500) not valid;
alter table public.events
  add constraint events_location_len check (char_length(location) <= 500) not valid;
alter table public.events
  add constraint events_description_len check (char_length(description) <= 20000) not valid;
alter table public.events
  add constraint events_recurrence_rule_len check (length(recurrence_rule::text) <= 5000) not valid;

-- ---------------------------------------------------------------------------
-- expenses
-- ---------------------------------------------------------------------------
alter table public.expenses
  add constraint expenses_notes_len check (char_length(notes) <= 10000) not valid;
alter table public.expenses
  add constraint expenses_payment_method_len check (char_length(payment_method) <= 200) not valid;
alter table public.expenses
  add constraint expenses_recurrence_rule_len check (length(recurrence_rule::text) <= 5000) not valid;

-- ---------------------------------------------------------------------------
-- bills
-- ---------------------------------------------------------------------------
alter table public.bills
  add constraint bills_name_len check (char_length(name) <= 500) not valid;
alter table public.bills
  add constraint bills_notes_len check (char_length(notes) <= 10000) not valid;
alter table public.bills
  add constraint bills_payment_method_len check (char_length(payment_method) <= 200) not valid;
alter table public.bills
  add constraint bills_recurrence_rule_len check (length(recurrence_rule::text) <= 5000) not valid;

-- ---------------------------------------------------------------------------
-- notes
-- ---------------------------------------------------------------------------
alter table public.notes
  add constraint notes_title_len check (char_length(title) <= 500) not valid;
alter table public.notes
  add constraint notes_content_len check (char_length(content) <= 500000) not valid;
alter table public.notes
  add constraint notes_tags_len check (length(tags::text) <= 20000) not valid;

-- ---------------------------------------------------------------------------
-- habits
-- ---------------------------------------------------------------------------
alter table public.habits
  add constraint habits_name_len check (char_length(name) <= 300) not valid;
alter table public.habits
  add constraint habits_days_of_week_len check (length(days_of_week::text) <= 2000) not valid;
alter table public.habits
  add constraint habits_completed_dates_len check (length(completed_dates::text) <= 200000) not valid;

-- ---------------------------------------------------------------------------
-- shopping_lists
-- ---------------------------------------------------------------------------
alter table public.shopping_lists
  add constraint shopping_lists_name_len check (char_length(name) <= 300) not valid;
alter table public.shopping_lists
  add constraint shopping_lists_items_len check (length(items::text) <= 300000) not valid;

-- ---------------------------------------------------------------------------
-- documents (metadata)
-- ---------------------------------------------------------------------------
alter table public.documents
  add constraint documents_name_len check (char_length(name) <= 500) not valid;
alter table public.documents
  add constraint documents_file_name_len check (char_length(file_name) <= 500) not valid;
alter table public.documents
  add constraint documents_mime_type_len check (char_length(mime_type) <= 200) not valid;
alter table public.documents
  add constraint documents_notes_len check (char_length(notes) <= 10000) not valid;

-- ---------------------------------------------------------------------------
-- subjects / assignments
-- ---------------------------------------------------------------------------
alter table public.subjects
  add constraint subjects_name_len check (char_length(name) <= 300) not valid;
alter table public.subjects
  add constraint subjects_instructor_len check (char_length(instructor) <= 300) not valid;
alter table public.subjects
  add constraint subjects_term_len check (char_length(term) <= 200) not valid;

alter table public.assignments
  add constraint assignments_title_len check (char_length(title) <= 500) not valid;
alter table public.assignments
  add constraint assignments_notes_len check (char_length(notes) <= 20000) not valid;

-- ---------------------------------------------------------------------------
-- Storage: cap per-file size for the private `documents` bucket.
--
-- The client (features/documents/DocumentComposer.tsx) intentionally lets
-- users pick any file type (`type: '*/*'`), so we do not restrict
-- allowed_mime_types here — that would break legitimate uploads. But
-- nothing previously capped file size, so an authenticated (including
-- anonymous) user could upload arbitrarily large objects. 25MB comfortably
-- covers scanned documents/photos/PDFs while bounding worst-case abuse.
-- ---------------------------------------------------------------------------
update storage.buckets
set file_size_limit = 26214400 -- 25MB
where id = 'documents';
