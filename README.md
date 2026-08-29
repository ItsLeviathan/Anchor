# Anchor — Phases 1–4 + Phase 5 (part 1: Expenses & Bills)

Phases 1–4 are complete. **Phase 5 covers Expenses, Bills, Documents,
Notes, Habits, and Shopping — this update ships Expenses + Bills** (they
overlap naturally: paying a bill logs an expense). Documents, Notes,
Habits, and Shopping follow in later updates, same incremental approach
as every phase so far.

## What's here

**Phases 1–4**: navigation shell, design system, anonymous auth,
entitlements, local-first tasks/events/categories/calendars with a
background sync engine, reminders, Brain Dump, daily AI planning, and a
deterministic Quick Add parser. See prior update notes for details.

**Phase 5, part 1 — Expenses & Bills (this update)**

- `expenses` and `bills` tables (spec sections 23–24), both local-first
  through the same sync engine as tasks/events
- **The sync engine was refactored** from hardcoded task/event branches
  into a generic entity-adapter registry
  (`lib/sync/engine.ts`). Adding expenses and bills was then just:
  write a local repo + a remote repo (same shape as the existing ones)
  and register them — `flushQueue`, `pullRemoteChanges`, and
  `enqueueDelete` didn't need to change at all. This sets up Documents,
  Notes, Habits, and Shopping to plug in the same way later
- **A real bug caught and fixed**: PostgREST returns Postgres `numeric`
  columns as JSON strings, not JS numbers (to preserve precision). The
  remote fetch functions for expenses/bills now explicitly coerce
  `amount` to a number — without this, summing expenses would have done
  string concatenation instead of addition the first time a row came back
  from a pull
- **Another real bug caught and fixed, in an existing Phase 1 component**:
  `components/ui/Input.tsx` spread `{...props}` *after* its internal
  `style` prop, so any caller passing its own `style` (as the expense
  composer now does, for a large amount field) would silently wipe out
  all the built-in border/padding/background styling instead of merging
  with it. Fixed by destructuring `style` out and merging it into the
  style array properly - the same pattern `Card` already used correctly
- **Expense tracking**: income/expense toggle, the 9 fixed categories
  from spec section 23, date, optional notes. A pure, tested
  `computeMonthlySummary()` (`lib/expenses/summary.ts`) drives the "This
  month" card on **Life** — income, expenses, remaining, matching the
  spec's own mockup exactly
- **Bills**: name, amount, category, due date, optional recurrence.
  Marking a bill paid does two things at once: logs the matching expense
  automatically, and — for recurring bills — spawns the next occurrence
  the same lazy, one-at-a-time way recurring tasks do (spec section 18)
- **Life tab is real now** instead of a placeholder: a Money summary
  card and an upcoming-bills list with tap-to-mark-paid

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2–3. Supabase project + env vars

Same as previous updates — see earlier README sections if this is a
fresh setup.

### 4. Run the database migrations, in order

1. `0001_init.sql`
2. `0002_tasks.sql`
3. `0003_calendar.sql`
4. `0004_expenses_bills.sql` ← new this update

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

- Tap **+** → **Expense**: log something as an expense, then log
  something else as income — check **Life**, the "This month" card
  should reflect both correctly
- Tap **+** → **Bill** (or **+ Bill** on the Life tab): create a bill
  with a repeat frequency, e.g. monthly
- Tap the bill's checkbox to mark it paid — it disappears from "Upcoming
  bills", and a matching expense (category: whatever the bill's category
  was, amount matching) should now show up reflected in the money summary
- Because it was recurring, a new unpaid bill for next month's due date
  should already be waiting
- Turn on Airplane Mode and repeat all of the above — same offline-first
  behavior as tasks/events (instant, no spinners, syncs once you
  reconnect)

## What's intentionally not built yet

- Documents, Notes, Habits, Shopping — the rest of Phase 5
- Expense/bill editing (only create/delete exist so far, no update flow)
- Spending trends and category breakdown charts (spec section 23's
  "trends" — `computeCategoryTotals()` already exists as a pure function
  for this, just not wired into any chart UI yet; that's Insights/Phase
  9-adjacent territory)
- Bill reminders (local notifications) — tasks and events have them
  (Phase 2), bills don't yet
- Document expiration notifications, AI expense categorization, AI
  document extraction — later AI capabilities from spec section 21
- No paywall UI or actual billing integration — entitlements and AI
  quota enforcement are real, but nothing sells anything yet
