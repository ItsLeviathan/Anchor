import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';
import type { AssignmentKind } from '../../types';

const OPTIONS: { value: AssignmentKind; label: string }[] = [
  { value: 'assignment', label: 'Assignment' },
  { value: 'exam', label: 'Exam' },
  { value: 'project', label: 'Project' },
];

interface AssignmentKindSelectorProps {
  value: AssignmentKind;
  onChange: (kind: AssignmentKind) => void;
}

export function AssignmentKindSelector({ value, onChange }: AssignmentKindSelectorProps) {
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
            <Text style={[typography.subhead, { color: selected ? colors.accent : colors.textSecondary }]}>
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
  chip: { flex: 1, paddingVertical: 10, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth },
});
