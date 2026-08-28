import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventRow } from '../../../components/calendar/EventRow';
import { MonthGrid } from '../../../components/calendar/MonthGrid';
import { TaskRow } from '../../../components/tasks/TaskRow';
import { EmptyState } from '../../../components/ui';
import { useDeleteEvent, useEvents } from '../../../features/events/useEvents';
import { useCompleteTask, useDeleteTask, useReopenTask, useTasks } from '../../../features/tasks/useTasks';
import { buildAgenda } from '../../../lib/calendar/agenda';
import { buildMonthGrid, isSameDay } from '../../../lib/calendar/monthGrid';
import { useSession } from '../../../lib/supabase/useSession';
import { useTheme } from '../../../lib/theme/ThemeProvider';
import type { Task } from '../../../types';

export default function CalendarScreen() {
  const { colors, spacing, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { session, isLoading: isSessionLoading } = useSession();
  const userId = session?.user.id;

  const { data: tasks = [], isLoading: isTasksLoading } = useTasks(userId);
  const { data: events = [], isLoading: isEventsLoading } = useEvents(userId);

  const completeTask = useCompleteTask(userId);
  const reopenTask = useReopenTask(userId);
  const deleteTask = useDeleteTask(userId);
  const deleteEvent = useDeleteEvent(userId);

  const today = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);

  const cells = useMemo(() => buildMonthGrid(visibleMonth.getFullYear(), visibleMonth.getMonth()), [visibleMonth]);

  function hasItems(date: Date): boolean {
    const dateHasTask = tasks.some((task) => {
      if (!task.dueDate || task.status !== 'pending') return false;
      const [year, month, day] = task.dueDate.split('-').map(Number);
      return isSameDay(new Date(year, month - 1, day), date);
    });
    if (dateHasTask) return true;

    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    return events.some((event) => new Date(event.startAt) < dayEnd && new Date(event.endAt) > dayStart);
  }

  const agenda = useMemo(() => buildAgenda(tasks, events, selectedDate), [tasks, events, selectedDate]);

  function handleCompleteTask(task: Task) {
    if (task.status === 'completed') {
      reopenTask.mutate(task.id);
    } else {
      completeTask.mutate(task);
    }
  }

  function goToMonth(delta: number) {
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  const isLoading = isSessionLoading || isTasksLoading || isEventsLoading;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.lg,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[typography.title, { color: colors.textPrimary }]}>Calendar</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add event"
          onPress={() => router.push('/event-new')}
          hitSlop={8}
        >
          <Ionicons name="add-circle-outline" size={26} color={colors.accent} />
        </Pressable>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: spacing.md,
          marginBottom: spacing.sm,
        }}
      >
        <Pressable onPress={() => goToMonth(-1)} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
        </Pressable>
        <Text style={[typography.headline, { color: colors.textPrimary }]}>
          {visibleMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable onPress={() => goToMonth(1)} hitSlop={8}>
          <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
      ) : (
        <>
          <MonthGrid
            cells={cells}
            selectedDate={selectedDate}
            today={today}
            hasItems={hasItems}
            onSelectDate={setSelectedDate}
          />

          <View style={{ marginTop: spacing.xl }}>
            <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: spacing.sm }]}>
              {selectedDate
                .toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
                .toUpperCase()}
            </Text>

            {agenda.length === 0 ? (
              <EmptyState message="Nothing scheduled this day." />
            ) : (
              <View style={{ gap: spacing.xs }}>
                {agenda.map((item) =>
                  item.type === 'task' ? (
                    <TaskRow
                      key={item.id}
                      task={item.task}
                      onComplete={handleCompleteTask}
                      onDelete={(task) => deleteTask.mutate(task.id)}
                    />
                  ) : (
                    <EventRow key={item.id} event={item.event} onDelete={(event) => deleteEvent.mutate(event.id)} />
                  )
                )}
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}
