# Anchor (Flutter)

This is a Flutter app (Dart, Riverpod, go_router, sqflite, supabase_flutter). Package majors here are newer than most training data (e.g. Riverpod 3, google_sign_in 7, flutter_local_notifications 22, file_picker 13), so check the package's own API in the pub cache or on pub.dev before writing against it, and run `flutter analyze` before finishing.

- Flutter SDK: `D:\flutter` (add `D:\flutter\bin` to PATH).
- Local-first: every write goes to SQLite (`lib/core/db`), then is queued for sync (`lib/core/sync`). Write operations live in `lib/core/data/repository.dart`.
- Pure logic (prioritization, recurrence, insights, planning) lives in `lib/core/logic/logic.dart` and should stay free of Flutter/IO imports.
- Colors, spacing and type come from `lib/core/theme/tokens.dart`; don't hardcode them in screens.
- `_legacy_rn/` is the previous Expo/React Native code, kept for reference only.
