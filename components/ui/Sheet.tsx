import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';

export function Sheet({ children }: { children: React.ReactNode }) {
  const { colors, spacing, radius } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
      }}
    >
      <View
        style={{
          width: 36,
          height: 4,
          borderRadius: radius.full,
          backgroundColor: colors.border,
          alignSelf: 'center',
          marginTop: spacing.sm,
        }}
      />
      <View style={{ padding: spacing.lg, flex: 1 }}>{children}</View>
    </View>
  );
}
