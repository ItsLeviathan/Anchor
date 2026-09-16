import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, View } from 'react-native';

import { mixColor, tintColor } from '../../lib/theme/colorUtils';
import { useTheme } from '../../lib/theme/ThemeProvider';

interface BrandMarkProps {
  size?: 'md' | 'lg';
}

const TILE_SIZES = { md: 56, lg: 76 } as const;

/**
 * Anchor's mark: the same artwork exported as the app/splash icon
 * (assets/brand-mark.png), set inside a diagonal gradient tile with a
 * soft glass-like highlight — matching the app icon's treatment exactly,
 * generated from the same accent color so it's correct in both themes.
 * Used identically on the bootstrap (loading), app-lock, and welcome
 * screens so the whole pre-app sequence reads as one continuous moment
 * instead of three unrelated visuals stitched together.
 */
export function BrandMark({ size = 'md' }: BrandMarkProps) {
  const { colors, radius, shadow } = useTheme();
  const tile = TILE_SIZES[size];
  const glow = tile * 2.5;
  const gradientLight = mixColor(colors.accent, [255, 255, 255], 0.3);
  const gradientDark = mixColor(colors.accent, [0, 0, 0], 0.32);

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
            overflow: 'hidden',
          },
          shadow.md,
        ]}
      >
        <LinearGradient
          colors={[gradientLight, gradientDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.38)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.65, y: 0.65 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <Image
            source={require('../../assets/brand-mark.png')}
            style={{ width: tile * 0.62, height: tile * 0.62 }}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </LinearGradient>
      </View>
    </View>
  );
}
