import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';
import { BrandMark } from '../ui/BrandMark';
import { Button } from '../ui/Button';
import { FadeInView } from '../ui/FadeInView';

interface BootstrapScreenProps {
  status: 'loading' | 'error';
  onRetry?: () => void;
}

/**
 * Shown between the native splash screen and the main app while Anchor
 * initializes (local database, session restore) or if that initialization
 * failed. Deliberately minimal — this should read as "Anchor is getting
 * ready", not as its own destination. Never shows technical error detail —
 * that's logged to the console (see useBootstrap), not surfaced here.
 */
export function BootstrapScreen({ status, onRetry }: BootstrapScreenProps) {
  const { colors, spacing, typography } = useTheme();

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
      <FadeInView style={{ alignItems: 'center' }}>
        <View style={{ marginBottom: spacing.lg }}>
          <BrandMark size="md" />
        </View>

        {status === 'loading' ? (
          <ActivityIndicator color={colors.accent} accessibilityLabel="Getting things ready" />
        ) : (
          <View style={{ alignItems: 'center', maxWidth: 320 }}>
            <Text
              style={[
                typography.headline,
                { color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.xs },
              ]}
            >
              Anchor couldn&apos;t finish setting things up
            </Text>
            <Text
              style={[
                typography.subhead,
                { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
              ]}
            >
              Something prevented the app from starting correctly.
            </Text>
            <Button label="Try Again" onPress={onRetry} accessibilityHint="Restarts Anchor's setup" />
          </View>
        )}
      </FadeInView>
    </View>
  );
}
