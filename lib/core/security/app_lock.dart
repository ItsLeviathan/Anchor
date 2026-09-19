import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:local_auth/local_auth.dart';

const _secure = FlutterSecureStorage();
const _lockKey = 'anchor_app_lock_enabled';
const _onboardingKey = 'anchor_onboarding_complete';

/// How long the app must be backgrounded before it re-locks.
const _lockAfterBackground = Duration(seconds: 15);

final _auth = LocalAuthentication();

Future<bool> isAppLockEnabled() async => (await _secure.read(key: _lockKey)) == 'true';

Future<void> persistAppLockEnabled(bool enabled) =>
    _secure.write(key: _lockKey, value: enabled ? 'true' : 'false');

Future<bool> isBiometricAvailable() async {
  try {
    return await _auth.isDeviceSupported() && (await _auth.getAvailableBiometrics()).isNotEmpty;
  } catch (_) {
    return false;
  }
}

/// Fails closed: if the native module throws, that is never an unlock.
Future<bool> authenticateWithBiometric() async {
  try {
    return await _auth.authenticate(localizedReason: 'Unlock Anchor');
  } catch (err) {
    debugPrint('Biometric authentication threw unexpectedly: $err');
    return false;
  }
}

// --- onboarding flag (same secure store) -------------------------------------

Future<bool> getOnboardingComplete() async {
  try {
    return (await _secure.read(key: _onboardingKey)) == 'true';
  } catch (_) {
    return false;
  }
}

Future<void> setOnboardingComplete() => _secure.write(key: _onboardingKey, value: 'true');

// --- lock state ----------------------------------------------------------------

class AppLockState {
  const AppLockState({this.isLocked = false, this.lockEnabled = false, this.isAuthenticating = false, this.lastError});
  final bool isLocked, lockEnabled, isAuthenticating;
  final String? lastError;

  AppLockState copyWith({bool? isLocked, bool? lockEnabled, bool? isAuthenticating, String? lastError, bool clearError = false}) =>
      AppLockState(
        isLocked: isLocked ?? this.isLocked,
        lockEnabled: lockEnabled ?? this.lockEnabled,
        isAuthenticating: isAuthenticating ?? this.isAuthenticating,
        lastError: clearError ? null : (lastError ?? this.lastError),
      );
}

/// Deliberately fails closed: whether the device currently reports biometrics
/// as available is irrelevant to whether the lock shows. If the user enabled
/// app lock, the lock screen always shows; [authenticateWithBiometric] (which
/// itself fails closed) decides whether it goes away.
class AppLockController extends Notifier<AppLockState> with WidgetsBindingObserver {
  DateTime? _backgroundedAt;

  @override
  AppLockState build() {
    WidgetsBinding.instance.addObserver(this);
    ref.onDispose(() => WidgetsBinding.instance.removeObserver(this));
    isAppLockEnabled().then((enabled) {
      state = state.copyWith(lockEnabled: enabled, isLocked: enabled);
    });
    return const AppLockState();
  }

  @override
  // ignore: avoid_renaming_method_parameters (`state` would shadow Notifier.state)
  void didChangeAppLifecycleState(AppLifecycleState s) {
    if (s == AppLifecycleState.paused || s == AppLifecycleState.inactive || s == AppLifecycleState.hidden) {
      _backgroundedAt ??= DateTime.now();
    } else if (s == AppLifecycleState.resumed) {
      final t = _backgroundedAt;
      if (t != null && state.lockEnabled && DateTime.now().difference(t) > _lockAfterBackground) {
        state = state.copyWith(isLocked: true);
      }
      _backgroundedAt = null;
    }
  }

  Future<void> unlock() async {
    if (state.isAuthenticating) return;
    state = state.copyWith(isAuthenticating: true, clearError: true);
    try {
      final ok = await authenticateWithBiometric();
      state = ok
          ? state.copyWith(isLocked: false, isAuthenticating: false)
          : state.copyWith(isAuthenticating: false, lastError: 'Authentication failed. Try again.');
    } catch (err) {
      debugPrint('App lock unlock attempt failed: $err');
      state = state.copyWith(isAuthenticating: false, lastError: 'Something went wrong. Try again.');
    }
  }

  /// Updates the in-memory setting immediately (so the enforcement overlay
  /// reacts right away), independent of persisting it to secure storage.
  void setLockEnabled(bool enabled) {
    state = state.copyWith(lockEnabled: enabled, isLocked: enabled ? state.isLocked : false);
  }
}

final appLockProvider = NotifierProvider<AppLockController, AppLockState>(AppLockController.new);
