import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../features/onboarding/onboarding_state.dart';
import 'data/repository.dart' as repo;
import 'db/database.dart';
import 'models/models.dart';
import 'supabase/bootstrap.dart';
import 'supabase/supabase_setup.dart';

/// Runs once at startup; the router/app shell gates on it.
final bootstrapProvider = FutureProvider<BootstrapResult>((ref) async {
  // Resolve the onboarding flag before the first frame so the router never
  // flashes /today for a user who still needs the welcome flow.
  await ref.read(onboardingCompleteProvider.future);
  return runBootstrap();
});

/// Current auth session, live. Seeded from the bootstrap result so the very
/// first frame after bootstrap already has its final value.
final sessionProvider = StreamProvider<Session?>((ref) async* {
  yield supabase.auth.currentSession;
  await for (final state in supabase.auth.onAuthStateChange) {
    yield state.session;
  }
});

final userIdProvider = Provider<String?>((ref) {
  final session = ref.watch(sessionProvider);
  return session.value?.user.id ?? supabase.auth.currentUser?.id;
});

final isAnonymousProvider = Provider<bool>((ref) {
  final session = ref.watch(sessionProvider).value ?? supabase.auth.currentSession;
  return session?.user.isAnonymous ?? true;
});

/// Reads come from local SQLite, so they work identically online or offline;
/// they re-emit after every local write.
StreamProvider<List<T>> _entities<T>(String type, T Function(Map<String, Object?>) fromRow) =>
    StreamProvider<List<T>>((ref) {
      final uid = ref.watch(userIdProvider);
      if (uid == null) return Stream.value(<T>[]);
      return watchQuery(() async => (await def(type).list(uid)).map(fromRow).toList());
    });

final tasksProvider = _entities('task', Task.fromRow);
final eventsProvider = _entities('event', CalendarEvent.fromRow);
final expensesProvider = _entities('expense', Expense.fromRow);
final billsProvider = _entities('bill', Bill.fromRow);
final notesProvider = _entities('note', Note.fromRow);
final habitsProvider = _entities('habit', Habit.fromRow);
final subjectsProvider = _entities('subject', Subject.fromRow);
final assignmentsProvider = _entities('assignment', Assignment.fromRow);
final shoppingListsProvider = _entities('shopping_list', ShoppingList.fromRow);

/// Everyone has exactly one auto-seeded shopping list.
final defaultShoppingListProvider = Provider<ShoppingList?>(
    (ref) => ref.watch(shoppingListsProvider).value?.firstOrNull);

final categoriesProvider = StreamProvider<List<Category>>((ref) {
  final uid = ref.watch(userIdProvider);
  if (uid == null) return Stream.value(<Category>[]);
  return watchQuery(() async => (await listCategories(uid)).map(Category.fromRow).toList());
});

final calendarsProvider = StreamProvider<List<CalendarInfo>>((ref) {
  final uid = ref.watch(userIdProvider);
  if (uid == null) return Stream.value(<CalendarInfo>[]);
  return watchQuery(() async => (await listCalendars(uid)).map(CalendarInfo.fromRow).toList());
});

/// Documents are network-only (no local mirror); invalidate after writes.
final documentsProvider = FutureProvider<List<AnchorDocument>>((ref) {
  ref.watch(userIdProvider);
  return repo.fetchDocuments();
});

/// Student Mode lives on the server profile row.
final studentModeProvider = FutureProvider<bool>((ref) async {
  final uid = ref.watch(userIdProvider);
  if (uid == null) return false;
  final data = await supabase.from('profiles').select('student_mode_enabled').eq('id', uid).single();
  return data['student_mode_enabled'] == true;
});

Future<void> setStudentMode(WidgetRef ref, bool enabled) async {
  final uid = ref.read(userIdProvider);
  if (uid == null) return;
  await supabase.from('profiles').update({'student_mode_enabled': enabled}).eq('id', uid);
  ref.invalidate(studentModeProvider);
}
