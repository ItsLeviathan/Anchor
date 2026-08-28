# Anchor — Phase 1 + Phase 2

Phase 1 (foundation) is complete. Phase 2 (Core Anchor) is now complete:
**Tasks, Categories, recurring tasks, Calendar, Events, and Reminders**
are all done.

## What's here

**Phase 1 — Foundation**
- Expo Router with the 5-tab shell (Today, Calendar, Life, Insights,
  Profile) and a global **+** action
- A small design system (`lib/theme`) with light/dark tokens and base
  components (`components/ui`)
- Anonymous Supabase auth (`lib/supabase/useSession.ts`) — the app never
  forces sign-up
- Secure, chunked SecureStore-backed session storage
- A minimal local-first SQLite layer (`lib/database/db.ts`)
- A centralized entitlements layer (`lib/entitlements/`) per the
  monetization spec, backed by `subscriptions` and `app_config` tables
- Zustand for local UI state, TanStack Query for server state

**Phase 2 — Tasks & Categories**
- `categories` table, auto-seeded with the 10 default categories the
  moment a profile is created (spec section 29)
- `tasks` table: title, description, due date/time, priority, status,
  category, and an optional recurrence rule
- Full task CRUD (`features/tasks/`) with optimistic completion/deletion
- Deterministic task prioritization (`lib/tasks/prioritization.ts`, no AI)
  driving what shows up on **Today**
- Recurring tasks: completing one generates only its next occurrence
  (`lib/tasks/recurrence.ts`), never a batch of future rows
- Quick task creation with progressive disclosure (spec section 44)
- Swipeable task rows (swipe to complete / delete)

**Phase 2 — Calendar & Events**
- `calendars` table, auto-seeded with one default calendar per user.
  Creating *additional* calendars is an Anchor Pro perk ("Multiple
  calendars" in the monetization spec) — the schema and a new
  `entitlements.canUseMultipleCalendars` flag exist now, but the calendar-
  creation UI itself isn't built yet, so every event currently goes on the
  single default calendar
- `events` table: title, location, start/end, all-day flag
- **Calendar** tab shows a real month grid (with a dot on any day that has
  a task due or an event) and a day agenda combining that day's tasks and
  events, sorted by time
- Event creation (`features/events/EventComposer.tsx`) with an all-day
  toggle and start/end pickers
- Lightweight scheduling-conflict detection (spec section 15): an
  overlapping event shows an inline warning naming the conflict. This is
  intentionally non-blocking — there's no modal "Reschedule / Shorten /
  Keep anyway" flow yet, just a visible nudge you can also ignore
- `components/tasks/DueDatePicker.tsx` was generalized with a
  `mode="date"` option (for all-day events) and is now shared by both the
  task and event composers

**Phase 2 — Reminders (this update)**
- Local notifications via `expo-notifications` — no server/push
  infrastructure involved, so these work in Expo Go with no dev build
- Tasks with a due date get a local reminder automatically: at the due
  time if one is set, or 9:00 AM on the due date otherwise. Content is
  specific per spec section 17 ("Pay electricity bill" → notification
  titled with the task, not a generic "Reminder")
- Events get a reminder 15 minutes before they start (all-day events are
  skipped — there's no single meaningful "15 minutes before" for those)
- Reminders are automatically rescheduled when a task/event's time
  changes, and cancelled when it's completed or deleted. Completing a
  recurring task also schedules the reminder for its freshly-spawned next
  occurrence
- Notification permission is only requested the first time it's actually
  needed (creating your first dated task or event) — not on app launch —
  to keep with the "calm" design philosophy of not front-loading prompts
- A **Task & event reminders** on/off toggle on Profile (spec section 16:
  "users must have granular notification controls"). This preference is
  device-local by design — it's about what this device shows you, not
  something that needs to sync

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

- Tap **+** → **Task**, set a due date/time a few minutes in the future,
  save it, then background the app (or lock the phone) — the reminder
  fires at the due time
- Tap **+** → **Event** (or the **+** icon on the Calendar tab): set a
  start time a few minutes out, save — a reminder fires 15 minutes before
  (or immediately, if the start is under 15 minutes away, no reminder
  fires since it'd be in the past)
- Complete or delete a task/event before its reminder time — the
  notification never fires (it was cancelled)
- Turn off **Task & event reminders** on Profile — no new reminders get
  scheduled until you turn it back on
- Everything from the Tasks/Categories and Calendar/Events updates still
  works the same way

## What's intentionally not built yet

- Week/day zoomed-in calendar views — only month + day-agenda exist so far
- Calendar creation UI (the Pro "multiple calendars" perk) — schema and
  entitlement flag exist, UI doesn't yet
- The conflict-detection UX is a warning banner, not the spec's full
  "Reschedule / Shorten / Keep anyway" dialog
- Morning briefing / evening review (spec sections 32–33) — related to
  but distinct from Reminders, and deferred to a later phase
- No sync engine — task/event changes go straight to Supabase; true
  offline creation/editing (queued locally, synced later) is Phase 3
- No AI features — Phase 4
- No paywall UI or actual billing integration — the entitlements *read*
  layer exists so features can check `entitlements.canUseX` from day one,
  but nothing sells anything yet



