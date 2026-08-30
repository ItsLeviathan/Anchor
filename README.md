# Anchor — Phases 1–4 + Phase 5 (complete)

Phases 1–4 are complete. **Phase 5 is now fully complete**: Expenses,
Bills, Notes, Habits, Shopping, and — this update — Documents. Every
option in the global **+** sheet now does something real.

## What's here

**Phases 1–4**: navigation shell, design system, anonymous auth,
entitlements, local-first tasks/events/categories/calendars with a
background sync engine, reminders, Brain Dump, daily AI planning, a
deterministic Quick Add parser.

**Phase 5 — Expenses, Bills, Notes, Habits, Shopping**: income/expense
tracking with a real monthly summary, bills with optional recurrence,
notes with pinning, habits with tested streak logic, a default shopping
list. All local-first through the same sync engine as tasks/events, via
a generic entity-adapter registry.

**Phase 5 — Documents (this update, completes Phase 5)**

- **Deliberately online-only**, unlike everything else in Anchor. A file
  upload inherently needs connectivity at the moment it happens, and
  building a queue that can hold a binary payload (rather than a small
  JSON row) would have been a meaningfully different, riskier thing to
  get right without any way to test it here. The migration file's own
  comment explains this trade-off and what revisiting it would take
- **Private Supabase Storage bucket** (`documents`, not public) with
  per-user RLS on `storage.objects` using the standard
  `storage.foldername()` pattern — files live at
  `{user_id}/{document_id}-{filename}` and are only ever reached through
  a short-lived signed URL, never a permanent public link (spec sections
  9 & 39)
- **A real, well-documented gotcha avoided**: uploading a plain `Blob`
  (from `fetch(uri).blob()`) to Supabase Storage doesn't work correctly
  from React Native — it's a known issue covered in Supabase's own React
  Native guide. `features/documents/api.ts` converts to an `ArrayBuffer`
  first instead, which is the documented working approach
- **Expiration reminders**: a local notification 14 days before a
  document's expiration date, phrased exactly like the spec's own
  example ("Driver's license expires in 14 days") — reusing the same
  notification scheduler infrastructure as task/event reminders
  (`lib/notifications/scheduler.ts`), just a third entity type
- **Documents section on Life**, color-coded by urgency (red if expired,
  orange if expiring within 30 days) — tap any document to generate a
  fresh signed URL and open it

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2–3. Supabase project + env vars

Same as previous updates.

### 4. Run the database migrations, in order

1. `0001_init.sql`
2. `0002_tasks.sql`
3. `0003_calendar.sql`
4. `0004_expenses_bills.sql`
5. `0005_notes_habits_shopping.sql`
6. `0006_documents.sql` ← new this update (creates the `documents`
   table **and** the private Storage bucket + its RLS policies — no
   separate dashboard step needed)

### 5. Deploy the Edge Function

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
npx supabase functions deploy ai-assist
```

You'll need your own Anthropic API key (console.anthropic.com). The key
lives only in this secret — it's never in the app bundle.

### 6. Start the app

```bash
npx expo start
```

## Verifying it works

- Tap **+** → **Document**, pick any file from your device, name it,
  set a category and an expiration date a few days out, save
- It should appear on **Life** under Documents, with an orange "Expires
  in N days" label if within 30 days
- Tap it — it should open in your device's viewer/browser via a signed
  URL (give it a moment; generating the URL is a network call)
- Delete it — confirm it disappears from both the list and (if you check
  the Supabase dashboard) the Storage bucket, not just the database row
- Try creating a document while offline — this should fail with a clear
  error rather than silently losing your file, since Documents are
  online-only by design

## What's intentionally not built yet

- Offline document creation (queue the metadata, upload once
  reconnected) — see the migration file's comment on why this was
  deliberately deferred
- Document editing (only create/view/delete exist)
- Multiple shopping lists, note editing, note attachments, note AI
  actions, habit categories/archiving, spending/habit trend charts —
  all still open from earlier Phase 5 updates
- No paywall UI or actual billing integration — entitlements and AI
  quota enforcement are real, but nothing sells anything yet

## Onward

That's every item from the master spec's Phase 5 built. Remaining
phases from the spec: **Phase 6** (Student Mode), **Phase 7** (AI
Assistant: daily briefing, evening review, smart reminders, AI
insights), **Phase 8** (widgets), **Phase 9** (polish/accessibility/App
Store prep) — plus the monetization spec's paywall and actual billing
integration, which hasn't been started at all yet.
