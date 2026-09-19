import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'core/notifications/notification_service.dart';
import 'core/supabase/supabase_setup.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/tokens.dart';
import 'core/widgets/overlays.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // A render error in one widget shows a small inline message instead of a
  // red/blank screen taking down the whole app.
  ErrorWidget.builder = (details) => Material(
        color: Colors.transparent,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Text('Something went wrong here.', style: TextStyle(color: Colors.grey.shade600)),
          ),
        ),
      );

  try {
    await initSupabase();
  } catch (err) {
    // Misconfiguration (missing .env) is shown plainly rather than crashing.
    runApp(MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: lightTheme,
      darkTheme: darkTheme,
      home: BootstrapScreen(error: err),
    ));
    return;
  }

  // Best-effort: reminders are optional, never block startup on them.
  initNotifications().catchError((Object e) => debugPrint('Notification init failed: $e'));

  runApp(const ProviderScope(child: AnchorApp()));
}
