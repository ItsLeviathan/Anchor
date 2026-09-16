import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark, Button, IconBadge } from '../../components/ui';
import { useTheme } from '../../lib/theme/ThemeProvider';
import { FadeInView } from '../../components/ui/FadeInView';

const HIGHLIGHTS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'checkmark-circle-outline', label: 'Tasks' },
  { icon: 'calendar-outline', label: 'Calendar' },
  { icon: 'card-outline', label: 'Bills' },
  { icon: 'flame-outline', label: 'Habits' },
];

export default function WelcomeScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top + spacing.xl,
        paddingBottom: insets.bottom + spacing.xl,
        paddingHorizontal: spacing.xl,
      }}
    >
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <FadeInView style={{ alignItems: 'center' }}>
          <BrandMark size="lg" />
        </FadeInView>

        <FadeInView delay={80} style={{ alignItems: 'center', marginTop: spacing.lg }}>
          <Text
            style={[
              typography.largeTitle,
              { color: colors.textPrimary, fontSize: 36, letterSpacing: -1 },
            ]}
          >
            Anchor
          </Text>
          <Text
            style={[
              typography.headline,
              { color: colors.accent, marginTop: spacing.xs, textAlign: 'center' },
            ]}
          >
            Keep your life together.
          </Text>
        </FadeInView>

        <FadeInView
          delay={160}
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: spacing.sm,
            marginTop: spacing.xxl,
            maxWidth: 320,
          }}
        >
          {HIGHLIGHTS.map((item) => (
            <View
              key={item.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.full,
                paddingVertical: spacing.xs,
                paddingRight: spacing.md,
                paddingLeft: spacing.xs,
              }}
            >
              <IconBadge name={item.icon} size="sm" />
              <Text style={[typography.subhead, { color: colors.textPrimary }]}>{item.label}</Text>
            </View>
          ))}
        </FadeInView>
      </View>

      <FadeInView delay={240}>
        <Button
          label="Get started"
          onPress={() => router.replace('/(tabs)/today')}
          hint="Opens the app and creates an anonymous account"
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign in"
          accessibilityHint="Opens the sign in screen"
          onPress={() => router.push('/(onboarding)/sign-in')}
          style={({ pressed }) => [{ marginTop: spacing.lg, opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={[typography.subhead, { color: colors.textSecondary, textAlign: 'center' }]}>
            Already have an account? <Text style={{ color: colors.accent }}>Sign in</Text>
          </Text>
        </Pressable>

        <Text
          style={[
            typography.caption,
            { color: colors.textTertiary, textAlign: 'center', marginTop: spacing.md },
          ]}
        >
          No account required to start — your data is always yours.
        </Text>
      </FadeInView>
    </View>
  );
}
