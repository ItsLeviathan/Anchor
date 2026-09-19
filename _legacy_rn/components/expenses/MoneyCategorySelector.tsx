import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';
import type { MoneyCategory } from '../../types';

const CATEGORIES: MoneyCategory[] = [
  'Food',
  'Transportation',
  'Bills',
  'Shopping',
  'Entertainment',
  'School',
  'Health',
  'Personal',
  'Other',
];

interface MoneyCategorySelectorProps {
  value: MoneyCategory;
  onChange: (category: MoneyCategory) => void;
}

export function MoneyCategorySelector({ value, onChange }: MoneyCategorySelectorProps) {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <View style={[styles.row, { gap: spacing.xs }]}>
      {CATEGORIES.map((category) => {
        const selected = category === value;
        return (
          <Pressable
            key={category}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(category)}
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
              {category}
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
