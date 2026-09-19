import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

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
import '../shared/items.dart';

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

    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, AppSpacing.md, 120),
        children: [
          Row(children: [
            const Expanded(child: SyncStatusBadge()),
            IconButton(tooltip: 'Search', icon: const Icon(Icons.search), onPressed: () => context.push('/search')),
          ]),
          Eyebrow(formatLongDate(now)),
          const SizedBox(height: AppSpacing.xs),
          LargeTitle(_greeting(now)),

          _BriefingCard(briefing: briefing),
          const SizedBox(height: AppSpacing.md),
          AppCard(
            onTap: plan.focusTaskId == null ? null : () => setState(() => _focusTaskId = plan.focusTaskId),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const IconBadge(Icons.auto_awesome_outlined),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Eyebrow('Daily plan'),
                  const SizedBox(height: 2),
                  Text(plan.summary, style: AppTypography.body(c.textPrimary)),
                ]),
              ),
            ]),
          ),

          if (suggestion != null) ...[
            const SizedBox(height: AppSpacing.md),
            AppCard(
              child: Row(children: [
                const IconBadge(Icons.hourglass_bottom_outlined),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Text(
                    'You have ${formatWorkload(suggestion.slot.minutes)} free from ${formatTime(suggestion.slot.start)}. '
                    '"${suggestion.task.title}" (${formatWorkload(suggestion.task.estimatedDurationMinutes!)}) would fit.',
                    style: AppTypography.subhead(c.textPrimary),
                  ),
                ),
              ]),
            ),
          ],

          const SectionHeader('Focus'),
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
                child: TaskRow(task: t, categoryColor: catColor[t.categoryId], highlighted: t.id == _focusTaskId, onToggle: _toggle, onDelete: _delete),
              ),

          if (dueHabits.isNotEmpty) ...[
            const SectionHeader('Habits'),
            for (final h in dueHabits)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: HabitListItem(
                  habit: h,
                  onToggle: (x) => repo.toggleHabitToday(x).catchError(toastError),
                  onDelete: (x) async {
                    if (await confirmDelete(context, 'habit')) await repo.deleteHabit(x.id).catchError(toastError);
                  },
                ),
              ),
          ],

          if (isEvening) ...[
            const SectionHeader('Evening review'),
            AppCard(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('${review.tasksCompletedToday} task${review.tasksCompletedToday == 1 ? '' : 's'} done · '
                    '${review.habitsCompletedToday} habit${review.habitsCompletedToday == 1 ? '' : 's'} checked off',
                    style: AppTypography.body(c.textPrimary)),
                const SizedBox(height: 4),
                Text('${review.stillPendingCount} still pending · ${review.tomorrowCount} due tomorrow',
                    style: AppTypography.subhead(c.textSecondary)),
              ]),
            ),
          ],
        ],
      ),
    );
  }
}

class _BriefingCard extends StatelessWidget {
  const _BriefingCard({required this.briefing});
  final DailyBriefing briefing;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    String plural(int n, String one, String many) => '$n ${n == 1 ? one : many}';
    final parts = [
      if (briefing.importantTaskCount > 0) plural(briefing.importantTaskCount, 'important task', 'important tasks'),
      if (briefing.appointmentCount > 0) plural(briefing.appointmentCount, 'appointment', 'appointments'),
      if (briefing.upcomingBillCount > 0) plural(briefing.upcomingBillCount, 'upcoming bill', 'upcoming bills'),
      if (briefing.habitCount > 0) plural(briefing.habitCount, 'habit', 'habits'),
    ];
    final workload = formatWorkload(briefing.estimatedWorkloadMinutes);

    return AppCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Eyebrow('Today you have'),
        const SizedBox(height: 4),
        Text(parts.isEmpty ? 'A clear day.' : parts.join(' · '), style: AppTypography.body(c.textPrimary)),
        if (briefing.mostImportantTask != null) ...[
          const SizedBox(height: AppSpacing.md),
          const Eyebrow('Most important'),
          const SizedBox(height: 2),
          Text(briefing.mostImportantTask!.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: AppTypography.headline(c.textPrimary)),
        ],
        if (workload.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.sm),
          Text('About $workload of work', style: AppTypography.caption(c.textTertiary)),
        ],
      ]),
    );
  }
}
