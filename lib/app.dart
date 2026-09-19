import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/db/database.dart';
import 'core/providers.dart';
import 'core/router/app_router.dart';
import 'core/security/app_lock.dart';
import 'core/sync/sync_lifecycle.dart';
import 'core/theme/app_theme.dart';
import 'core/utils/toast.dart';
import 'core/widgets/overlays.dart';

class AnchorApp extends ConsumerWidget {
  const AnchorApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'Anchor',
      debugShowCheckedModeBanner: false,
      scaffoldMessengerKey: messengerKey,
      routerConfig: router,
      theme: lightTheme,
      darkTheme: darkTheme,
      themeMode: ThemeMode.system, // follows the OS; no manual override
      builder: (context, child) => _Gate(child: child ?? const SizedBox.shrink()),
    );
  }
}

/// Startup gate + lock overlay. The app content isn't built until bootstrap
/// (local DB + best-effort session) has resolved, so screens never render
/// before their data layer exists. The lock is an overlay rather than a route
/// so it can't be navigated around.
class _Gate extends ConsumerStatefulWidget {
  const _Gate({required this.child});
  final Widget child;
  @override
  ConsumerState<_Gate> createState() => _GateState();
}

class _GateState extends ConsumerState<_Gate> {
  SyncLifecycle? _sync;
  String? _syncUserId;

  void _syncFor(String? userId) {
    if (userId == _syncUserId) return;
    _sync?.dispose();
    _syncUserId = userId;
    _sync = userId == null ? null : (SyncLifecycle(userId)..start());
  }

  @override
  void dispose() {
    _sync?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final boot = ref.watch(bootstrapProvider);

    return boot.when(
      loading: () => const BootstrapScreen(),
      error: (err, _) => BootstrapScreen(
        error: err,
        onRetry: () {
          AppDb.resetOpenAttempt();
          ref.invalidate(bootstrapProvider);
        },
      ),
      data: (_) {
        // Sync runs for whichever user id the session currently has.
        final userId = ref.watch(userIdProvider);
        WidgetsBinding.instance.addPostFrameCallback((_) => _syncFor(userId));

        final lock = ref.watch(appLockProvider);
        return Stack(children: [
          widget.child,
          if (lock.isLocked)
            Positioned.fill(
              child: LockScreen(
                onUnlock: ref.read(appLockProvider.notifier).unlock,
                isAuthenticating: lock.isAuthenticating,
                error: lock.lastError,
              ),
            ),
        ]);
      },
    );
  }
}
