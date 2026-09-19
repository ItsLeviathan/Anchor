import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';
import type { DocumentCategory } from '../../types';

const CATEGORIES: DocumentCategory[] = ['ID', 'School', 'Certificate', 'Contract', 'Other'];

interface DocumentCategorySelectorProps {
  value: DocumentCategory;
  onChange: (category: DocumentCategory) => void;
}

export function DocumentCategorySelector({ value, onChange }: DocumentCategorySelectorProps) {
  const { colors, radius, spacing, typography } = useTheme();

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
