import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatRow } from '../../../components/insights/StatRow';
import { Card, EmptyState } from '../../../components/ui';
import { useCategories } from '../../../features/categories/useCategories';
import { useEvents } from '../../../features/events/useEvents';
import { useExpenses } from '../../../features/expenses/useExpenses';
import { useHabits } from '../../../features/habits/useHabits';
import { useTasks } from '../../../features/tasks/useTasks';
import { computeCategoryTotals, computeMonthlySummary, computeMonthlyTrend } from '../../../lib/expenses/summary';
import { computeHabitInsights } from '../../../lib/insights/habitInsights';
import { computeProductivityStats } from '../../../lib/insights/productivity';
import { computeCategoryDistribution, computeWorkloadByDay } from '../../../lib/insights/workload';
import { useSession } from '../../../lib/supabase/useSession';
import { useTheme } from '../../../lib/theme/ThemeProvider';

function formatAvgCompletion(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${hours.toFixed(1)} hours`;
  return `${(hours / 24).toFixed(1)} days`;
}

function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

export default function InsightsScreen() {
  const { colors, spacing, typography } = useTheme();
  const insets = useSafeAreaInsets();

  const { session, isLoading: isSessionLoading } = useSession();
  const userId = session?.user.id;

  const { data: tasks = [], isLoading: isTasksLoading } = useTasks(userId);
  const { data: events = [], isLoading: isEventsLoading } = useEvents(userId);
  const { data: categories = [] } = useCategories(userId);
  const { data: expenses = [], isLoading: isExpensesLoading } = useExpenses(userId);
  const { data: habits = [], isLoading: isHabitsLoading } = useHabits(userId);

  const productivity = useMemo(() => computeProductivityStats(tasks), [tasks]);
  const workloadByDay = useMemo(() => computeWorkloadByDay(tasks, events, 7), [tasks, events]);
  const categoryDistribution = useMemo(() => computeCategoryDistribution(tasks), [tasks]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const monthlySummary = useMemo(() => computeMonthlySummary(expenses), [expenses]);
  const categoryTotals = useMemo(() => computeCategoryTotals(expenses), [expenses]);
  const monthlyTrend = useMemo(() => computeMonthlyTrend(expenses, 3), [expenses]);
  const currency = expenses[0]?.currency ?? 'PHP';

  const habitInsights = useMemo(() => computeHabitInsights(habits), [habits]);

  const isLoading = isSessionLoading || isTasksLoading || isEventsLoading || isExpensesLoading || isHabitsLoading;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.lg,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl,
      }}
    >
      <Text style={[typography.title, { color: colors.textPrimary, marginBottom: spacing.xs }]}>Insights</Text>
      <Text style={[typography.subhead, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
        A quiet look at how things are going - not a scoreboard.
      </Text>

      {isLoading ? (
        <ActivityIndicator color={colors.accent} />
      ) : (
        <>
          {/* ---------- Productivity ---------- */}
          <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
            Productivity
          </Text>
          <Card style={{ marginBottom: spacing.lg }}>
            <StatRow label="Tasks completed" value={`${productivity.completedCount} of ${productivity.totalCount}`} />
            <StatRow label="Completion rate" value={formatPercent(productivity.completionRate)} />
            <StatRow label="Overdue" value={String(productivity.overdueCount)} />
            <StatRow
              label="Avg. time to complete"
              value={
                productivity.averageCompletionHours !== null
                  ? formatAvgCompletion(productivity.averageCompletionHours)
                  : '—'
              }
            />
          </Card>

          {/* ---------- Time ---------- */}
          <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.sm }]}>Time</Text>
          <Card style={{ marginBottom: spacing.md }}>
            <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: spacing.xs }]}>
              NEXT 7 DAYS
            </Text>
            {workloadByDay.map((day, index) => {
              const label =
                index === 0
                  ? 'Today'
                  : new Date(day.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' });
              return (
                <StatRow
                  key={day.date}
                  label={label}
                  value={
                    day.taskCount === 0 && day.eventCount === 0
                      ? '—'
                      : `${day.taskCount + day.eventCount} ${day.taskCount + day.eventCount === 1 ? 'item' : 'items'}`
                  }
                />
              );
            })}
          </Card>
          {categoryDistribution.length > 0 ? (
            <Card style={{ marginBottom: spacing.lg }}>
              <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: spacing.xs }]}>
                TASKS BY CATEGORY
              </Text>
              {categoryDistribution.map((entry) => (
                <StatRow
                  key={entry.categoryId ?? 'none'}
                  label={entry.categoryId ? categoryById.get(entry.categoryId)?.name ?? 'Other' : 'Uncategorized'}
                  value={String(entry.count)}
                />
              ))}
            </Card>
          ) : null}

          {/* ---------- Money ---------- */}
          <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.sm }]}>Money</Text>
          <Card style={{ marginBottom: spacing.md }}>
            <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: spacing.xs }]}>
              THIS MONTH
            </Text>
            <StatRow label="Income" value={`${currency} ${monthlySummary.income.toFixed(2)}`} />
            <StatRow label="Expenses" value={`${currency} ${monthlySummary.expenses.toFixed(2)}`} />
            <StatRow label="Remaining" value={`${currency} ${monthlySummary.remaining.toFixed(2)}`} />
          </Card>
          {categoryTotals.length > 0 ? (
            <Card style={{ marginBottom: spacing.md }}>
              <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: spacing.xs }]}>
                SPENDING BY CATEGORY
              </Text>
              {categoryTotals.map((entry) => (
                <StatRow key={entry.category} label={entry.category} value={`${currency} ${entry.total.toFixed(2)}`} />
              ))}
            </Card>
          ) : null}
          <Card style={{ marginBottom: spacing.lg }}>
            <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: spacing.xs }]}>
              LAST 3 MONTHS
            </Text>
            {monthlyTrend.map((month) => (
              <View key={month.label} style={{ paddingVertical: spacing.xs }}>
                <Text style={[typography.subhead, { color: colors.textPrimary }]}>{month.label}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                  <Text style={[typography.caption, { color: colors.success }]}>
                    +{currency} {month.income.toFixed(2)}
                  </Text>
                  <Text style={[typography.caption, { color: colors.danger }]}>
                    -{currency} {month.expenses.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </Card>

          {/* ---------- Habits ---------- */}
          <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.sm }]}>Habits</Text>
          {habitInsights.length === 0 ? (
            <EmptyState message="Start a habit to see your consistency here." />
          ) : (
            <Card>
              {habitInsights.map(({ habit, streak, consistency }) => (
                <View key={habit.id} style={{ paddingVertical: spacing.xs }}>
                  <Text style={[typography.body, { color: colors.textPrimary }]}>{habit.name}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                    <Text style={[typography.caption, { color: colors.textTertiary }]}>
                      {streak > 0 ? `${streak} ${habit.frequency === 'daily' ? 'day' : 'week'} streak` : 'No streak yet'}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textTertiary }]}>
                      {formatPercent(consistency)} consistent (30d)
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
}
