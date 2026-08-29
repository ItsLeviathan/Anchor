# Anchor — Phase 1 + Phase 2 + Phase 3 + Phase 4

Phases 1–3 are complete. **Phase 4 (Intelligence) is now scaffolded**:
Brain Dump, AI daily planning, and a deterministic (non-AI) Quick Add
parser. Read the "Please read before trusting this" section below before
deploying the AI parts — this phase touches infrastructure (a real
Supabase Edge Function calling a real AI provider) that could not be
exercised end-to-end in the environment this was built in.

## What's here

**Phase 1 — Foundation.** Navigation shell, design system, anonymous
auth, entitlements layer, local persistence.

**Phase 2 — Tasks, Categories, Calendar, Events, Reminders.** Full task
CRUD, deterministic prioritization, recurring tasks, month calendar + day
agenda, events, scheduling-conflict warnings, local notification
reminders.

**Phase 3 — Offline.** Tasks and events are local-first with a
background sync engine, a documented last-write-wins conflict rule, and
a subtle sync status indicator.

**Phase 4 — Intelligence (this update)**

- **Supabase Edge Function** (`supabase/functions/ai-assist/`) — the only
  place that ever talks to an AI provider. Handles two actions:
  - `brain_dump`: turns free text into a structured, categorized list of
    tasks (spec sections 19, 21, 22)
  - `daily_plan`: a short natural-language focus recommendation, built
    from *deterministically* fetched tasks/events (never from
    client-supplied data) — this is the "smart" layer on top of, not a
    replacement for, Phase 2's deterministic prioritization
  - Uses Claude (Anthropic's Messages API) with a forced tool call for
    structured JSON output — no fragile prose parsing
  - **Quota is enforced server-side**, re-deriving the same entitlement
    logic the client uses (mirrors `lib/entitlements/`) rather than
    trusting the client's copy, per the monetization spec
  - Uses Supabase's current recommended pattern for Edge Functions:
    `withSupabase` from `@supabase/server`, which handles auth, CORS, and
    gives you both an RLS-scoped client and a service-role
    (`supabaseAdmin`) client. `ai_usage` rows are written with the
    service-role client, since that table's RLS intentionally has no
    insert policy for regular users
- **Brain Dump** (`features/brain-dump/`): write freely, tap **Organize
  this**, review the extracted items grouped by category with everything
  pre-selected, uncheck anything you don't want, confirm. Nothing is
  created until you confirm (spec section 22) — the created tasks go
  through the same local-first `createTask` path as manual task creation,
  so they're offline-capable too
- **"Plan my day"** card on Today (`features/ai/DailyPlanCard.tsx`):
  optional, collapsed until tapped, never auto-loads. If the AI names a
  single most-important task, that task gets a subtle highlighted border
  in the list below — it doesn't reorder anything
- **Deterministic Quick Add parser** (`lib/ai/quickAddParser.ts`, zero
  AI, zero network): recognizes dates ("tomorrow", "next Friday", "in 3
  days"), times ("3 PM"), and currency amounts, and picks a type (task /
  event / bill) accordingly — exactly the spec's own examples ("Buy
  groceries tomorrow", "Dentist Friday at 3 PM", "Electricity bill
  ₱1,500 due Monday") pass as written. Wired into the task composer as a
  tappable "Detected Friday · 3:00 PM — tap to use" suggestion that only
  appears while no date has been set yet, so it never fights a deliberate
  manual pick
- **Honest quota UI** (`components/ai/AiLimitReachedNotice.tsx`): matches
  the monetization spec's exact free-limit copy. Its "Explore Anchor Pro"
  option shows the perk list and says plainly that purchasing isn't wired
  up yet — no dead-end fake upgrade button

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project (if you haven't already)

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

1. `0001_init.sql`
2. `0002_tasks.sql`
3. `0003_calendar.sql`

(No new migration for Phase 4 — it only adds an Edge Function.)

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

- **Without deploying the Edge Function at all**, Quick Add detection
  still works: create a task titled "Buy groceries tomorrow" and watch
  the "Detected Tomorrow — tap to use" suggestion appear
- Tap **+** → **Brain Dump**, write a few things ("finish the report,
  buy milk, pay rent Friday"), tap **Organize this** — you should see a
  categorized, pre-checked list; uncheck one, tap **Add N tasks**, and
  confirm the right ones landed on Today
- On Today, tap **Plan my day** — a short plan should appear, and if it
  names a specific task, that task gets a highlighted border below
- Use up your monthly AI actions (or lower `free_ai_monthly_limit` in
  `app_config` to `0` temporarily) and try Brain Dump again — you should
  see the honest limit-reached card, not a crash or a generic error

## Please read before trusting this with real data

The Edge Function code was written against Supabase's current documented
conventions (verified by search at build time, since this SDK's
recommended pattern changed recently — `withSupabase` from
`@supabase/server` is now preferred over the older manual `Deno.serve` +
manual CORS/JWT approach) and against Anthropic's Messages API tool-use
format. **None of it has actually been deployed or run** — there's no
live Supabase project or Anthropic API key in the environment this was
built in. Before relying on it:

- Deploy it and send it a real request (`supabase functions serve
  ai-assist` locally first, then a real deploy) and confirm the response
  shape actually matches what the client expects
- Confirm `ctx.userClaims.id` is really where `@supabase/server` puts the
  user id in your installed version — check `npm:@supabase/server`'s own
  docs/changelog if this errors, since this is a newer package
- Confirm the quota check's month-boundary math and the
  `free_ai_monthly_limit` read behave as expected with real data in
  `ai_usage`
- Watch your Anthropic usage/billing dashboard the first few times —
  nothing here caps *total* spend beyond the per-user monthly action
  count

## What's intentionally not built yet

- Task Breakdown (turning one task into subtasks) — needs a subtasks
  schema/UI that doesn't exist yet
- AI weekly review, AI expense categorization, AI document extraction —
  later AI capabilities from spec section 21, not part of Phase 4's
  scope (Brain Dump, Quick Add, Daily Planning)
- Week/day zoomed-in calendar views, calendar-creation UI, subtasks,
  Notes, Expenses, Bills, Documents, Habits, Shopping, Student Mode — all
  still ahead (Phase 5+)
- No paywall UI or actual billing integration — entitlements and quota
  enforcement are real, but nothing sells anything yet
