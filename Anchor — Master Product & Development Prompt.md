# ANCHOR
## Master Product, UX & Development Specification

**Product Name:** Anchor

**Tagline:** Keep your life together.

---

# 1. PRODUCT VISION

Build a premium cross-platform mobile application called **Anchor**.

Anchor is a personal life-management system designed to help people organize the responsibilities, commitments, thoughts, and information they carry every day.

The central problem is:

> People have too many things to remember.

Tasks, appointments, bills, school deadlines, documents, habits, shopping, notes, personal responsibilities, and plans are scattered across different applications—or simply kept inside someone's head.

Anchor brings these things together into one calm, intelligent environment.

The fundamental product promise is:

> **You live your life. Anchor remembers the rest.**

Anchor should not feel like another generic productivity app.

It should feel like a quiet personal assistant that helps users stay grounded.

---

# 2. PRODUCT PHILOSOPHY

Anchor is built around five principles.

## Calm

The interface should reduce cognitive load.

The user should feel:

> "I know what I need to do."

Not:

> "I have even more things to manage."

## Intelligent

AI should quietly help organize information, identify priorities, and suggest actions.

AI should not dominate the interface.

## Personal

Anchor should gradually adapt to the user's routines and preferences.

## Private

Anchor will contain highly personal information.

Privacy must therefore be part of the architecture, not an afterthought.

## Reliable

Users should trust Anchor to remember important things.

If the internet disappears, their information should still be accessible.

---

# 3. TARGET USERS

Anchor is designed for everyone.

Do not design the core product specifically around:

- students
- professionals
- parents
- entrepreneurs

Instead, create a universal foundation.

Users can optionally activate specialized functionality such as **Student Mode**.

Examples of users:

### Student

Assignments, exams, thesis, schedule, expenses, habits.

### Professional

Meetings, deadlines, bills, documents, personal tasks.

### Parent

Appointments, shopping, family responsibilities, bills.

### Freelancer

Projects, invoices, deadlines, clients, personal responsibilities.

### Everyday user

Groceries, reminders, habits, appointments, expenses, documents.

The core experience should work for all of them.

---

# 4. PLATFORM

Build Anchor for:

- iOS
- Android

Use a shared codebase.

---

# 5. TECHNOLOGY STACK

Use the following stack.

## Frontend

- React Native
- Expo
- TypeScript
- Expo Router
- React Native Reanimated
- React Native Gesture Handler

Use modern React Native architecture.

Avoid unnecessary native complexity.

---

# 6. BACKEND

Use:

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Edge Functions

Use PostgreSQL as the primary source of truth.

---

# 7. STATE MANAGEMENT

Use:

- Zustand for local/application state
- TanStack Query for server state

Do not put all application data into one global state object.

Separate:

- UI state
- local domain state
- server state
- synchronization state

---

# 8. LOCAL-FIRST CAPABILITY

Anchor is cloud-first but offline-capable.

Users must be able to continue using the application without an internet connection.

Use SQLite or another reliable Expo-compatible local persistence solution.

The architecture should look like:

```text
                 ┌─────────────────┐
                 │   Anchor App    │
                 └────────┬────────┘
                          │
                 ┌────────▼────────┐
                 │ Local Database  │
                 └────────┬────────┘
                          │
                     Sync Engine
                          │
                    Internet?
                     /        \
                   YES         NO
                    │           │
                    ▼           ▼
               Supabase     Keep working
                    │
                    ▼
                PostgreSQL
```

Local changes must synchronize automatically when connectivity returns.

---

# 9. PRIVACY PHILOSOPHY

Anchor may contain:

- financial information
- private notes
- documents
- schedules
- habits
- school information
- personal thoughts

Treat this information as highly sensitive.

Implement:

- Row Level Security
- private storage buckets
- secure authentication
- secure token storage
- HTTPS
- signed URLs
- account deletion
- data export
- app lock
- biometric authentication

Never expose:

- Supabase service-role keys
- AI API keys
- database credentials

inside the mobile application.

---

# 10. AI ARCHITECTURE

AI must run through secure backend infrastructure.

Use:

```text
Anchor Mobile App
        ↓
Supabase Edge Function
        ↓
AI Provider
```

Never put provider API keys inside the application.

AI should receive only the minimum information necessary.

The application should still function when AI is disabled.

---

# 11. PRIMARY NAVIGATION

Use five primary navigation destinations:

1. **Today**
2. **Calendar**
3. **Life**
4. **Insights**
5. **Profile**

Also provide a prominent global **+** action.

The + action should allow:

- Task
- Event
- Reminder
- Note
- Expense
- Bill
- Habit
- Shopping item
- Document
- Brain Dump

The user should be able to create something important within seconds.

---

# 12. TODAY

Today is the central screen.

Its purpose is to answer:

> **What matters right now?**

Example:

```text
Good morning

Friday, August 28

You have 4 things that matter today.

TODAY

Finish project
Due 11:59 PM

Pay electricity bill
Due Monday

Study for Database exam
45 min suggested

Buy groceries

────────────────

YOUR LIFE

School       3 items
Money        2 items
Personal     4 items
Home         1 item

────────────────

What's on your mind?

+ Add something
```

The content should be dynamic.

Adapt the greeting to:

- time of day
- workload
- upcoming deadlines
- user preferences

Do not display every single task on the home screen.

Prioritize what matters.

---

# 13. TASKS

Tasks support:

- Title
- Description
- Due date
- Due time
- Priority
- Category
- Tags
- Subtasks
- Attachments
- Notes
- Recurrence
- Reminders
- Estimated duration
- Actual duration
- Status
- Created timestamp
- Updated timestamp

Priority levels:

- Low
- Medium
- High
- Urgent

Interactions:

- Swipe to complete
- Swipe to reschedule
- Long press
- Drag and reorder
- Quick completion

Task creation should be extremely fast.

---

# 14. TASK PRIORITIZATION

Do not rely entirely on AI.

Use deterministic logic combined with AI suggestions.

Consider:

- deadline proximity
- priority
- estimated duration
- overdue status
- dependency impact
- recurrence
- user-defined importance
- calendar availability
- user behavior

Conceptually:

```text
Priority =
deadline urgency
+ importance
+ overdue status
+ dependency impact
+ user preference
```

The user should understand why something is considered important.

---

# 15. CALENDAR

Support:

- Day view
- Week view
- Month view
- Events
- Tasks
- Deadlines
- Reminders
- Recurring events

Tasks and events should appear together.

Detect obvious scheduling conflicts.

Example:

> You have a 2-hour task scheduled during an existing event.

Provide:

- Reschedule
- Shorten
- Keep anyway

Eventually support external calendar integration.

---

# 16. REMINDERS

Support:

- One-time reminders
- Recurring reminders
- Deadline reminders
- Smart reminders
- Morning briefing
- Evening review
- Context-aware notifications where technically appropriate

Avoid notification spam.

Users must have granular notification controls.

---

# 17. SMART NOTIFICATIONS

Notifications should contain context.

Instead of:

> Pay bill.

Use:

> Your electricity bill is due tomorrow.

Instead of:

> Reminder.

Use:

> Your project proposal is due tomorrow at 11:59 PM.

Potential smart notification:

> You have 90 minutes free this afternoon. Want to work on your project?

Users can disable intelligent notifications.

---

# 18. RECURRING RESPONSIBILITIES

Support:

- Daily
- Weekly
- Monthly
- Yearly
- Custom recurrence

Examples:

- Pay internet every month
- Clean room every Saturday
- Review finances every Sunday
- Replace a document yearly

Do not generate unnecessary future database records.

Generate instances intelligently.

---

# 19. BRAIN DUMP

Brain Dump is a signature Anchor feature.

Users should be able to write anything without organizing it.

Example:

> I need to finish my project, buy groceries, pay the electricity bill Monday, study for Friday's exam, and renew my ID next month.

Anchor processes the text.

Result:

```text
I found 5 things.

School
• Finish project
• Study for exam Friday

Money
• Pay electricity bill Monday

Personal
• Buy groceries

Documents
• Renew ID next month
```

The user must confirm before important objects are created.

---

# 20. QUICK ADD

Natural language input should work throughout the application.

Example:

> Buy groceries tomorrow

Creates:

```text
Task
Buy groceries

Due:
Tomorrow
```

Example:

> Dentist Friday at 3 PM

Creates:

```text
Event
Dentist

Friday
3:00 PM
```

Example:

> Electricity bill ₱1,500 due Monday

Creates:

```text
Bill
Electricity
₱1,500
Due Monday
```

AI can assist parsing.

Basic patterns should still work without AI.

---

# 21. AI CAPABILITIES

AI is integrated throughout Anchor.

## Brain Dump

Convert natural language into structured information.

## Task Breakdown

Turn large tasks into manageable steps.

## Planning

Create realistic plans around:

- deadlines
- calendar events
- estimated durations
- priorities

## Daily Planning

Answer:

> What should I focus on today?

## Weekly Review

Summarize:

- completed tasks
- overdue tasks
- upcoming responsibilities
- expenses
- habits
- workload

## Notes

AI can:

- summarize
- extract tasks
- extract dates
- create action items

## Expenses

AI can categorize expenses.

## Documents

AI/OCR can identify:

- document type
- expiration date
- relevant dates
- title

## Calendar

Identify conflicts and suggest alternatives.

## Personalization

Learn non-sensitive behavioral preferences such as:

- preferred working hours
- typical task durations
- reminder preferences
- scheduling patterns

Users must be able to reset personalization.

---

# 22. AI CONFIRMATION

AI must not silently create important commitments.

After processing:

```text
I found 6 things.

✓ Create 4 tasks
✓ Add 1 reminder
✓ Add 1 event
```

The user confirms.

For ambiguous dates:

> "Next Friday"

show the interpreted date.

For financial information, always confirm before saving.

---

# 23. EXPENSES

Implement personal expense tracking.

Support:

- Income
- Expense
- Amount
- Currency
- Category
- Date
- Notes
- Recurrence
- Payment method

Default categories:

- Food
- Transportation
- Bills
- Shopping
- Entertainment
- School
- Health
- Personal
- Other

Example:

```text
THIS MONTH

Income
₱12,000

Expenses
₱8,500

Remaining
₱3,500
```

Show:

- spending trends
- category breakdown
- recurring expenses
- upcoming expenses

Keep this lightweight.

Anchor is not a banking application.

---

# 24. BILLS

Bills are treated as recurring responsibilities.

Support:

- Name
- Amount
- Due date
- Recurrence
- Category
- Payment method
- Notes
- Reminder

Example:

```text
Electricity
₱2,100
Due Monday
```

Allow users to mark bills as paid.

---

# 25. DOCUMENT VAULT

Users can securely store important documents.

Examples:

- Passport
- Driver's license
- Government IDs
- School documents
- Certificates
- Contracts
- Resume

Store:

- Name
- Category
- File
- Issue date
- Expiration date
- Notes

Provide expiration notifications.

Example:

> Driver's license expires in 14 days.

Documents must use secure storage.

---

# 26. NOTES

Provide a simple notes system.

Support:

- Text
- Tags
- Categories
- Attachments
- Pinned notes

AI actions:

- Summarize
- Extract tasks
- Extract dates
- Convert to checklist

Notes must work offline.

---

# 27. HABITS

Support:

- Daily habits
- Weekly habits
- Custom frequency
- Completion tracking
- Streaks
- Consistency
- Trends

Avoid manipulative gamification.

Never shame the user for missing a habit.

Instead:

> You missed yesterday. Start again today.

---

# 28. SHOPPING

Support:

- Shopping lists
- Items
- Quantities
- Categories
- Stores
- Estimated cost
- Completion status

Quick entry should be supported.

AI can convert:

> We need milk, eggs, bread and chicken.

into:

```text
Milk
Eggs
Bread
Chicken
```

---

# 29. LIFE CATEGORIES

Default categories:

- Personal
- Home
- Work
- School
- Money
- Health
- Family
- Social
- Documents
- Other

Allow custom categories.

Categories should help organization without cluttering the interface.

---

# 30. STUDENT MODE

Student Mode is optional.

When enabled:

- Subjects
- Classes
- Assignments
- Exams
- Projects
- Thesis
- Attendance
- Study sessions
- Academic deadlines

Example:

```text
DATABASE SYSTEMS

Assignment
Due Sept 2

Exam
Sept 5

Project
Due Sept 12
```

Do not let Student Mode overwhelm the general experience.

---

# 31. INSIGHTS

Create a calm insights section.

Show:

### Productivity

- Tasks completed
- Completion rate
- Overdue tasks
- Average completion time

### Time

- Planned workload
- Workload by day
- Category distribution

### Money

- Spending by category
- Monthly trends
- Recurring expenses

### Habits

- Consistency
- Completion rate
- Trends

The goal is awareness rather than competition.

---

# 32. DAILY BRIEFING

Each morning:

```text
Good morning.

Today you have:

3 important tasks
1 appointment
1 upcoming bill
2 habits

Most important:

Finish project proposal

Estimated workload:
2h 15m
```

Keep it concise.

---

# 33. EVENING REVIEW

Optional evening summary:

```text
YOUR DAY

✓ 5 tasks completed
✓ 2 habits completed
○ 1 task moved to tomorrow

Tomorrow looks manageable.

3 important things are scheduled.
```

Users can disable this feature.

---

# 34. WIDGETS

Create mobile widgets.

## Today Widget

Display:

- Important task
- Next event
- Upcoming deadline

## Quick Add Widget

Allow quick task creation.

## Habit Widget

Display today's habits.

## Countdown Widget

Display important upcoming deadlines.

Widgets should remain simple and useful.

---

# 35. SEARCH

Implement global search across:

- Tasks
- Events
- Notes
- Expenses
- Documents
- Habits
- Shopping lists

Example:

Searching:

> passport

could return:

- Passport document
- Passport renewal task
- Passport note

---

# 36. AUTHENTICATION

Support two modes.

## Anonymous

Users can begin immediately.

No mandatory account creation during first launch.

## Registered

Support:

- Email/password
- Google
- Apple

When an anonymous user registers, migrate their local data to their new account.

Do not lose existing information.

---

# 37. DATABASE

Use PostgreSQL.

Suggested tables:

```text
profiles

tasks
task_subtasks
task_reminders
task_recurrences

events
event_reminders

categories

notes
note_tags

expenses
expense_categories

bills

documents

habits
habit_entries

shopping_lists
shopping_items

student_profiles
subjects
assignments

notifications

ai_requests
ai_usage

sync_queue
```

Use UUID primary keys.

Use timestamps.

Use proper foreign keys.

Use indexes where appropriate.

Every user-owned record must be protected through Row Level Security.

---

# 38. OFFLINE SYNCHRONIZATION

Every offline-capable entity should have:

- local ID
- server ID where applicable
- created_at
- updated_at
- sync state
- deleted state where appropriate

Implement:

```text
Create locally
↓
Mark pending
↓
Continue using app
↓
Connection restored
↓
Upload changes
↓
Resolve conflicts
↓
Mark synced
```

Do not blindly overwrite server records.

Define conflict resolution rules.

---

# 39. SECURITY

Implement:

- RLS
- Secure storage
- Private buckets
- Signed URLs
- Authentication
- Session management
- Biometric lock
- Account deletion
- Data export
- Secure API architecture

The service-role key must never be exposed to the client.

---

# 40. DESIGN LANGUAGE

Anchor should feel:

**Minimal. Premium. Calm. Human.**

Take inspiration from the clarity of Apple's design philosophy without copying Apple's UI.

Use:

- generous whitespace
- strong typography
- rounded surfaces
- subtle borders
- restrained color
- soft shadows
- smooth transitions
- minimal iconography
- excellent dark mode

Avoid:

- excessive gradients
- excessive glassmorphism
- overly colorful dashboards
- giant cards everywhere
- excessive badges
- gamified interfaces
- unnecessary animation

---

# 41. BRANDING

The name:

# Anchor

The visual identity should communicate:

- stability
- trust
- calm
- grounding
- reliability

Avoid making the branding literally nautical.

Do not fill the interface with anchors, ropes, waves, or ocean imagery.

The metaphor should be subtle.

Possible brand copy:

> **Keep your life together.**

> **You live. Anchor remembers.**

> **Stay grounded in what matters.**

> **Get it out of your head.**

Use concise language.

---

# 42. ONBOARDING

Do not force registration immediately.

Opening experience:

```text
ANCHOR

Keep your life together.

[ Get started ]
```

Then:

> What would you like Anchor to help you remember?

Options:

- Tasks
- Appointments
- Bills
- School
- Habits
- Documents
- Shopping
- Everything

Then:

> Want to try something?

### Brain Dump

> Write down everything on your mind.

Do not organize it first.

Just write.

The AI then demonstrates how Anchor can organize it.

---

# 43. BRAIN DUMP AS THE "AHA" MOMENT

The first major product experience should be:

```text
User:
"I need to finish my thesis, buy groceries,
pay my electricity bill Monday, study Friday,
and renew my ID next month."

Anchor:

I found 5 things.

School
• Finish thesis
• Study Friday

Money
• Pay electricity Monday

Personal
• Buy groceries

Documents
• Renew ID next month
```

Then:

> **Want me to organize these for you?**

This should communicate the entire product concept within minutes.

---

# 44. QUICK CREATION UX

Simple actions should require minimal input.

Bad:

```text
Title
Description
Category
Priority
Tags
Duration
Reminder
Recurrence
...
```

Good:

```text
What do you need to do?

Buy groceries
```

Advanced options should be hidden until needed.

Use progressive disclosure.

---

# 45. ACCESSIBILITY

Support:

- Dynamic text
- Screen readers
- Accessible labels
- Large touch targets
- Reduced motion
- Sufficient contrast
- Voice accessibility where supported

Never communicate meaning through color alone.

---

# 46. PERFORMANCE

The application should feel immediate.

Requirements:

- Cached Today screen loads instantly
- Local task creation does not wait for network
- Offline actions are immediate
- Avoid unnecessary renders
- Lazy-load heavy features
- Optimize images
- Optimize document previews
- Do not block UI while AI is processing

AI operations should display clear but subtle processing states.

---

# 47. ERROR HANDLING

Never expose technical errors to ordinary users.

Bad:

> Error 500.

Good:

> We couldn't sync your changes yet.

> They're safely saved on this device. We'll try again when you're connected.

Users should never fear losing information.

---

# 48. EMPTY STATES

Examples:

### Tasks

> Nothing demanding your attention.

### Calendar

> Your calendar is clear.

### Expenses

> No spending recorded yet.

### Habits

> Start with one small habit.

### Documents

> Your important documents will live here.

Avoid generic:

> No data found.

---

# 49. SYNC STATUS

Keep synchronization information subtle.

Possible states:

- Synced
- Saving
- Offline
- Waiting to sync

Do not expose unnecessary technical details.

---

# 50. PROJECT ARCHITECTURE

Use feature-based architecture.

Suggested structure:

```text
src/

app/
  (tabs)/
    today/
    calendar/
    life/
    insights/
    profile/

  task/
  note/
  expense/
  document/
  brain-dump/

features/
  tasks/
  calendar/
  reminders/
  expenses/
  bills/
  documents/
  notes/
  habits/
  shopping/
  students/
  ai/
  sync/
  notifications/

components/
  ui/
  cards/
  sheets/
  forms/

lib/
  supabase/
  database/
  ai/
  notifications/
  sync/
  storage/

store/

types/

utils/
```

Keep business logic separate from presentation.

Avoid enormous components.

Avoid duplicated logic.

---

# 51. DEVELOPMENT PHASES

Do not attempt to build everything simultaneously.

## Phase 1 — Foundation

Build:

- Expo project
- TypeScript
- Routing
- Design system
- Supabase
- Authentication
- Anonymous accounts
- Database
- RLS
- Local persistence

## Phase 2 — Core Anchor

Build:

- Today
- Tasks
- Categories
- Calendar
- Reminders
- Recurring tasks

## Phase 3 — Offline

Build:

- Local database
- Sync engine
- Offline creation
- Offline editing
- Conflict resolution
- Sync indicators

## Phase 4 — Intelligence

Build:

- Brain Dump
- AI extraction
- Natural language creation
- Task breakdown
- Smart prioritization
- Daily planning

## Phase 5 — Life

Build:

- Expenses
- Bills
- Documents
- Notes
- Habits
- Shopping

## Phase 6 — Student Mode

Build:

- Subjects
- Assignments
- Exams
- Study sessions
- Academic deadlines

## Phase 7 — AI Assistant

Build:

- Daily briefing
- Evening review
- Smart reminders
- Personalized planning
- AI insights

## Phase 8 — Widgets

Build:

- Today widget
- Quick Add widget
- Habit widget
- Countdown widget

## Phase 9 — Polish

Build:

- Accessibility
- Dark mode
- Animations
- Performance optimization
- Security review
- Error handling
- Onboarding polish
- App Store preparation

---

# 52. TESTING

Test continuously.

Include:

### Unit tests

- Task prioritization
- Recurrence
- Expense calculations
- Date parsing
- AI response parsing

### Integration tests

- Authentication
- Database
- RLS
- Synchronization
- Notifications

### Offline tests

- Create offline
- Edit offline
- Delete offline
- Reconnect
- Conflict resolution

### UI tests

- Navigation
- Task completion
- Brain Dump
- Quick Add
- Calendar
- Expenses
- Documents

Test both:

- Android
- iOS

Also test:

- slow networks
- no network
- app backgrounding
- app restarts
- notification interactions
- different screen sizes

---

# 53. DO NOT BUILD A GENERIC AI CHATBOT

This is extremely important.

Do not make the main experience:

```text
Ask Anchor anything...
```

Anchor is not primarily a chatbot.

AI should operate inside the user's workflows.

Examples:

- Brain Dump
- Planning
- Task breakdown
- Smart reminders
- Notes
- Calendar
- Expenses
- Documents
- Daily review

The user should feel:

> "Anchor understands what I need."

Not:

> "I'm chatting with an AI."

---

# 54. DO NOT OVER-GAMIFY

Avoid:

- XP
- coins
- leaderboards
- aggressive streak mechanics
- guilt notifications
- fake achievements

Anchor should help users live better, not optimize them like a game.

---

# 55. PRODUCT SUCCESS CRITERIA

A new user should be able to:

1. Open Anchor.
2. Start without registering.
3. Perform a Brain Dump.
4. Let AI organize it.
5. Confirm the resulting items.
6. See the most important items on Today.
7. Receive useful reminders.
8. Continue working offline.
9. Automatically synchronize later.
10. Track expenses.
11. Store documents.
12. Manage habits.
13. Maintain a shopping list.
14. Use notes.
15. Enable Student Mode if desired.
16. Review their life through Insights.
17. Understand what needs attention.
18. Feel less overwhelmed.

The most important success metric is not the number of features.

It is whether the user thinks:

> **"I don't have to keep everything in my head anymore."**

---

# 56. DEVELOPMENT RULES

Do not produce one enormous code dump.

Build Anchor incrementally.

For every phase:

1. Explain the architecture.
2. Create the required files.
3. Implement the feature.
4. Connect it to the real backend.
5. Implement error handling.
6. Add tests.
7. Run/build the application.
8. Fix errors.
9. Verify offline behavior where applicable.
10. Only then proceed.

Do not claim a feature is complete if it is only visually mocked.

Do not use fake functionality in production flows.

Do not sacrifice:

- security
- data integrity
- offline reliability
- accessibility
- performance

for visual effects.

---

# 57. FINAL PRODUCT STATEMENT

Anchor is a calm, intelligent personal operating system.

It brings together:

- tasks
- calendar
- reminders
- recurring responsibilities
- expenses
- bills
- documents
- notes
- habits
- shopping
- school
- insights

and uses AI to help the user make sense of it all.

But the interface should remain simple.

The user should not feel like they are operating a complicated productivity system.

They should simply feel:

> **"Anchor has this."**

## Final Brand

# ANCHOR

### Keep your life together.

And the deeper product promise:

> **You live your life. Anchor remembers the rest.**