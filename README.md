# Anchor — Phase 1: Foundation

This is the foundation layer of Anchor: navigation shell, design system,
anonymous auth, local-first persistence, and the entitlements/monetization
plumbing. No task/calendar/expense features exist yet — that's Phase 2 and
onward. See the two spec docs this was built from for the full roadmap.

## What's here

- Expo Router with the 5-tab shell (Today, Calendar, Life, Insights,
  Profile) and a global **+** action that opens a modal listing every
  creation type from the spec (selecting one just closes the sheet for now
  — real creation flows land in later phases)
- A small design system (`lib/theme`) with light/dark tokens and base
  components (`components/ui`)
- Anonymous Supabase auth (`lib/supabase/useSession.ts`) — the app never
  forces sign-up
- Secure, chunked SecureStore-backed session storage
  (`lib/supabase/secureStorage.ts`)
- A minimal local-first SQLite layer (`lib/database/db.ts`) proving
  write-then-read works instantly, offline
- A centralized entitlements layer (`lib/entitlements/`) per the
  monetization spec: pure `deriveEntitlements()` logic + a `useEntitlements`
  hook, backed by `subscriptions` and `app_config` tables with RLS that
  makes the client physically unable to grant itself Pro access
- Zustand for local UI state, TanStack Query for server state — kept
  separate on purpose

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

### 4. Run the database migration

Open **SQL Editor** in your Supabase project, paste the contents of
`supabase/migrations/0001_init.sql`, and run it. This creates:

- `profiles` (auto-populated on sign-up via a trigger)
- `subscriptions` and `ai_usage` (read-only to clients — writes only ever
  happen from a service-role Edge Function in a later phase)
- `app_config` (remote-config style table; seeded with
  `free_ai_monthly_limit = 10`)

### 5. Start the app

```bash
npx expo start
```

Scan the QR code with Expo Go (iOS/Android), or press `i` / `a` for a
simulator/emulator if you have one set up.

## Verifying Phase 1 works

- The app opens straight to **Today** with no sign-up screen (anonymous
  session created automatically)
- Tapping the center **+** button opens the Add sheet as a modal
- **Profile** shows "Signed in anonymously," confirms local caching, and
  shows "Anchor Free · 10 AI actions per month" (pulled from the
  `app_config` table, not hardcoded)
- Turn off Wi-Fi/data: the app still opens and Profile still renders from
  local cache
- Toggle your device's dark mode: colors switch without a restart

## What's intentionally not built yet

- No real tasks, events, bills, or any other content type — Phase 2+
- No sync engine (local writes aren't pushed to Supabase yet) — Phase 3
- No AI features — Phase 4
- No paywall UI or actual billing integration (RevenueCat/StoreKit/Play
  Billing) — the entitlements *read* layer exists so features can check
  `entitlements.canUseX` from day one, but nothing sells anything yet
