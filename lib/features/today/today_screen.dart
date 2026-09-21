import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/brand/anchor_logo.dart';
import '../../core/data/repository.dart' as repo;
import '../../core/db/database.dart';
import '../../core/logic/logic.dart';
import '../../core/models/models.dart';
import '../../core/providers.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/tokens.dart';
import '../../core/utils/dates.dart';
import '../../core/utils/toast.dart';
import '../../core/widgets/ui.dart';
import '../shared/guest_upsell.dart';
import '../shared/items.dart';
import 'today_widgets.dart';

const _eveningHour = 18;
const _personalizedKey = 'personalized_suggestions_enabled';

final personalizedSuggestionsProvider = FutureProvider<bool>(
    (ref) async => (await getLocalSetting(_personalizedKey)) != 'false');

Future<void> setPersonalizedSuggestions(WidgetRef ref, bool enabled) async {
  await setLocalSetting(_personalizedKey, enabled ? 'true' : 'false');
  ref.invalidate(personalizedSuggestionsProvider);
}

String _greeting(DateTime now) {
  if (now.hour < 12) return 'Good morning';
  if (now.hour < _eveningHour) return 'Good afternoon';
  return 'Good evening';
}

/// One short line for the hero. The counts live in the stat pills, so this
/// says what's left and how heavy it is instead of repeating them.
String _summary({required int done, required int total, required int workloadMinutes}) {
  if (total == 0) return 'A clear day. Enjoy the space, or get ahead on something.';
  if (done >= total) return 'Everything’s done. Nicely handled.';
  final left = total - done;
  final workload = formatWorkload(workloadMinutes);
  final base = '$left ${left == 1 ? 'thing' : 'things'} left today';
  return workload.isEmpty ? '$base.' : '$base · about $workload of work.';
}

class TodayScreen extends ConsumerStatefulWidget {
  const TodayScreen({super.key});
  @override
  ConsumerState<TodayScreen> createState() => _TodayScreenState();
}

class _TodayScreenState extends ConsumerState<TodayScreen> {
  String? _focusTaskId;

  Future<void> _toggle(Task t) => (t.isCompleted ? repo.reopenTask(t.id) : repo.completeTask(t)).catchError(toastError);

  Future<void> _delete(Task t) async {
    if (await confirmDelete(context, 'task')) await repo.deleteTask(t.id).catchError(toastError);
  }

  Future<void> _deleteHabit(Habit h) async {
    if (await confirmDelete(context, 'habit')) await repo.deleteHabit(h.id).catchError(toastError);
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final now = DateTime.now();
    final tasks = ref.watch(tasksProvider).value ?? const <Task>[];
    final events = ref.watch(eventsProvider).value ?? const <CalendarEvent>[];
    final bills = ref.watch(billsProvider).value ?? const <Bill>[];
    final habits = ref.watch(habitsProvider).value ?? const <Habit>[];
    final categories = ref.watch(categoriesProvider).value ?? const <Category>[];
    final personalized = ref.watch(personalizedSuggestionsProvider).value ?? true;

    final todayTasks = selectTodayTasks(tasks);
    final dueHabits = habits.where((h) => isDueToday(h)).toList();
    final briefing = computeDailyBriefing(tasks, events, bills, habits, now);
    final plan = computeDailyPlan(tasks, events, habits, now);
    final review = computeEveningReview(tasks, habits, now);
    final suggestion = personalized ? suggestTaskForFreeTime(tasks, events, now) : null;
    final catColor = {for (final cat in categories) cat.id: parseHex(cat.color, c.accent)};
    final isEvening = now.hour >= _eveningHour;

    // Day progress: tasks and habits completed out of everything planned today.
    final total = review.tasksCompletedToday + review.stillPendingCount + briefing.habitCount;
    final done = (review.tasksCompletedToday + review.habitsCompletedToday).clamp(0, total);

    // Skip the free-time line when it names the task the plan already leads
    // with, so one task isn't repeated three times down the screen.
    final freeTime = suggestion == null || suggestion.task.id == plan.focusTaskId
        ? null
        : 'You have ${formatWorkload(suggestion.slot.minutes)} free from ${formatTime(suggestion.slot.start)}. '
            '"${suggestion.task.title}" (${formatWorkload(suggestion.task.estimatedDurationMinutes!)}) would fit.';

    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, 120),
        children: [
          Row(children: [
            const Padding(padding: EdgeInsets.only(left: 4, right: AppSpacing.sm), child: AnchorLogo(size: 30, shadow: false)),
            const Expanded(child: SyncStatusBadge()),
            IconButton(tooltip: 'Search', icon: const Icon(Icons.search_rounded), onPressed: () => context.push('/search')),
          ]),
          const SizedBox(height: AppSpacing.xs),
          FadeInView(
            child: TodayHero(
              date: formatLongDate(now),
              greeting: _greeting(now),
              summary: _summary(done: done, total: total, workloadMinutes: briefing.estimatedWorkloadMinutes),
              done: done,
              total: total,
              stats: [
                HeroStat(Icons.check_circle_outline_rounded, briefing.importantTaskCount, 'Tasks'),
                HeroStat(Icons.event_outlined, briefing.appointmentCount, 'Events'),
                HeroStat(Icons.receipt_long_outlined, briefing.upcomingBillCount, 'Bills due'),
              ],
              focusTitle: briefing.mostImportantTask?.title,
              onFocusTap: plan.focusTaskId == null ? null : () => setState(() => _focusTaskId = plan.focusTaskId),
            ),
          ),

          const SizedBox(height: AppSpacing.md),
          const GuestUpsellCard(),

          if (todayTasks.isNotEmpty)
            FadeInView(
              delay: const Duration(milliseconds: 90),
              child: SuggestionCard(
                plan: plan.summary,
                freeTime: freeTime,
                onTap: plan.focusTaskId == null ? null : () => setState(() => _focusTaskId = plan.focusTaskId),
              ),
            ),

          SectionHeader('Focus', actionLabel: 'Add task', onAction: () => context.push('/task-new')),
          if (todayTasks.isEmpty)
            EmptyState(
              icon: Icons.wb_sunny_outlined,
              title: 'Nothing due today',
              message: 'Enjoy the space, or get ahead on something.',
              actionLabel: 'Add task',
              onAction: () => context.push('/task-new'),
            )
          else
            for (final t in todayTasks)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: TaskRow(
                    task: t,
                    categoryColor: catColor[t.categoryId],
                    highlighted: t.id == _focusTaskId,
                    onToggle: _toggle,
                    onDelete: _delete),
              ),

          if (dueHabits.isNotEmpty) ...[
            SectionHeader('Habits', actionLabel: '${review.habitsCompletedToday}/${dueHabits.length} today'),
            HabitStrip(
              habits: dueHabits,
              onToggle: (h) => repo.toggleHabitToday(h).catchError(toastError),
              onDelete: _deleteHabit,
            ),
          ],

          if (isEvening) ...[
            const SizedBox(height: AppSpacing.lg),
            EveningReviewCard(review: review),
          ],
        ],
      ),
    );
  }
}
