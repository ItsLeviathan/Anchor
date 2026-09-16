import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';

export function Input({ style, secureTextEntry, ...props }: TextInputProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const [hidden, setHidden] = useState(true);

  const inputStyle = [
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
    secureTextEntry ? { paddingRight: spacing.xl + spacing.sm } : null,
    style,
  ];

  if (!secureTextEntry) {
    return (
      <TextInput placeholderTextColor={colors.textTertiary} style={inputStyle} {...props} />
    );
  }

  return (
    <View>
      <TextInput
        placeholderTextColor={colors.textTertiary}
        style={inputStyle}
        secureTextEntry={hidden}
        {...props}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
        onPress={() => setHidden((prev) => !prev)}
        hitSlop={12}
        style={{ position: 'absolute', right: spacing.md, top: 0, bottom: 0, justifyContent: 'center' }}
      >
        <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={18} color={colors.textTertiary} />
      </Pressable>
    </View>
  );
}
