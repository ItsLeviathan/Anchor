import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/widgets.dart';

import '../db/database.dart';
import 'sync_engine.dart';

/// A backed-off queue entry only gets re-driven by one of the triggers below;
/// this periodic check is the safety net for an app that just stays open and
/// online. listPending() only returns entries whose backoff has elapsed, so
/// triggering here is always safe to no-op.
const _retryInterval = Duration(seconds: 90);

/// Three triggers cover the realistic scenarios: app start (initial pull +
/// flush), connectivity restored (flush-then-pull), and returning to the
/// foreground while online (lightweight flush). A periodic timer covers long
/// stretches where none fire.
class SyncLifecycle with WidgetsBindingObserver {
  SyncLifecycle(this.userId);
  final String userId;

  StreamSubscription<List<ConnectivityResult>>? _connectivitySub;
  Timer? _timer;
  bool _wasOnline = true;

  void start() {
    refreshPendingCount().catchError((Object e) => debugPrint('Failed to read pending sync count: $e'));
    WidgetsBinding.instance.addObserver(this);

    _connectivitySub = Connectivity().onConnectivityChanged.listen(_onConnectivity);
    Connectivity().checkConnectivity().then(_onConnectivity);

    _timer = Timer.periodic(_retryInterval, (_) {
      if (syncStatus.value.isOnline) triggerFlush();
    });

    setLocalSetting('current_user_id', userId)
        .catchError((Object e) => debugPrint('Failed to persist current user id: $e'));
    syncOnAppStart(userId);
  }

  void _onConnectivity(List<ConnectivityResult> results) {
    final online = results.any((r) => r != ConnectivityResult.none);
    setOnline(online);
    if (online && !_wasOnline) syncOnReconnect(userId);
    _wasOnline = online;
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && syncStatus.value.isOnline) triggerFlush();
  }

  void dispose() {
    _connectivitySub?.cancel();
    _timer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
  }
}
