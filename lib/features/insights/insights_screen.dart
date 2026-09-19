import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../core/logic/logic.dart';
import '../../core/models/models.dart';
import '../../core/providers.dart';
import '../../core/theme/tokens.dart';
import '../../core/utils/dates.dart';
import '../../core/widgets/ui.dart';

class _StatRow extends StatelessWidget {
  const _StatRow(this.label, this.value);
  final String label, value;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(children: [
        Expanded(child: Text(label, style: AppTypography.subhead(c.textSecondary))),
        Text(value, style: AppTypography.subhead(c.textPrimary).copyWith(fontWeight: FontWeight.w600)),
      ]),
    );
  }
}

class InsightsScreen extends ConsumerWidget {
  const InsightsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.colors;
    final tasks = ref.watch(tasksProvider).value ?? const <Task>[];
    final events = ref.watch(eventsProvider).value ?? const <CalendarEvent>[];
    final habits = ref.watch(habitsProvider).value ?? const <Habit>[];
    final expenses = ref.watch(expensesProvider).value ?? const <Expense>[];
    final categories = ref.watch(categoriesProvider).value ?? const <Category>[];

    final productivity = computeProductivityStats(tasks);
    final workload = computeWorkloadByDay(tasks, events);
    final habitInsights = habits.map((h) => (h, computeStreak(h), computeHabitConsistency(h))).toList();
    final summary = computeMonthlySummary(expenses);
    final totals = computeCategoryTotals(expenses);
    final distribution = computeCategoryDistribution(tasks);
    final currency = expenses.firstOrNull?.currency ?? 'PHP';
    final weekly = computeWeeklyReview(tasks, habits, expenses);
    String pct(double v) => '${(v * 100).round()}%';

    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, AppSpacing.md, 120),
        children: [
          const LargeTitle('Insights'),
          AppCard(
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const IconBadge(Icons.insights_outlined),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Eyebrow('Weekly review'),
                  const SizedBox(height: 2),
                  Text(weekly, style: AppTypography.body(c.textPrimary)),
                ]),
              ),
            ]),
          ),

          const SectionHeader('Productivity'),
          AppCard(
            child: Column(children: [
              _StatRow('Tasks completed', '${productivity.completedCount} of ${productivity.totalCount}'),
              _StatRow('Completion rate', pct(productivity.completionRate)),
              _StatRow('Overdue', '${productivity.overdueCount}'),
              if (productivity.averageCompletionHours != null)
                _StatRow('Average time to finish',
                    productivity.averageCompletionHours! < 24
                        ? '${productivity.averageCompletionHours!.toStringAsFixed(1)}h'
                        : '${(productivity.averageCompletionHours! / 24).toStringAsFixed(1)}d'),
            ]),
          ),

          const SectionHeader('Next 7 days'),
          AppCard(
            child: Column(children: [
              for (final d in workload)
                _StatRow(
                  isSameDay(parseDateKey(d.date), DateTime.now()) ? 'Today' : DateFormat('EEE, MMM d').format(parseDateKey(d.date)),
                  '${d.taskCount} task${d.taskCount == 1 ? '' : 's'} · ${d.eventCount} event${d.eventCount == 1 ? '' : 's'}'
                      '${d.estimatedMinutes > 0 ? ' · ${formatWorkload(d.estimatedMinutes)}' : ''}',
                ),
            ]),
          ),
          if (distribution.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.md),
            AppCard(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Eyebrow('Tasks by category'),
                const SizedBox(height: 4),
                for (final e in distribution)
                  _StatRow(
                    categories.where((x) => x.id == e.key).firstOrNull?.name ?? 'Uncategorized',
                    '${e.value}',
                  ),
              ]),
            ),
          ],

          const SectionHeader('Habits'),
          if (habitInsights.isEmpty)
            const EmptyState(icon: Icons.local_fire_department_outlined, title: 'No habits yet', message: 'Add one from the Life tab.')
          else
            AppCard(
              child: Column(children: [
                for (final (h, streak, consistency) in habitInsights)
                  _StatRow(h.name, '$streak ${h.frequency == 'daily' ? 'day' : 'wk'} streak · ${pct(consistency)}'),
              ]),
            ),

          const SectionHeader('Money'),
          AppCard(
            child: Column(children: [
              _StatRow('Income', formatMoney(summary.income, currency)),
              _StatRow('Expenses', formatMoney(summary.expenses, currency)),
              _StatRow('Remaining', formatMoney(summary.remaining, currency)),
            ]),
          ),
          if (totals.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.md),
            AppCard(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Eyebrow('Spending by category'),
                const SizedBox(height: 4),
                for (final e in totals) _StatRow(e.key, formatMoney(e.value, currency)),
              ]),
            ),
          ],
        ],
      ),
    );
  }
}
