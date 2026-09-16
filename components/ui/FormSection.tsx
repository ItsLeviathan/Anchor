import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';

interface FormSectionProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * A labeled group of related form fields (e.g. "DUE", "PRIORITY"). Kept
 * deliberately quiet — a small tertiary-colored glyph next to the caption,
 * not a full colored IconBadge — so forms stay calm and functional while
 * content rows elsewhere keep the bolder colored badges.
 */
export function FormSection({ label, icon, children, style }: FormSectionProps) {
  const { colors, spacing, typography } = useTheme();

  return (
    <View style={[{ marginTop: spacing.lg }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm }}>
        {icon ? <Ionicons name={icon} size={13} color={colors.textTertiary} /> : null}
        <Text style={[typography.caption, { color: colors.textTertiary, letterSpacing: 0.4 }]}>
          {label.toUpperCase()}
        </Text>
      </View>
      {children}
    </View>
  );
}
