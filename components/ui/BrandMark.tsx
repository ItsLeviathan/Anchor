import React from 'react';
import { Image, View } from 'react-native';

import { tintColor } from '../../lib/theme/colorUtils';
import { useTheme } from '../../lib/theme/ThemeProvider';

interface BrandMarkProps {
  size?: 'md' | 'lg';
}

const TILE_SIZES = { md: 56, lg: 76 } as const;

/**
 * Anchor's mark: the same artwork exported as the app/splash icon
 * (assets/brand-mark.png), set inside a rounded accent tile with a
 * two-layer soft glow. Used identically on the bootstrap (loading),
 * app-lock, and welcome screens so the whole pre-app sequence reads as one
 * continuous moment instead of three unrelated visuals stitched together.
 */
export function BrandMark({ size = 'md' }: BrandMarkProps) {
  const { colors, radius, shadow } = useTheme();
  const tile = TILE_SIZES[size];
  const glow = tile * 2.5;

  return (
    <View style={{ width: glow, height: glow, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          width: glow,
          height: glow,
          borderRadius: glow / 2,
          backgroundColor: tintColor(colors.accent, '0F'),
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: glow * 0.64,
          height: glow * 0.64,
          borderRadius: (glow * 0.64) / 2,
          backgroundColor: tintColor(colors.accent, '1C'),
        }}
      />
      <View
        style={[
          {
            width: tile,
            height: tile,
            borderRadius: radius.lg,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          },
          shadow.md,
        ]}
      >
        <Image
          source={require('../../assets/brand-mark.png')}
          style={{ width: tile * 0.62, height: tile * 0.62 }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </View>
    </View>
  );
}
