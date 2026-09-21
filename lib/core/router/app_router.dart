import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/calendar/calendar_screen.dart';
import '../../features/composers/brain_dump_composer.dart';
import '../../features/composers/life_composers.dart';
import '../../features/composers/task_event_composers.dart';
import '../../features/insights/insights_screen.dart';
import '../../features/life/life_screen.dart';
import '../../features/onboarding/onboarding_screens.dart';
import '../../features/onboarding/onboarding_state.dart';
import '../../features/profile/profile_screen.dart';
import '../../features/search/search_screen.dart';
import '../../features/shell/app_shell.dart';
import '../../features/today/today_screen.dart';

/// Full-screen modal (slides up from the bottom, like an iOS sheet).
Page<void> _modal(GoRouterState state, Widget child) =>
    MaterialPage<void>(key: state.pageKey, fullscreenDialog: true, child: child);

/// Onboarding routes cross-fade instead of sliding.
Page<void> _fade(GoRouterState state, Widget child) => CustomTransitionPage<void>(
      key: state.pageKey,
      child: child,
      transitionsBuilder: (_, animation, _, child) => FadeTransition(opacity: animation, child: child),
    );

const _onboardingPaths = {'/welcome', '/sign-in', '/sign-up'};

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = ValueNotifier<int>(0);
  ref.listen(onboardingCompleteProvider, (_, _) => refresh.value++);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: '/today',
    refreshListenable: refresh,
    // Once per install the user lands on the welcome flow; every other path
    // is reachable only after that.
    redirect: (context, state) {
      final done = ref.read(onboardingCompleteProvider).value;
      if (done == null) return null; // still loading the flag
      final onOnboarding = _onboardingPaths.contains(state.matchedLocation);
      if (!done && !onOnboarding) return '/welcome';
      return null;
    },
    routes: [
      GoRoute(path: '/', redirect: (_, _) => '/today'),
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) => AppShell(shell: shell),
        branches: [
          StatefulShellBranch(routes: [GoRoute(path: '/today', builder: (_, _) => const TodayScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/calendar', builder: (_, _) => const CalendarScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/life', builder: (_, _) => const LifeScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/profile', builder: (_, _) => const ProfileScreen())]),
        ],
      ),
      // Not a tab (the bar keeps an even 2 + Add + 2 layout so Add is centred);
      // opened from Profile.
      GoRoute(
        path: '/insights',
        builder: (_, _) => Scaffold(
          appBar: AppBar(backgroundColor: Colors.transparent, scrolledUnderElevation: 0),
          body: const InsightsScreen(),
        ),
      ),
      GoRoute(path: '/welcome', pageBuilder: (_, s) => _fade(s, const WelcomeScreen())),
      GoRoute(path: '/sign-in', pageBuilder: (_, s) => _fade(s, const SignInScreen())),
      GoRoute(path: '/sign-up', pageBuilder: (_, s) => _fade(s, const SignUpScreen())),
      GoRoute(path: '/search', pageBuilder: (_, s) => _modal(s, const SearchScreen())),
      GoRoute(path: '/task-new', pageBuilder: (_, s) => _modal(s, const TaskComposer())),
      GoRoute(path: '/event-new', pageBuilder: (_, s) => _modal(s, const EventComposer())),
      GoRoute(path: '/brain-dump', pageBuilder: (_, s) => _modal(s, const BrainDumpComposer())),
      GoRoute(path: '/expense-new', pageBuilder: (_, s) => _modal(s, const ExpenseComposer())),
      GoRoute(path: '/bill-new', pageBuilder: (_, s) => _modal(s, const BillComposer())),
      GoRoute(path: '/note-new', pageBuilder: (_, s) => _modal(s, const NoteComposer())),
      GoRoute(path: '/habit-new', pageBuilder: (_, s) => _modal(s, const HabitComposer())),
      GoRoute(path: '/shopping-item-new', pageBuilder: (_, s) => _modal(s, const ShoppingItemComposer())),
      GoRoute(path: '/document-new', pageBuilder: (_, s) => _modal(s, const DocumentComposer())),
      GoRoute(path: '/subject-new', pageBuilder: (_, s) => _modal(s, const SubjectComposer())),
      GoRoute(
        path: '/assignment-new',
        pageBuilder: (_, s) => _modal(s, AssignmentComposer(subjectId: s.extra as String?)),
      ),
    ],
  );
});
