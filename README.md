# Anchor — Phases 1–5 + Phase 6 (Student Mode)

Phases 1–5 are complete (every option in the global **+** sheet does
something real). **Phase 6 (Student Mode) is now done.**

## What's here

**Phases 1–5**: navigation shell, design system, anonymous auth,
entitlements, local-first tasks/events/categories/calendars/expenses/
bills/notes/habits/shopping/documents with a background sync engine,
reminders, Brain Dump, daily AI planning, a deterministic Quick Add
parser.

**Phase 6 — Student Mode (this update)**

- **Off by default, opt-in via a toggle on Profile** — spec section 30's
  explicit instruction is "do not let Student Mode overwhelm the general
  experience." A non-student's app looks identical to before this update
  unless they turn it on
- **Subjects**: name, instructor, an auto-assigned color
- **Assignments, exams, and projects share one table via a `kind`
  column**, rather than three separate tables. This matches the master
  spec's own suggested schema (section 37 lists only `subjects` and
  `assignments`, not a separate `exams` table) and meant one new sync
  entity type covers all three, not three
- **Study sessions were NOT built as a new entity at all** — they're
  just regular Calendar events. An event already has everything a study
  session needs (title, start/end time, automatic reminders); a
  dedicated table would only have duplicated that. If Student Mode ever
  needs session-specific data (e.g. tracking actual vs. planned study
  time), that's the point to reconsider this
- **A "Student" section appears on Life** (last section, only when
  enabled) showing each subject as a card with its pending items sorted
  by due date — matching the spec's own mockup layout (subject name,
  then Assignment/Exam/Project rows with dates) — with tap-to-complete
  and per-item delete
- New assignments/exams/projects are created from a **+** on each
  subject card (not the global Add sheet — Student Mode items
  deliberately aren't in that universal 10-option list, keeping it lean
  for everyone else)
- `entitlements.canUseAdvancedStudentMode` (declared back in Phase 1's
  scaffolding) still isn't gating anything concrete — the monetization
  spec says Free gets "Basic Student Mode" and Pro gets "Advanced
  Student Mode" without specifying what "advanced" means. Rather than
  invent an arbitrary restriction, Student Mode works the same for
  everyone in this build; the flag is there and ready once a concrete
  advanced capability (e.g. AI syllabus parsing) is actually built

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
6. `0006_documents.sql`
7. `0007_student_mode.sql` ← new this update (adds a column to the
   existing `profiles` table, plus the new `subjects` and `assignments`
   tables)

### 5. Deploy the AI Edge Function (optional, from Phase 4)

See the Phase 4 update notes if you haven't already.

### 6. Start the app

```bash
npx expo start
```

## Verifying it works

- With Student Mode off, **Life** should look exactly like it did before
  this update — no new section, nothing different
- Go to **Profile**, turn on **Student Mode** — a "Student" section
  should now appear at the bottom of **Life**
- Tap **+ Subject**, add one (e.g. "Database Systems")
- On that subject's card, tap the **+** to add an Exam due in a few days
  — it should show up under the subject sorted by date
- Tap the item's circle to mark it complete — it disappears from the
  pending list (matching how tasks/habits behave elsewhere)
- Turn Student Mode back off — the section disappears again; your
  subjects/assignments aren't deleted, just hidden, and come back if you
  re-enable it
- Try all of the above offline — same instant, no-spinner behavior as
  everything else local-first

## What's intentionally not built yet

- Assignments/exams don't surface on **Today** alongside tasks — kept
  scoped to Life's Student section for this pass, to avoid any
  Student-Mode complexity bleeding into the core experience non-students
  see every day
- Attendance tracking (mentioned in spec section 30's broader vision, but
  not part of Phase 6's actual build list in section 51)
- Subject editing, assignment editing (only create/complete/delete exist)
- Any concrete "Advanced Student Mode" capability for
  `canUseAdvancedStudentMode` to gate

## Onward

With Phase 6 done, what's left from the master spec: **Phase 7** (AI
Assistant: daily briefing, evening review, smart reminders, AI
insights), **Phase 8** (widgets), **Phase 9** (polish/accessibility/App
Store prep) — plus the monetization spec's paywall and actual billing
integration, which still hasn't been started at all.
