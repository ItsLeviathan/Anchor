import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { FadeInView } from '../ui/FadeInView';
import { computeStreak, isCompletedToday } from '../../lib/habits/streak';
import { useTheme } from '../../lib/theme/ThemeProvider';
import type { Habit } from '../../types';

interface HabitListItemProps {
  habit: Habit;
  onToggleToday: (habit: Habit) => void;
  onDelete?: (habit: Habit) => void;
}

function HabitListItemInner({ habit, onToggleToday, onDelete }: HabitListItemProps) {
  const { colors, spacing, typography } = useTheme();
  const done = isCompletedToday(habit);
  const streak = computeStreak(habit);
  const unit = habit.frequency === 'daily' ? 'day' : 'week';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm + 3,
        paddingHorizontal: spacing.md,
      }}
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={done ? 'Completed today' : 'Mark done today'}
        accessibilityHint={done ? 'Marks this habit as not done' : 'Records a completion for today'}
        onPress={() => onToggleToday(habit)}
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          borderWidth: 2,
          borderColor: done ? colors.success : colors.border,
          backgroundColor: done ? colors.success : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {done ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
      </Pressable>

      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={[typography.body, { color: colors.textPrimary }]} numberOfLines={1}>
          {habit.name}
        </Text>
        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
          {streak > 0 ? `${streak} ${unit}${streak === 1 ? '' : 's'} in a row` : 'Start today'}
        </Text>
      </View>

      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete habit"
          accessibilityHint="Permanently removes this habit"
          onPress={() => onDelete(habit)}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
        </Pressable>
      ) : null}
    </View>
  );
}

export const HabitListItem = React.memo(function HabitListItem(props: HabitListItemProps) {
  return (
    <FadeInView>
      <HabitListItemInner {...props} />
    </FadeInView>
  );
});
