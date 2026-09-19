import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../db/database.dart';
import 'supabase_setup.dart';

/// Anchor's one-time startup sequence.
///
/// - Local DB init is CRITICAL: every screen reads local SQLite, so a failure
///   fails the bootstrap and surfaces the recovery screen.
/// - Session restore is BEST-EFFORT: Anchor works fully local until synced, so
///   a slow/offline network must never strand the user on a startup screen.
///   It always resolves, degrading to `session: null` on failure/timeout.
class BootstrapResult {
  const BootstrapResult({this.session, this.sessionError});
  final Session? session;
  final String? sessionError;
}

const _sessionTimeout = Duration(seconds: 6);

Future<BootstrapResult> _restoreSession() async {
  try {
    final existing = supabase.auth.currentSession;
    if (existing != null) return BootstrapResult(session: existing);

    final anon = await supabase.auth.signInAnonymously().timeout(_sessionTimeout);
    return BootstrapResult(session: anon.session);
  } catch (err) {
    debugPrint('Bootstrap: session restore failed: $err');
    return BootstrapResult(sessionError: err is AuthException ? err.message : err.toString());
  }
}

Future<BootstrapResult> runBootstrap() async {
  await AppDb.instance; // throws on failure -> recovery screen
  return _restoreSession();
}
