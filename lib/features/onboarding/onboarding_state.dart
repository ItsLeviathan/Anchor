import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/security/app_lock.dart';

export '../../core/security/app_lock.dart' show setOnboardingComplete;

/// Whether the once-per-install welcome flow has been completed. Loaded from
/// secure storage at startup; the router redirects to /welcome until true.
class OnboardingCompleteNotifier extends AsyncNotifier<bool> {
  @override
  Future<bool> build() => getOnboardingComplete();

  void markComplete() => state = const AsyncData(true);
}

final onboardingCompleteProvider =
    AsyncNotifierProvider<OnboardingCompleteNotifier, bool>(OnboardingCompleteNotifier.new);
