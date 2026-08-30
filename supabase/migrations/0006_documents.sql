-- ANCHOR — Phase 5 schema, part 3 (Documents)
-- Run this after 0001–0005.
--
-- Unlike everything else in Anchor, documents are NOT part of the local
-- offline-sync engine. Uploading a file inherently requires connectivity
-- at the moment of upload, so this feature is online-only for now - the
-- metadata table below is queried directly, the same way the app worked
-- before Phase 3's offline rewrite. Revisit this if "create the metadata
-- offline, upload the file once reconnected" turns out to matter enough
-- to build (it would need its own queue, since a file payload doesn't fit
-- the same lightweight JSON-row queue tasks/events use).

-- ---------------------------------------------------------------------------
-- documents (metadata only - the file itself lives in Storage)
-- ---------------------------------------------------------------------------

create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text not null default 'Other' check (category in ('ID', 'School', 'Certificate', 'Contract', 'Other')),
  storage_path text not null,
  file_name text not null,
  mime_type text,
  file_size integer,
  issue_date date,
  expiration_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.documents enable row level security;

create policy "Users can view their own documents"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "Users can insert their own documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own documents"
  on public.documents for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own documents"
  on public.documents for delete
  using (auth.uid() = user_id);

create index if not exists documents_user_id_expiration_idx on public.documents (user_id, expiration_date);

-- ---------------------------------------------------------------------------
-- Storage bucket + RLS
--
-- Private (not public) bucket - files are only ever reached through a
-- short-lived signed URL generated on demand (spec sections 9 & 39:
-- "signed URLs", never a permanently public file). Objects are stored at
-- `{user_id}/{document_id}-{original_filename}`, and the RLS policies
-- below use storage.foldername() to check that the first path segment
-- matches the requesting user's id - the standard Supabase pattern for
-- per-user file isolation in a shared bucket.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "Users can view their own document files"
  on storage.objects for select
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can upload their own document files"
  on storage.objects for insert
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own document files"
  on storage.objects for update
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own document files"
  on storage.objects for delete
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
