import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';
import type { Category } from '../../types';

interface CategoryChipListProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryChipList({ categories, selectedId, onSelect }: CategoryChipListProps) {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
      {categories.map((category) => {
        const selected = category.id === selectedId;
        return (
          <Pressable
            key={category.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onSelect(selected ? null : category.id)}
            style={[
              styles.chip,
              {
                borderRadius: radius.full,
                borderColor: selected ? category.color : colors.border,
                backgroundColor: selected ? colors.accentMuted : colors.surface,
              },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: category.color }]} />
            <Text style={[typography.subhead, { color: colors.textPrimary }]}>{category.name}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
});
