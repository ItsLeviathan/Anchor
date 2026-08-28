import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';
import type { RecurrenceRule } from '../../types';

type RecurrenceOption = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

const OPTIONS: { value: RecurrenceOption; label: string }[] = [
  { value: 'none', label: 'Never' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

function toRule(option: RecurrenceOption): RecurrenceRule | null {
  if (option === 'none') return null;
  return { freq: option, interval: 1 };
}

interface RecurrenceSelectorProps {
  value: RecurrenceRule | null;
  onChange: (rule: RecurrenceRule | null) => void;
}

export function RecurrenceSelector({ value, onChange }: RecurrenceSelectorProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const selectedOption: RecurrenceOption = value ? value.freq : 'none';

  return (
    <View style={[styles.row, { gap: spacing.xs }]}>
      {OPTIONS.map((option) => {
        const selected = option.value === selectedOption;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(toRule(option.value))}
            style={[
              styles.chip,
              {
                borderRadius: radius.full,
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
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderWidth: StyleSheet.hairlineWidth },
});
