import React from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';

export function Input(props: TextInputProps) {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <TextInput
      placeholderTextColor={colors.textTertiary}
      style={[
        typography.body,
        {
          color: colors.textPrimary,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: radius.md,
          paddingVertical: spacing.sm + 4,
          paddingHorizontal: spacing.md,
        },
      ]}
      {...props}
    />
  );
}
