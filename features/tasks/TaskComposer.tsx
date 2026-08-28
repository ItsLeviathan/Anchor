import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';

import { CategoryChipList } from '../../components/categories/CategoryChipList';
import { DueDatePicker } from '../../components/tasks/DueDatePicker';
import { PrioritySelector } from '../../components/tasks/PrioritySelector';
import { RecurrenceSelector } from '../../components/tasks/RecurrenceSelector';
import { Button, Input, Sheet } from '../../components/ui';
import { useSession } from '../../lib/supabase/useSession';
import { useTheme } from '../../lib/theme/ThemeProvider';
import type { RecurrenceRule, TaskPriority } from '../../types';
import { useCategories } from '../categories/useCategories';
import { useCreateTask } from './useTasks';

function toDatePart(date: Date): string {
  // Build the local date string manually rather than toISOString(), which
  // is UTC and would roll an evening due date to the next day for anyone
  // west of UTC.
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toTimePart(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

export function TaskComposer() {
  const router = useRouter();
  const { colors, spacing, typography } = useTheme();
  const { session } = useSession();
  const userId = session?.user.id;

  const { data: categories = [] } = useCategories(userId);
  const createTask = useCreateTask(userId);

  const [title, setTitle] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>(null);

  const canSave = title.trim().length > 0 && Boolean(userId) && !createTask.isPending;

  function handleDueDateChange(date: Date | null) {
    setDueDate(date);
    // A recurrence rule without a due date has nothing to repeat from.
    if (!date) setRecurrenceRule(null);
  }

  async function handleSave() {
    if (!userId || !canSave) return;

    await createTask.mutateAsync({
      userId,
      title,
      categoryId,
      dueDate: dueDate ? toDatePart(dueDate) : null,
      dueTime: dueDate ? toTimePart(dueDate) : null,
      priority,
      recurrenceRule: dueDate ? recurrenceRule : null,
    });

    router.back();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Sheet>
        <Text style={[typography.title, { color: colors.textPrimary, marginBottom: spacing.md }]}>New task</Text>

        <Input
          autoFocus
          placeholder="What do you need to do?"
          value={title}
          onChangeText={setTitle}
          returnKeyType="done"
        />

        {!showMore ? (
          <Pressable onPress={() => setShowMore(true)} style={{ marginTop: spacing.md }}>
            <Text style={[typography.subhead, { color: colors.accent }]}>More options</Text>
          </Pressable>
        ) : (
          <View style={{ marginTop: spacing.lg }}>
            <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: spacing.xs }]}>DUE</Text>
            <DueDatePicker dueDate={dueDate} onChange={handleDueDateChange} />

            {dueDate ? (
              <>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textTertiary, marginTop: spacing.md, marginBottom: spacing.xs },
                  ]}
                >
                  REPEAT
                </Text>
                <RecurrenceSelector value={recurrenceRule} onChange={setRecurrenceRule} />
              </>
            ) : null}

            <Text
              style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.md, marginBottom: spacing.xs }]}
            >
              PRIORITY
            </Text>
            <PrioritySelector value={priority} onChange={setPriority} />

            {categories.length > 0 ? (
              <>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textTertiary, marginTop: spacing.md, marginBottom: spacing.xs },
                  ]}
                >
                  CATEGORY
                </Text>
                <CategoryChipList categories={categories} selectedId={categoryId} onSelect={setCategoryId} />
              </>
            ) : null}
          </View>
        )}

        <View style={{ marginTop: spacing.xl }}>
          <Button label="Save task" onPress={handleSave} disabled={!canSave} loading={createTask.isPending} />
        </View>
      </Sheet>
    </KeyboardAvoidingView>
  );
}
