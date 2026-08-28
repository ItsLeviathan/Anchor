import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';

export function Card({ style, ...props }: ViewProps) {
  const { colors, spacing, radius } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        style,
      ]}
      {...props}
    />
  );
}
