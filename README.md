# Anchor — Phase 1 + Phase 2 (in progress)

Phase 1 (foundation) is complete. Phase 2 (Core Anchor) is underway:
**Tasks, Categories, and recurring tasks are done**; Calendar/Events and
Reminders (local notifications) are the next slice.

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

**Phase 2 — Tasks & Categories (this update)**
- `categories` table, auto-seeded with the 10 default categories the
  moment a profile is created (spec section 29)
- `tasks` table: title, description, due date/time, priority, status,
  category, and an optional recurrence rule
- Full task CRUD (`features/tasks/`) with optimistic completion/deletion
  so the UI updates instantly, never waiting on the network round trip
- Deterministic task prioritization (`lib/tasks/prioritization.ts`, no
  AI) driving what shows up on **Today** — pure functions, easy to unit
  test
- Recurring tasks: completing a recurring task generates only its next
  occurrence (`lib/tasks/recurrence.ts`), never a batch of future rows
  (spec section 18)
- Quick task creation with progressive disclosure — title only by
  default, due date/repeat/priority/category behind "More options"
  (spec section 44)
- Swipeable task rows (swipe to complete / delete), plus a tap-to-complete
  checkbox
- **Today** now shows real prioritized tasks and a "Your Life" category
  breakdown instead of the Phase 1 empty state

## Setup

### 1. Install dependencies

```bash
npm install
```

(`.npmrc` already sets `legacy-peer-deps=true`, needed because Expo
Router's optional web tooling pulls in React-DOM-only peer deps we don't
need for a mobile-only app.)

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project (free tier is
   fine).
2. Once it's provisioned, go to **Authentication → Sign In / Providers**
   and enable **Anonymous Sign-Ins**.
3. Go to **Settings → API** and copy the **Project URL** and the
   **anon public** key.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Paste your Project URL and anon key into `.env`. This file is already
git-ignored.

### 4. Run the database migrations, in order

Open **SQL Editor** in your Supabase project and run each file in
`supabase/migrations/` **in order**:

1. `0001_init.sql` — profiles, subscriptions, ai_usage, app_config
2. `0002_tasks.sql` — categories (+ default-seeding trigger) and tasks

### 5. Start the app

```bash
npx expo start
```

Scan the QR code with Expo Go (iOS/Android), or press `i` / `a` for a
simulator/emulator if you have one set up.

## Verifying it works

- The app opens straight to **Today** with no sign-up screen
- **Today** shows "Nothing demanding your attention yet" the first time
  (no tasks exist yet)
- Tap **+** → **Task**, type a title, tap **Save task** — it appears on
  Today within its priority slot
- Expand **More options** when creating a task to set a due date,
  priority, category, and (once a due date is set) a repeat frequency
- Swipe a task right to complete it, left to delete it, or tap its
  checkbox — completion feels instant even before the network responds
- Complete a task with **Repeat** set to anything other than "Never" —
  a new task with the next due date appears; there's still only ever one
  pending instance of it at a time
- Turn off Wi-Fi/data: the app still opens and Profile still renders from
  local cache (task changes will need Phase 3's sync engine to work fully
  offline — see below)
- **Profile** still shows "Anchor Free · 10 AI actions per month" pulled
  from `app_config`, not hardcoded

## What's intentionally not built yet

- **Calendar/Events and Reminders** — the next slice of Phase 2
- No sync engine — task changes go straight to Supabase; true offline
  task creation/editing (queued locally, synced later) is Phase 3
- No AI features — Phase 4
- No paywall UI or actual billing integration (RevenueCat/StoreKit/Play
  Billing) — the entitlements *read* layer exists so features can check
  `entitlements.canUseX` from day one, but nothing sells anything yet
- Task attachments, subtasks, and drag-to-reorder are deferred; the
  `tasks` table and types are structured so they can be added without a
  schema rewrite

