import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

import { tintColor } from '../../lib/theme/colorUtils';
import { useTheme } from '../../lib/theme/ThemeProvider';

interface IconBadgeProps {
  name: keyof typeof Ionicons.glyphMap;
  /** Hex color (e.g. a category's color, or a theme color). Defaults to the
   *  accent color when omitted. */
  color?: string;
  size?: 'sm' | 'md';
}

const SIZES = { sm: 28, md: 40 } as const;
const ICON_SIZES = { sm: 14, md: 20 } as const;

export function IconBadge({ name, color, size = 'md' }: IconBadgeProps) {
  const { colors, radius } = useTheme();
  const tone = color ?? colors.accent;
  const dimension = SIZES[size];

  return (
    <View
      style={{
        width: dimension,
        height: dimension,
        borderRadius: radius.full,
        backgroundColor: tintColor(tone, '26'), // ~15% opacity
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={name} size={ICON_SIZES[size]} color={tone} />
    </View>
  );
}
