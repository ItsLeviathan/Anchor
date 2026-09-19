import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';

interface CardProps extends ViewProps {
  /** Shadow depth. Defaults to 'sm' — enough to lift a row off the
   *  background without every card competing for attention. */
  elevation?: 'sm' | 'md' | 'lg';
}

export const Card = React.memo(function Card({ style, elevation = 'sm', ...props }: CardProps) {
  const { colors, spacing, radius, shadow, scheme } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
          // Depth comes from the shadow in light mode; dark-mode shadows
          // barely register against a dark background, so a hairline
          // border there keeps cards legibly separated from it.
          borderWidth: scheme === 'dark' ? StyleSheet.hairlineWidth : 0,
          borderColor: colors.border,
          ...shadow[elevation],
        },
        style,
      ]}
      {...props}
    />
  );
});
