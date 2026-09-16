import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';
import { IconBadge } from '../ui';

interface CategorySummaryRowProps {
  name: string;
  color: string;
  count: number;
  /** Stored Ionicons glyph name for this category, if any. Arbitrary
   *  user/DB-provided string — validated against the known glyph map before
   *  rendering, falling back to a plain color dot when absent or unknown. */
  icon?: string | null;
  onPress?: () => void;
}

function isKnownIonicon(icon: string | null | undefined): icon is keyof typeof Ionicons.glyphMap {
  return !!icon && icon in Ionicons.glyphMap;
}

export const CategorySummaryRow = React.memo(function CategorySummaryRow({
  name,
  color,
  count,
  icon,
  onPress,
}: CategorySummaryRowProps) {
  const { colors, spacing, typography } = useTheme();
  const validIcon = isKnownIonicon(icon) ? icon : null;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, { paddingVertical: spacing.sm, minHeight: 44 }]}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      {validIcon ? <IconBadge name={validIcon} color={color} size="sm" /> : <View style={[styles.dot, { backgroundColor: color }]} />}
      <Text style={[typography.body, { color: colors.textPrimary, flex: 1, marginLeft: spacing.sm }]}>{name}</Text>
      <Text style={[typography.subhead, { color: colors.textTertiary }]}>
        {count} {count === 1 ? 'item' : 'items'}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
