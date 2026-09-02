# Anchor — Phases 1–6 + Phase 7 (AI Assistant)

Phases 1–6 are complete. **Phase 7 (AI Assistant) is now done** — though
most of it turned out not to need AI at all.

## What's here

**Phases 1–6**: navigation shell, design system, anonymous auth,
entitlements, local-first tasks/events/categories/calendars/expenses/
bills/notes/habits/shopping/documents/subjects/assignments with a
background sync engine, reminders, Brain Dump, daily AI planning, a
deterministic Quick Add parser, and opt-in Student Mode.

**Phase 7 — AI Assistant (this update)**

Section 14 of the master spec is explicit: "Do not rely entirely on AI.
Use deterministic logic." Applied to this phase, that meant building
Daily Briefing, Evening Review, and Smart Reminders as pure calculations
— they don't need a language model, they need arithmetic and calendar
math, and pure functions are something I can actually test, unlike a
live AI call.

- **Daily Briefing** (`lib/insights/dailyBriefing.ts`, spec section 32):
  shown on Today before 6pm. Counts today's important tasks,
  appointments, upcoming bills, and due habits; names the single most
  important task; estimates total workload from tasks' estimated
  durations — matching the spec's own mockup fields exactly, including
  the "2h 15m" formatting
- **Evening Review** (`lib/insights/eveningReview.ts`, spec section 33):
  replaces the Daily Briefing on Today from 6pm onward. Tasks/habits
  completed today, what's still open, what's on tomorrow
- **Smart Reminders, done deterministically** (`lib/insights/freeTime.ts`):
  spec section 17's own example — "You have 90 minutes free this
  afternoon. Want to work on X?" — is exact calendar-gap math, not
  something an LLM adds value to. Finds today's largest free gap and
  matches it against a pending task whose estimated duration fits.
  Required adding an **estimated-duration field to the task composer**
  (15m/30m/1h/2h chips), since this feature had nothing to match against
  otherwise
- **Personalized Planning / "reset personalization"** (spec section 21):
  scoped down honestly — there's no persisted, evolving preference
  model here (that would need real usage data over time to be
  meaningful), so "reset" is a straightforward on/off toggle on Profile
  that stops the free-time suggestion from appearing at all. Documented
  as a deliberate simplification in the code, not a hidden gap
- **The Insights tab is real now** (spec section 31, a placeholder since
  Phase 1): Productivity (completion rate, overdue count, average time
  to complete), Time (workload for the next 7 days, tasks by category),
  Money (this month's summary, spending by category, a 3-month trend —
  reusing Phase 5's expense calculations, plus a new
  `computeMonthlyTrend`), and Habits (streak + 30-day consistency per
  habit). Deliberately calm, no rankings or comparisons — "the goal is
  awareness rather than competition," per the spec

## Setup

No new database migration this update — Phase 7 is entirely
client-side logic and UI, no new tables.

```bash
npm install
npx expo start
```

(Standard setup from previous updates otherwise — Supabase project,
`.env`, migrations `0001`–`0007`.)

## Verifying it works

- Open the app before 6pm — Today should show a "TODAY YOU HAVE" card
  summarizing counts, your most important task, and an estimated
  workload (only if at least one of today's tasks has an estimated
  duration set)
- Change your device clock to after 6pm (or just check back in the
  evening) — the card becomes "YOUR DAY" instead, showing what got done
- Create a task with an estimated duration (e.g. 30m), leave it
  unscheduled, and make sure you have at least a 30-minute gap in your
  calendar today — a "You have N minutes free..." card should appear
  suggesting that task
- Turn off **Personalized suggestions** on Profile — that card stops
  appearing
- Check the **Insights** tab — it should now show real numbers, not a
  placeholder. Complete a few tasks and habits, log some expenses, and
  watch the numbers update

## What's intentionally not built yet

- Repeating morning/evening push notifications for the Briefing/Review
  (they're in-app cards only for now) — this would need Expo's
  calendar-based repeating notification triggers, which I chose not to
  ship without being able to test that a `repeats: true` trigger
  actually behaves correctly on a real device
- A genuinely learned personalization model (preferred working hours
  inferred from behavior, etc.) — the current free-time suggestion uses
  fixed 8am–9pm day bounds, not an adapted schedule
- Workload-by-day and category distribution in Insights are lists, not
  charts/bars — a natural follow-up once a charting approach is chosen
- No paywall UI or actual billing integration — entitlements and AI
  quota enforcement (Phase 4) are real, but nothing sells anything yet

## Onward

With Phase 7 done, what's left from the master spec: **Phase 8**
(widgets — Today/Quick Add/Habit/Countdown), **Phase 9**
(polish/accessibility/App Store prep) — plus the monetization spec's
paywall and actual billing integration, still untouched.


