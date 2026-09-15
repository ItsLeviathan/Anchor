import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';

interface LockScreenProps {
  onUnlock: () => void;
  isAuthenticating: boolean;
  error?: string | null;
}

export function LockScreen({ onUnlock, isAuthenticating, error }: LockScreenProps) {
  const { colors, spacing, typography, radius } = useTheme();

  // Auto-prompt on mount so the biometric sheet appears immediately.
  useEffect(() => {
    onUnlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
      }}
    >
      <Text
        style={[
          typography.largeTitle,
          { color: colors.textPrimary, letterSpacing: -1, marginBottom: spacing.xs },
        ]}
      >
        Anchor
      </Text>
      <Text style={[typography.subhead, { color: colors.textSecondary, marginBottom: spacing.xxl }]}>
        Keep your life together.
      </Text>

      <Pressable
        onPress={onUnlock}
        disabled={isAuthenticating}
        accessibilityRole="button"
        accessibilityLabel="Unlock Anchor with biometrics"
        style={({ pressed }) => ({
          backgroundColor: colors.accent,
          borderRadius: radius.lg,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
          opacity: pressed || isAuthenticating ? 0.8 : 1,
        })}
      >
        <Text style={[typography.headline, { color: '#FFFFFF' }]}>
          {isAuthenticating ? 'Unlocking…' : 'Unlock'}
        </Text>
      </Pressable>

      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[typography.caption, { color: colors.danger, marginTop: spacing.md, textAlign: 'center' }]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
