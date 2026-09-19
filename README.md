# Anchor

> **Keep your life together.**

A premium cross-platform personal life-management app built with **Flutter**, Supabase, and Dart.

---

## What it does

Anchor brings tasks, calendar, reminders, bills, expenses, habits, shopping, notes, documents, and school management into one calm, local-first environment. Everything works offline and syncs to Supabase in the background.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Flutter 3.47 · Dart 3.13 · Material 3 |
| Routing | `go_router` (`StatefulShellRoute` for the tabs, full-screen modal routes for composers) |
| State | Riverpod (`StreamProvider`s over local SQLite) |
| Backend | Supabase (PostgreSQL · Auth · Storage · Edge Functions) via `supabase_flutter` |
| Local DB | SQLite via `sqflite` (schema mirrors Supabase 1:1) |
| Sync | Local-first queue with per-entity coalescing, bounded exponential retry, last-write-wins |
| Auth storage | `flutter_secure_storage` (Keystore / Keychain) |
| Notifications | `flutter_local_notifications` + `timezone` |
| Biometric lock | `local_auth` |
| Connectivity | `connectivity_plus` |
| Sign-in | email/password · Apple (`sign_in_with_apple`) · Google (`google_sign_in`) |

Backend, schema and RLS are unchanged from the earlier Expo/React Native build - only the client was rewritten.

---

## Project structure

```
lib/
  main.dart, app.dart          — entry point, MaterialApp.router, startup gate + lock overlay
  core/
    theme/                     — design tokens (spacing, radius, type scale, colors) + ThemeData
    router/                    — go_router config
    db/                        — SQLite schema, generic entity store, settings
    sync/                      — queue, sync engine, lifecycle (connectivity / foreground / timer)
    supabase/                  — client + secure session storage, bootstrap, social auth
    data/repository.dart       — all write operations (local-first, then queued)
    logic/logic.dart           — pure logic: prioritization, recurrence, streaks, insights, planning, brain dump, quick-add
    models/                    — domain models
    notifications/             — the 4 reminder types
    security/                  — biometric app lock + onboarding flag
    widgets/                   — UI kit (AppCard, AppButton, ChipSelector, ComposerScaffold, FadeInView, ...)
  features/
    onboarding/ shell/ today/ calendar/ life/ insights/ profile/ search/
    composers/                 — task, event, expense, bill, note, habit, shopping, document, subject, assignment, brain dump
    shared/items.dart          — list-item widgets (swipe to complete / delete)

supabase/
  migrations/                  — PostgreSQL schema (0001-0009)
  functions/                   — Edge Functions (account deletion, ...)
```

> `_legacy_rn/` holds the previous Expo/React Native sources for reference. Delete it once you're happy with the port.

---

## Setup

### 1. Environment

Copy `.env.example` to `.env` and fill in your Supabase project values:

```bash
cp .env.example .env
```

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
# Optional, only for Google Sign-In (the *web* OAuth client id):
# GOOGLE_WEB_CLIENT_ID=...
```

Never put the service-role key in `.env`. It never leaves the backend.

> `.env` is bundled as a Flutter asset, so it ships inside the app. That is fine for the public anon key and nothing else.

### 2. Database

Apply the migrations in `supabase/migrations/` to your Supabase project (in order). Row Level Security is enabled on every user-owned table.

### 3. Install and run

```bash
flutter pub get
flutter run                 # picks the running emulator / device
flutter analyze             # should report no issues
```

---

## Fast Android emulator (Windows)

A slow emulator is almost always missing hardware acceleration, or under-provisioned. The setup that works well:

1. **Hardware acceleration.** Check with `emulator -accel-check`. On Windows 11, WHPX ("Windows Hypervisor Platform") or the Android Emulator Hypervisor Driver both work; HAXM is deprecated - don't use it.
2. **x86_64 system image**, API 34/35. Google APIs (no Play Store) boots faster and needs no sign-in for development.
3. **AVD config** (`<avd>/config.ini`): `hw.ramSize=4096`, `hw.cpu.ncore=4`, `vm.heapSize=512`, `hw.gpu.enabled=yes`, `hw.gpu.mode=host`, `fastboot.forceFastBoot=yes`. Camera, audio and the device frame off.
4. **Quick Boot.** Cold boot once, then close the emulator normally - later launches resume the snapshot in a few seconds instead of a minute or more.
5. **Animations off** in the emulator's Developer options (window / transition / animator scale = 0.5x or off) for snappier UI.
6. **Leave it running** for the whole session and iterate with `flutter run` hot reload (`r`) / hot restart (`R`) rather than relaunching the emulator.

---

## Behavior notes

- **Local-first.** Every write goes to SQLite first, then into `sync_queue`. Repeated edits to one row coalesce into a single queued upsert; a delete replaces whatever was queued.
- **Sync.** Push then pull on reconnect; pull then push on app start. A row with a pending local edit is never overwritten by the pull. Retries are bounded (6 attempts, 30 s to 30 min backoff with jitter); non-retryable errors (auth, RLS, validation) fail immediately.
- **Conflicts.** Last write wins - Anchor is single-user, so the only race is the same account on two devices.
- **App lock** fails closed: if enabled, the lock screen always shows, and re-engages after 15 s in the background.
- **Rule-based planning.** Daily Plan, Weekly Review and Brain Dump are computed locally from your own data - no external AI API.

---

## Design language

Anchor's visual identity: **minimal · premium · calm · human**

- Generous whitespace, strong typography, rounded surfaces
- Restrained color - muted green accent (`#2F6F5E` light / `#5FA98D` dark)
- Full dark mode via the system setting
- No hardcoded colors in screens - all values come from `lib/core/theme/tokens.dart`

---

## Monetization

Anchor has no paywall or subscription tier right now - every feature is free. See `Anchor — Monetization & Subscription Specification.md` for the plan.

---

## Privacy

Anchor contains highly personal information. Architecture reflects this:

- Row Level Security on every Supabase table
- Session tokens stored in the platform keystore (`flutter_secure_storage`)
- Documents served via short-lived signed URLs, never public
- No user data sold or used for advertising
