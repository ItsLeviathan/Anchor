import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategorySummaryRow } from '../../../components/categories/CategorySummaryRow';
import { HabitListItem } from '../../../components/habits/HabitListItem';
import { DailyBriefingCard } from '../../../components/insights/DailyBriefingCard';
import { EveningReviewCard } from '../../../components/insights/EveningReviewCard';
import { FreeTimeCard } from '../../../components/insights/FreeTimeCard';
import { TaskRow } from '../../../components/tasks/TaskRow';
import { EmptyState, SyncStatusBadge } from '../../../components/ui';
import { DailyPlanCard } from '../../../features/ai/DailyPlanCard';
import { useBills } from '../../../features/bills/useBills';
import { useCategories } from '../../../features/categories/useCategories';
import { useEvents } from '../../../features/events/useEvents';
import { useHabits, useToggleHabitToday } from '../../../features/habits/useHabits';
import { useCompleteTask, useDeleteTask, useReopenTask, useTasks } from '../../../features/tasks/useTasks';
import { computeDailyBriefing } from '../../../lib/insights/dailyBriefing';
import { computeEveningReview } from '../../../lib/insights/eveningReview';
import { suggestTaskForFreeTime } from '../../../lib/insights/freeTime';
import { arePersonalizedSuggestionsEnabled } from '../../../lib/insights/preferences';
import { isDueToday } from '../../../lib/habits/streak';
import { useSession } from '../../../lib/supabase/useSession';
import { selectTodayTasks } from '../../../lib/tasks/prioritization';
import { useTheme } from '../../../lib/theme/ThemeProvider';
import type { Task } from '../../../types';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const EVENING_HOUR = 18;

export default function TodayScreen() {
  const { colors, spacing, typography } = useTheme();
  const insets = useSafeAreaInsets();

  const { session, isLoading: isSessionLoading } = useSession();
  const userId = session?.user.id;

  const { data: tasks = [], isLoading: isTasksLoading } = useTasks(userId);
  const { data: events = [], isLoading: isEventsLoading } = useEvents(userId);
  const { data: bills = [], isLoading: isBillsLoading } = useBills(userId);
  const { data: categories = [] } = useCategories(userId);
  const { data: habits = [], isLoading: isHabitsLoading } = useHabits(userId);
  const completeTask = useCompleteTask(userId);
  const reopenTask = useReopenTask(userId);
  const deleteTask = useDeleteTask(userId);
  const toggleHabitToday = useToggleHabitToday(userId);

  const [personalizedSuggestionsOn, setPersonalizedSuggestionsOn] = useState(true);
  useEffect(() => {
    arePersonalizedSuggestionsEnabled()
      .then(setPersonalizedSuggestionsOn)
      .catch((err) => console.error('Failed to load personalization preference', err));
  }, []);

  const todayTasks = useMemo(() => selectTodayTasks(tasks), [tasks]);
  const dueHabits = useMemo(() => habits.filter((habit) => isDueToday(habit)), [habits]);
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);

  const now = new Date();
  const isEvening = now.getHours() >= EVENING_HOUR;

  const dailyBriefing = useMemo(() => computeDailyBriefing(tasks, events, bills, habits, now), [tasks, events, bills, habits]);
  const eveningReview = useMemo(() => computeEveningReview(tasks, habits, now), [tasks, habits]);
  const freeTimeSuggestion = useMemo(
    () => (personalizedSuggestionsOn ? suggestTaskForFreeTime(tasks, events, now) : null),
    [tasks, events, personalizedSuggestionsOn]
  );

  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const task of tasks) {
      if (task.status !== 'pending' || !task.categoryId) continue;
      counts.set(task.categoryId, (counts.get(task.categoryId) ?? 0) + 1);
    }
    return counts;
  }, [tasks]);

  const categoriesWithItems = categories.filter((category) => (categoryCounts.get(category.id) ?? 0) > 0);

  function handleComplete(task: Task) {
    if (task.status === 'completed') {
      reopenTask.mutate(task.id);
    } else {
      completeTask.mutate(task);
    }
  }

  function handleDelete(task: Task) {
    deleteTask.mutate(task.id);
  }

  const isLoading = isSessionLoading || isTasksLoading || isEventsLoading || isBillsLoading || isHabitsLoading;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.lg,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Text style={[typography.largeTitle, { color: colors.textPrimary }]}>{getGreeting()}</Text>
        <View style={{ marginTop: spacing.xs }}>
          <SyncStatusBadge />
        </View>
      </View>
      <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.xs }]}>
        {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      </Text>

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
      ) : (
        <>
          <Text
            style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.lg }]}
          >
            {todayTasks.length === 0
              ? "You're all caught up."
              : `You have ${todayTasks.length} ${todayTasks.length === 1 ? 'thing' : 'things'} that matter today.`}
          </Text>

          {isEvening ? <EveningReviewCard review={eveningReview} /> : <DailyBriefingCard briefing={dailyBriefing} />}

          {freeTimeSuggestion ? <FreeTimeCard suggestion={freeTimeSuggestion} /> : null}

          <DailyPlanCard onFocusTask={setFocusTaskId} />

          {todayTasks.length > 0 ? (
            <View style={{ marginBottom: spacing.xl }}>
              <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: spacing.xs }]}>TODAY</Text>
              <View style={{ gap: spacing.xs }}>
                {todayTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    categoryColor={task.categoryId ? categoryById.get(task.categoryId)?.color : undefined}
                    highlighted={task.id === focusTaskId}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                  />
                ))}
              </View>
            </View>
          ) : (
            <EmptyState message="Nothing demanding your attention yet." />
          )}

          {dueHabits.length > 0 ? (
            <View style={{ marginBottom: spacing.xl }}>
              <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: spacing.xs }]}>
                HABITS
              </Text>
              <View style={{ gap: spacing.xs }}>
                {dueHabits.map((habit) => (
                  <HabitListItem key={habit.id} habit={habit} onToggleToday={(h) => toggleHabitToday.mutate(h)} />
                ))}
              </View>
            </View>
          ) : null}

          {categoriesWithItems.length > 0 ? (
            <View>
              <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: spacing.xs }]}>
                YOUR LIFE
              </Text>
              {categoriesWithItems.map((category) => (
                <CategorySummaryRow
                  key={category.id}
                  name={category.name}
                  color={category.color}
                  count={categoryCounts.get(category.id) ?? 0}
                />
              ))}
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}
