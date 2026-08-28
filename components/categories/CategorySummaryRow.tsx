import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';

interface CategorySummaryRowProps {
  name: string;
  color: string;
  count: number;
  onPress?: () => void;
}

export function CategorySummaryRow({ name, color, count, onPress }: CategorySummaryRowProps) {
  const { colors, spacing, typography } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, { paddingVertical: spacing.sm }]}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[typography.body, { color: colors.textPrimary, flex: 1, marginLeft: spacing.sm }]}>{name}</Text>
      <Text style={[typography.subhead, { color: colors.textTertiary }]}>
        {count} {count === 1 ? 'item' : 'items'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
