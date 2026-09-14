import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../lib/theme/ThemeProvider';

export default function WelcomeScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + spacing.xxl,
          paddingBottom: insets.bottom + spacing.xl,
          paddingHorizontal: spacing.xl,
        },
      ]}
    >
      <View style={styles.hero}>
        <Text
          style={[
            typography.largeTitle,
            { color: colors.textPrimary, fontSize: 42, letterSpacing: -1 },
          ]}
        >
          Anchor
        </Text>
        <Text
          style={[
            typography.headline,
            { color: colors.accent, marginTop: spacing.xs },
          ]}
        >
          Keep your life together.
        </Text>
        <Text
          style={[
            typography.body,
            {
              color: colors.textSecondary,
              marginTop: spacing.lg,
              lineHeight: 24,
            },
          ]}
        >
          Your tasks, calendar, bills, habits, documents, and notes — all in one calm place.
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Get started"
          accessibilityHint="Opens the app and creates an anonymous account"
          style={({ pressed }) => [
            styles.primaryBtn,
            {
              backgroundColor: colors.accent,
              borderRadius: radius.md,
              paddingVertical: spacing.md + 2,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={() => router.replace('/(tabs)/today/index')}
        >
          <Text style={[typography.headline, { color: '#FFFFFF', textAlign: 'center' }]}>
            Get started
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign in"
          accessibilityHint="Opens the sign in screen"
          style={({ pressed }) => [
            styles.secondaryBtn,
            {
              borderRadius: radius.md,
              paddingVertical: spacing.md + 2,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          onPress={() => router.push('/(onboarding)/sign-in')}
        >
          <Text
            style={[typography.headline, { color: colors.textSecondary, textAlign: 'center' }]}
          >
            I already have an account
          </Text>
        </Pressable>
      </View>

      <Text
        style={[
          typography.caption,
          {
            color: colors.textTertiary,
            textAlign: 'center',
            marginTop: spacing.lg,
            lineHeight: 18,
          },
        ]}
      >
        No account required to start. Your data is always yours.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { flex: 1, justifyContent: 'center' },
  actions: { gap: 12 },
  primaryBtn: { alignItems: 'center' },
  secondaryBtn: { alignItems: 'center' },
});
