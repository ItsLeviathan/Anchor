import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  hint?: string;
}

export function Button({ label, variant = 'primary', loading, disabled, hint, ...props }: ButtonProps) {
  const { colors, spacing, radius, shadow, typography } = useTheme();

  const backgroundColor =
    variant === 'primary' ? colors.accent : variant === 'secondary' ? colors.surfaceElevated : 'transparent';
  const textColor = variant === 'primary' ? '#FFFFFF' : colors.textPrimary;
  const showBorder = variant === 'secondary';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor,
          borderColor: showBorder ? colors.border : 'transparent',
          borderWidth: showBorder ? StyleSheet.hairlineWidth : 0,
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          opacity: pressed ? 0.85 : isDisabled ? 0.5 : 1,
          // A subtle lift on the primary action only — secondary/ghost stay
          // flat so they read as lower-emphasis, not just differently colored.
          ...(variant === 'primary' && !isDisabled ? shadow.sm : null),
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
