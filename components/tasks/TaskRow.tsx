import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { useTheme } from '../../lib/theme/ThemeProvider';
import { formatDueLabel } from '../../lib/tasks/formatDueLabel';
import { isOverdue } from '../../lib/tasks/prioritization';
import type { Task, TaskPriority } from '../../types';

interface TaskRowProps {
  task: Task;
  categoryColor?: string;
  highlighted?: boolean;
  onComplete: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskRow({ task, categoryColor, highlighted, onComplete, onDelete }: TaskRowProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const swipeableRef = React.useRef<React.ComponentRef<typeof ReanimatedSwipeable>>(null);
  const overdue = isOverdue(task);
  const isCompleted = task.status === 'completed';

  const priorityColors: Record<TaskPriority, string> = {
    low: colors.textTertiary,
    medium: colors.accent,
    high: '#D98A3D',
    urgent: colors.danger,
  };

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      friction={2}
      leftThreshold={40}
      rightThreshold={40}
      renderLeftActions={() => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Complete task"
          onPress={() => {
            swipeableRef.current?.close();
            onComplete(task);
          }}
          style={[styles.action, { backgroundColor: colors.success, borderRadius: radius.lg }]}
        >
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
        </Pressable>
      )}
      renderRightActions={() => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete task"
          onPress={() => {
            swipeableRef.current?.close();
            onDelete(task);
          }}
          style={[styles.action, { backgroundColor: colors.danger, borderRadius: radius.lg }]}
        >
          <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
        </Pressable>
      )}
    >
      <View
        style={[
          styles.row,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            padding: spacing.md,
            borderWidth: highlighted ? 1.5 : 0,
            borderColor: highlighted ? colors.accent : 'transparent',
          },
        ]}
      >
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isCompleted }}
          accessibilityLabel={isCompleted ? 'Mark as not done' : 'Mark as done'}
          onPress={() => onComplete(task)}
          style={[
            styles.checkbox,
            {
              borderColor: priorityColors[task.priority],
              backgroundColor: isCompleted ? priorityColors[task.priority] : 'transparent',
            },
          ]}
        >
          {isCompleted ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
        </Pressable>

        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text
            style={[
              typography.body,
              {
                color: isCompleted ? colors.textTertiary : colors.textPrimary,
                textDecorationLine: isCompleted ? 'line-through' : 'none',
              },
            ]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          {task.dueDate ? (
            <Text
              style={[
                typography.caption,
                { color: overdue ? colors.danger : colors.textTertiary, marginTop: 2 },
              ]}
            >
              {formatDueLabel(task.dueDate, task.dueTime, task.status)}
            </Text>
          ) : null}
        </View>

        {categoryColor ? <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} /> : null}
      </View>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  action: { width: 64, justifyContent: 'center', alignItems: 'center', marginVertical: 2 },
});
