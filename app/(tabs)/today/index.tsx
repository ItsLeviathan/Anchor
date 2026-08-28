import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategorySummaryRow } from '../../../components/categories/CategorySummaryRow';
import { TaskRow } from '../../../components/tasks/TaskRow';
import { EmptyState } from '../../../components/ui';
import { useCategories } from '../../../features/categories/useCategories';
import { useCompleteTask, useDeleteTask, useReopenTask, useTasks } from '../../../features/tasks/useTasks';
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

export default function TodayScreen() {
  const { colors, spacing, typography } = useTheme();
  const insets = useSafeAreaInsets();

  const { session, isLoading: isSessionLoading } = useSession();
  const userId = session?.user.id;

  const { data: tasks = [], isLoading: isTasksLoading } = useTasks(userId);
  const { data: categories = [] } = useCategories(userId);
  const completeTask = useCompleteTask(userId);
  const reopenTask = useReopenTask(userId);
  const deleteTask = useDeleteTask(userId);

  const todayTasks = useMemo(() => selectTodayTasks(tasks), [tasks]);

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

  const isLoading = isSessionLoading || isTasksLoading;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.lg,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl,
      }}
    >
      <Text style={[typography.largeTitle, { color: colors.textPrimary }]}>{getGreeting()}</Text>
      <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.xs }]}>
        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
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

          {todayTasks.length > 0 ? (
            <View style={{ marginBottom: spacing.xl }}>
              <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: spacing.xs }]}>TODAY</Text>
              <View style={{ gap: spacing.xs }}>
                {todayTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    categoryColor={task.categoryId ? categoryById.get(task.categoryId)?.color : undefined}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                  />
                ))}
              </View>
            </View>
          ) : (
            <EmptyState message="Nothing demanding your attention yet." />
          )}

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
