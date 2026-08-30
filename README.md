# Anchor — Phases 1–4 + Phase 5 (Expenses, Bills, Notes, Habits, Shopping)

Phases 1–4 are complete. **Phase 5 is now done except for Documents**,
which needs Supabase Storage (file upload) — a genuinely different
technical surface from everything else built so far, and one I want to
treat carefully with its own update rather than rush in alongside
everything else.

## What's here

**Phases 1–4**: navigation shell, design system, anonymous auth,
entitlements, local-first tasks/events/categories/calendars with a
background sync engine, reminders, Brain Dump, daily AI planning, and a
deterministic Quick Add parser.

**Phase 5 — Expenses & Bills**: income/expense tracking with a real
monthly summary, bills with optional recurrence, paying a bill logs the
matching expense and spawns the next occurrence automatically.

**Phase 5 — Notes, Habits & Shopping (this update)**

- **Notes**: title (optional), content, comma-separated tags, pin
  toggle. Pinned notes sort first
- **Habits**: daily or specific-weekday frequency, tap-to-complete for
  today, streak calculation (`lib/habits/streak.ts`, pure and tested) —
  a streak isn't considered "broken" just because today hasn't happened
  yet, and a zero/reset streak reads as "Start today," never anything
  shame-y, per spec section 27. Due-today habits also show on **Today**,
  not just **Life**
- **Shopping**: one auto-seeded default list per user (same simplified
  pattern as the default calendar) with quick add-item, tap-to-check-off,
  and a "Clear" action for checked-off items
- **Sync engine extended again**, same adapter pattern from the
  Expenses/Bills update — three more entity types (`note`, `habit`,
  `shopping_list`) registered, zero changes needed to `flushQueue` /
  `pullRemoteChanges` / `enqueueDelete` themselves
- **Two deliberate simplifications, documented in the migration file**:
  a habit's completion history and a shopping list's items are stored as
  JSON arrays directly on their own row, rather than separate join
  tables. This keeps both as a single sync entity (one queue entry per
  edit) instead of two. Worth revisiting if either needs richer
  per-entry data later
- **Life tab** now has four sections: Money, Habits, Shopping, Notes —
  each with its own quick-add link

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
5. `0005_notes_habits_shopping.sql` ← new this update

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

- Tap **+** → **Note**, save one with a couple of tags — it shows up
  under Notes on Life; tap the bookmark icon to pin it, it should jump
  to the top
- Tap **+** → **Habit**, create a daily one — it shows up on both
  **Today** (in a HABITS section) and **Life**; tap it a few days in a
  row (or manually adjust dates in Supabase to test the streak math) and
  confirm the streak count is right
- Tap **+** → **Shopping item** a few times — items land in the one
  default list, shown on Life; check a couple off, confirm "Clear"
  removes only the checked ones
- Turn on Airplane Mode and repeat all of the above — same offline-first
  behavior as everything else: instant, no spinners, syncs on reconnect

## What's intentionally not built yet

- **Documents** — the last piece of Phase 5, deferred because it needs
  Supabase Storage (private buckets, signed URLs, a file picker) rather
  than just another Postgres table, and deserves its own careful pass
- Note editing (only create/pin/delete exist), note attachments, note AI
  actions (summarize/extract tasks — spec section 26, not part of Phase
  5's own scope per section 51)
- Multiple shopping lists (schema already supports it; no UI for
  managing more than the one auto-seeded list yet)
- Habit category assignment, habit archiving, consistency trend charts
  (spec section 27's "trends" — not built, Insights is later territory)
- Bill/expense editing, spending trend charts
- No paywall UI or actual billing integration — entitlements and AI
  quota enforcement are real, but nothing sells anything yet
