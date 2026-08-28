import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';
import type { TaskPriority } from '../../types';

const OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

interface PrioritySelectorProps {
  value: TaskPriority;
  onChange: (value: TaskPriority) => void;
}

export function PrioritySelector({ value, onChange }: PrioritySelectorProps) {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <View style={[styles.row, { gap: spacing.xs }]}>
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[
              styles.chip,
              {
                borderRadius: radius.md,
                borderColor: selected ? colors.accent : colors.border,
                backgroundColor: selected ? colors.accentMuted : colors.surface,
              },
            ]}
          >
            <Text
              style={[
                typography.subhead,
                { color: selected ? colors.accent : colors.textSecondary },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  chip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
