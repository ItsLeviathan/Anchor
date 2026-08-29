import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';
import type { ExpenseType } from '../../types';

interface ExpenseTypeToggleProps {
  value: ExpenseType;
  onChange: (type: ExpenseType) => void;
}

export function ExpenseTypeToggle({ value, onChange }: ExpenseTypeToggleProps) {
  const { colors, spacing, radius, typography } = useTheme();

  const options: { value: ExpenseType; label: string }[] = [
    { value: 'expense', label: 'Expense' },
    { value: 'income', label: 'Income' },
  ];

  return (
    <View style={[styles.row, { gap: spacing.xs }]}>
      {options.map((option) => {
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
            <Text style={[typography.headline, { color: selected ? colors.accent : colors.textSecondary }]}>
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
  chip: { flex: 1, paddingVertical: 12, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth },
});
