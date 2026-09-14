# Anchor

> **Keep your life together.**

A premium cross-platform personal life-management app built with Expo (React Native), Supabase, and TypeScript. All nine development phases are complete.

---

## What it does

Anchor brings tasks, calendar, reminders, bills, expenses, habits, shopping, notes, documents, and school management into one calm, intelligent environment. AI (via Supabase Edge Functions) handles brain-dump parsing, task breakdown, and daily planning without dominating the interface. Everything works offline and syncs automatically when connectivity returns.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 57 · Expo Router · React Native 0.86 |
| Language | TypeScript 6 |
| Backend | Supabase (PostgreSQL · Auth · Storage · Edge Functions) |
| Local DB | SQLite via `expo-sqlite` |
| State | Zustand (UI/local) · TanStack Query v5 (server) |
| Animation | React Native Reanimated 4 · Gesture Handler 2 |
| Auth storage | `expo-secure-store` |
| Notifications | `expo-notifications` |
| Widgets | `expo-widgets` (iOS) · `react-native-android-widget` (Android) |

---

## Development phases

All phases are complete.

| Phase | Scope |
|---|---|
| 1 — Foundation | Expo project, TypeScript, routing, design system, Supabase, anonymous auth, database, RLS, local persistence |
| 2 — Core Anchor | Today screen, tasks, categories, calendar, reminders, recurring tasks |
| 3 — Offline | SQLite local DB, sync engine, offline create/edit/delete, conflict resolution, sync indicators |
| 4 — Intelligence | Brain Dump, AI extraction, natural language creation, task breakdown, smart prioritization, daily planning |
| 5 — Life | Expenses, bills, documents (vault), notes, habits, shopping lists |
| 6 — Student Mode | Subjects, assignments, exams, academic deadlines |
| 7 — AI Assistant | Daily briefing, evening review, smart reminders, personalized planning, AI insights |
| 8 — Widgets | Today widget (iOS + Android), shared widget data logic, auto-refresh on sync |
| 9 — Polish | Error handling, accessibility, animations, performance, onboarding, App Store preparation |

---

## Phase 9 — Polish (what was added)

### Error handling
- `ErrorBoundary` component wraps the entire app — render crashes show a calm fallback instead of a native crash screen
- `ToastContainer` + Zustand toast store — errors surface as floating toasts, auto-dismissed after 4 seconds
- TanStack Query `MutationCache` global `onError` — every failed mutation automatically shows a toast without touching individual hooks

### Accessibility
- `lib/a11y/useReducedMotion.ts` — reads the system Reduce Motion preference; animations are skipped when enabled
- `accessibilityHint` added to every interactive element: task completion/deletion, habit toggles, bill payment, shopping items, document open/delete, note pin/delete, all buttons

### Animations
- `FadeInView` component — Reanimated-powered fade-in wrapper with optional delay; respects Reduce Motion automatically
- `TaskRow` and `HabitListItem` fade in when they mount

### Performance
- `React.memo` applied to all list-item components: `TaskRow`, `HabitListItem`, `BillListItem`, `ShoppingItemRow`, `DocumentListItem`, `NoteListItem`, `Card`, `CategorySummaryRow`

### Onboarding
- Welcome screen on first launch (`app/(onboarding)/welcome.tsx`) — branded, shows "Get started" (anonymous) and "I already have an account" paths
- Sign-in screen (`app/(onboarding)/sign-in.tsx`) — email/password with toast error feedback
- Sign-up screen (`app/(onboarding)/sign-up.tsx`) — with email confirmation state
- First-launch flag stored in `expo-secure-store` — welcome screen only shows once
- Profile tab shows "Create account / Sign in" buttons inline for anonymous users

### App Store preparation
- `app.json` — display name "Anchor", bundle ID `com.anchor.app`, iOS permission strings (camera, photos, Face ID), Android permissions, build numbers
- `eas.json` — EAS build profiles: `development` (simulator), `preview` (internal distribution), `production` (autoIncrement)

---

## Project structure

```
app/
  (tabs)/         — Today · Calendar · Life · Insights · Profile
  (onboarding)/   — Welcome · Sign-in · Sign-up
  *-new.tsx       — Modal screens for creating each entity type
  brain-dump.tsx  — Brain Dump modal

components/
  ui/             — Button · Card · Input · Sheet · FadeInView · Toast · ErrorBoundary
  tasks/          — TaskRow
  habits/         — HabitListItem
  bills/          — BillListItem
  ...             — (one folder per domain)

features/         — Business logic hooks (useTasks, useBills, …) + composers
lib/
  a11y/           — useReducedMotion
  ai/             — Edge Function client
  database/       — SQLite schema + helpers
  entitlements/   — Free vs Pro entitlement layer
  onboarding/     — First-launch flag
  query/          — TanStack Query client (with global mutation error handler)
  sync/           — Sync engine
  theme/          — Design tokens + ThemeProvider
  toast/          — Zustand toast store
  widgets/        — Widget data computation

supabase/
  migrations/     — PostgreSQL schema
  functions/      — Edge Functions (AI)

widgets/
  ios/            — SwiftUI widget via @expo/ui/swift-ui
  android/        — FlexWidget via react-native-android-widget
```

---

## Setup

### 1. Environment

Copy `.env.example` to `.env` and fill in your Supabase project values:

```bash
cp .env.example .env
```

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Never put the service-role key in `.env`. It never leaves the backend.

### 2. Database

Apply the migrations in `supabase/migrations/` to your Supabase project (in order). Row Level Security is enabled on every user-owned table.

### 3. Install and run

```bash
npm install
npx expo prebuild        # generates ios/ and android/ native projects
npx expo run:android     # local Android build (requires Android Studio)
```

For iOS (requires a Mac or EAS cloud):

```bash
npx eas build --platform ios --profile development
```

### 4. Production build

```bash
npx eas build --platform all --profile production
npx eas submit --platform all
```

---

## Running without native widgets (Expo Go)

The widget libraries require a native build. If you want to iterate quickly on JS-only changes before committing to a full build, remove or comment out the `expo-widgets` and `react-native-android-widget` plugin entries in `app.json` and run:

```bash
npx expo start
```

Everything except the widgets works in Expo Go.

---

## Design language

Anchor's visual identity: **minimal · premium · calm · human**

- Generous whitespace, strong typography, rounded surfaces
- Restrained color — muted green accent (`#2F6F5E` light / `#5FA98D` dark)
- Full dark mode via system preference (`userInterfaceStyle: automatic`)
- No hardcoded colors anywhere — all values come from `lib/theme/tokens.ts`

---

## Monetization

Anchor uses a freemium model. The entitlement layer lives in `lib/entitlements/`. Free users get core features + 10 AI actions per month. Anchor Pro unlocks advanced AI, insights, widgets, and documents. Subscription state is validated server-side — never trusted from a client boolean.

Pricing is not hard-coded. Product identifiers are managed through Apple App Store Connect and Google Play Console.

---

## Privacy

Anchor contains highly personal information. Architecture reflects this:

- Row Level Security on every Supabase table
- Session tokens stored in `expo-secure-store`
- Documents served via signed URLs, never public
- AI requests routed through Edge Functions — API keys never reach the client
- No user data sold or used for advertising
