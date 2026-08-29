# Anchor — Phase 1 + Phase 2 + Phase 3

Phases 1 and 2 are complete. **Phase 3 (Offline) is now done too**: tasks
and events are genuinely local-first, with a background sync engine,
conflict handling, and a subtle sync status indicator.

## What's here

**Phase 1 — Foundation**
- Expo Router with the 5-tab shell (Today, Calendar, Life, Insights,
  Profile) and a global **+** action
- A small design system (`lib/theme`) with light/dark tokens and base
  components (`components/ui`)
- Anonymous Supabase auth (`lib/supabase/useSession.ts`) — the app never
  forces sign-up
- Secure, chunked SecureStore-backed session storage
- A centralized entitlements layer (`lib/entitlements/`) per the
  monetization spec, backed by `subscriptions` and `app_config` tables
- Zustand for local UI state, TanStack Query for server state

**Phase 2 — Tasks, Categories, Calendar, Events, Reminders**
- Full task CRUD, deterministic prioritization (no AI) driving **Today**,
  recurring tasks, categories, month calendar + day agenda, events,
  lightweight scheduling-conflict warnings, and local notification
  reminders for both tasks and events
- `entitlements.canUseMultipleCalendars` added, matching the "Multiple
  calendars" Anchor Pro perk

**Phase 3 — Offline (this update)**
- **Local-first tasks and events.** Reads and writes go straight to
  SQLite (`local_tasks`, `local_events`) - there is no network call in
  the read path at all, and creating/editing/completing/deleting
  something never waits on connectivity
- **Client-generated permanent IDs** (`lib/sync/ids.ts`, via
  `expo-crypto`): every task/event gets its id on the device at creation
  time, and that's the same id it has on the server once synced. This is
  the architectural choice that avoids the classic "local id vs. server
  id" remapping problem entirely
- **A sync queue** (`lib/sync/queue.ts`) that coalesces repeated edits to
  the same entity into one pending operation - editing an offline task
  three times before it ever syncs produces one queued 'upsert' with the
  latest data, not three
- **A sync engine** (`lib/sync/engine.ts`):
  - `flushQueue()` pushes every queued change to Supabase, one at a time;
    one failing entry doesn't block the rest
  - `pullRemoteChanges()` merges server state into the local tables on
    app start and on reconnect, skipping any row with a pending local
    edit so a pull can't clobber work in progress, and pruning local rows
    that no longer exist remotely (e.g. deleted via the Supabase
    dashboard)
  - **Documented conflict rule**: last-write-wins via unconditional
    upsert. Anchor is single-user, so real conflicts only happen if the
    same account edits the same row from two devices while one was
    offline - whichever device's change reaches the server last wins.
    This is a deliberate simplification; true field-level merging isn't
    worth the complexity unless concurrent multi-device editing becomes
    common enough to cause real data loss
- **Sync triggers** (`lib/sync/useSyncLifecycle.ts`): app start (pull
  then flush), connectivity actually being restored via NetInfo (flush
  then pull), and returning to the foreground while already online (a
  lightweight flush safety net)
- **Subtle sync status** (spec section 49): a small dot + label -
  Synced / Saving… / Offline / Waiting to sync - shown on Today, backed
  by a Zustand store (`store/useSyncStore.ts`) so any screen could show
  it without re-deriving the logic
- Categories and calendars (read-only so far) are also cached locally so
  their pickers keep working offline

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project.
2. Go to **Authentication → Sign In / Providers** and enable **Anonymous
   Sign-Ins**.
3. Go to **Settings → API** and copy the **Project URL** and **anon
   public** key.

### 3. Configure environment variables

```bash
cp .env.example .env
```

### 4. Run the database migrations, in order

Open **SQL Editor** in your Supabase project and run each file in
`supabase/migrations/` **in order**:

1. `0001_init.sql` — profiles, subscriptions, ai_usage, app_config
2. `0002_tasks.sql` — categories (+ default-seeding trigger) and tasks
3. `0003_calendar.sql` — calendars (+ default-seeding trigger) and events

### 5. Start the app

```bash
npx expo start
```

## Verifying it works

- Everything from Phase 2 (tasks, categories, calendar, events,
  reminders) still works exactly the same from the UI's point of view
- Turn on **Airplane Mode**, then create a task, edit it, complete it,
  delete another one, create an event — all instant, no spinners, no
  errors. The sync badge on Today shows **Offline**
- Turn Airplane Mode back off — within a few seconds the badge moves
  through **Saving…** to **Synced**, and if you check the Supabase table
  editor, your offline changes are there
- Force-quit the app while still offline with pending changes, then
  reopen it (still offline) — your changes are still there, made purely
  from the local database
- Edit the same task's title twice in a row while offline — check the
  Supabase row after reconnecting; it reflects only the final edit, not
  an intermediate one (the queue coalesced them)

## What's intentionally not built yet

- Week/day zoomed-in calendar views — only month + day-agenda exist so far
- Calendar creation UI (the Pro "multiple calendars" perk) — schema and
  entitlement flag exist, UI doesn't yet
- The conflict-detection UX for overlapping events is a warning banner,
  not the spec's full "Reschedule / Shorten / Keep anyway" dialog
- Morning briefing / evening review (spec sections 32–33) — deferred to a
  later phase
- Categories and calendars are still read-only from the client (no
  create/edit UI) - Phase 3's offline work covers their local caching,
  but not making them editable
- **A note on verification**: this update was built and type-checked
  (`npx tsc --noEmit` passes clean) but not run on a physical device or
  simulator in this environment - the sync engine's SQLite/Supabase
  interplay is exactly the kind of thing worth exercising by hand (kill
  the app mid-sync, toggle airplane mode mid-edit, etc.) before trusting
  it with real data
- No AI features — Phase 4
- No paywall UI or actual billing integration — the entitlements *read*
  layer exists so features can check `entitlements.canUseX` from day one,
  but nothing sells anything yet
