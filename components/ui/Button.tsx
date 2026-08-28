import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
}

export function Button({ label, variant = 'primary', loading, disabled, ...props }: ButtonProps) {
  const { colors, spacing, radius, typography } = useTheme();

  const backgroundColor =
    variant === 'primary' ? colors.accent : variant === 'secondary' ? colors.surfaceElevated : 'transparent';
  const textColor = variant === 'primary' ? '#FFFFFF' : colors.textPrimary;
  const showBorder = variant === 'secondary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor,
          borderColor: showBorder ? colors.border : 'transparent',
          borderWidth: showBorder ? StyleSheet.hairlineWidth : 0,
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          opacity: pressed ? 0.85 : disabled ? 0.5 : 1,
        },
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[typography.headline, { color: textColor, textAlign: 'center' }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
