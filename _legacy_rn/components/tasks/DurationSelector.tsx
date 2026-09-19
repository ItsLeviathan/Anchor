import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';

const OPTIONS: { minutes: number | null; label: string }[] = [
  { minutes: null, label: 'None' },
  { minutes: 15, label: '15m' },
  { minutes: 30, label: '30m' },
  { minutes: 60, label: '1h' },
  { minutes: 120, label: '2h' },
];

interface DurationSelectorProps {
  value: number | null;
  onChange: (minutes: number | null) => void;
}

export function DurationSelector({ value, onChange }: DurationSelectorProps) {
  const { colors, radius, spacing, typography } = useTheme();

  return (
    <View style={[styles.row, { gap: spacing.xs }]}>
      {OPTIONS.map((option) => {
        const selected = option.minutes === value;
        return (
          <Pressable
            key={option.label}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.minutes)}
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
