# Anchor — Phases 1–7 + Phase 8 (Widgets)

Phases 1–7 are complete. **Phase 8 (Widgets) is scaffolded** — please
read this whole section before building. This phase is fundamentally
different from every other phase in this project: it requires native
code and a workflow change, not just new JS.

## The workflow change - read this first

Every phase through Phase 7 ran in **Expo Go** with `npx expo start`.
**That stops working once these widget libraries are linked.** Widgets
need real native project code (an iOS Widget Extension, an Android
`AppWidgetProvider`), which Expo Go's fixed set of built-in modules can't
contain. From this point on, running the app at all - not just testing
the widget - requires:

1. `npx expo prebuild` - generates real `ios/` and `android/` native
   project folders from your Expo config (including the two plugin
   configs in `app.json`)
2. A **development build** instead of Expo Go:
   - **Android**: `npx expo run:android` works fine locally on Windows
     with Android Studio installed (just the SDK/emulator, not Xcode)
   - **iOS**: you don't have a Mac, so local builds aren't possible -
     use **EAS Build**'s cloud service instead, which compiles on
     Expo's own Mac infrastructure:
     ```bash
     npx eas build --platform ios --profile development
     ```
     You'll need a free Expo account either way, and an Apple Developer
     account ($99/year) to install on a real device or submit anywhere
     beyond a simulator

If you're not ready to commit to that workflow change yet, it's
completely reasonable to hold off on merging this update until you are
- everything through Phase 7 still runs in Expo Go exactly as before.

## What's here

One widget - **"Today"** - covering two of the spec's four widget
concepts at once (Today Widget + Countdown Widget from section 34):
important task, next event, and the nearest upcoming deadline (bill or
document expiration). Read-only, tap opens the app. Built for both
platforms:

- **iOS**: via `expo-widgets` - Expo's own **official, first-party**
  widget package (stable since SDK 56). This means no raw Swift code at
  all; the widget UI (`widgets/ios/TodayWidget.tsx`) is written with
  `@expo/ui/swift-ui` components, the same way everything else in this
  app is written
- **Android**: via `react-native-android-widget`, the established
  community library for this - JSX-like `FlexWidget`/`TextWidget`
  components that compile to native `RemoteViews`
  (`widgets/android/TodayWidget.tsx`)
- **Shared, pure, tested logic** (`lib/widgets/widgetData.ts`) drives
  both - one function computing what the widget should show, verified
  in Node the same way as every other pure module in this project
- **Widget content refreshes automatically** whenever the sync queue
  finishes flushing (`lib/sync/engine.ts`) - which covers almost every
  meaningful data change, since nearly every mutation already triggers a
  flush
- A **real bug caught while wiring the Android entry point**:
  `react-native-android-widget` requires registering its task handler
  before Expo Router boots, in a new `index.ts` (replacing the direct
  `expo-router/entry` main). My first draft used a static
  `import 'expo-router/entry'` at the bottom of the file - but static
  imports are hoisted in JavaScript, so it would have actually run
  *before* the registration call despite being written after it,
  silently defeating the whole point. Fixed by using `require()`
  instead, which executes inline rather than being hoisted

## Please read before attempting to build this

**This is the least-verified code in the entire project.** Everything
through Phase 7 was either type-checked, run against real test cases in
Node, or both. Widgets involve native compilation (Swift on Apple's
side, Kotlin/Gradle on Android's), and I have no way to run `expo
prebuild`, Gradle, or Xcode in this environment to catch mistakes before
they reach you. What I can tell you:

- `npx tsc --noEmit` passes clean, including the iOS widget's usage of
  `@expo/ui/swift-ui` - this confirms the *shapes* I'm calling
  (component props, function signatures) match what the installed
  package actually exports, which rules out a whole class of mistakes,
  but says nothing about whether the Swift side actually compiles
- The `@expo/ui/swift-ui/modifiers` calls (`font(...)`, `padding(...)`)
  are the part most likely to need a small adjustment - check
  `docs.expo.dev/versions/latest/sdk/widgets/` against whatever version
  actually resolves in your install if the iOS build fails there
- The Android side follows the library's own documented setup pattern
  closely, but again - never actually built

**Practically**: run `npx expo prebuild`, then try the Android build
first (`npx expo run:android` - faster iteration, and you can actually
see build errors locally on Windows). Get that working, then move to
`eas build` for iOS once you're confident the shared logic and Android
side are solid.

## Setup

No new database migration. No new environment variables. This phase is
entirely new packages, native config, and widget-specific files.

```bash
npm install
npx expo prebuild
npx expo run:android   # or: npx eas build --platform ios --profile development
```

## What's intentionally not built yet

- **Quick Add Widget** and a standalone **Habit Widget** (spec section
  34 lists four widgets; this update ships one covering two of the four
  concepts) - same pattern (own data function, own platform components)
  applies to both, straightforward to add once the Today widget is
  confirmed working
- **True in-widget interactivity** (e.g. checking off a habit without
  opening the app) - both platforms support this in principle (iOS via
  App Intents, Android via the task handler's `WIDGET_CLICK` branch
  wired to real actions), but it's meaningfully more complex and even
  less verifiable than what's here, so it's tap-to-open-app only for now
- A `previewImage` for the widget picker UI on either platform - needs
  an actual screenshot, which needs a working build first
- No paywall UI or actual billing integration, still - Phase 9 (polish)
  is the only phase left after this from the master spec
