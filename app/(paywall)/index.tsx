import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '../../components/ui';
import { usePurchases } from '../../lib/purchases/usePurchases';
import { useTheme } from '../../lib/theme/ThemeProvider';

const PRO_PERKS = [
  'Unlimited intelligent planning',
  'Advanced Brain Dump',
  'AI smart scheduling',
  'AI weekly reviews',
  'Advanced insights',
  'Expanded document storage',
  'Multiple calendars',
  'Advanced Student Mode',
];

export default function PaywallScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { offerings, isLoadingOfferings, isPurchasing, purchase, isRestoring, restore } =
    usePurchases();

  const monthly = offerings?.current?.monthly ?? null;
  const annual = offerings?.current?.annual ?? null;
  const isBusy = isPurchasing || isRestoring;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.lg,
        paddingHorizontal: spacing.lg,
        paddingBottom: insets.bottom + spacing.xxl,
      }}
    >
      {/* Dismiss */}
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={{ alignSelf: 'flex-end', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }}
        hitSlop={12}
      >
        <Text style={[typography.headline, { color: colors.textTertiary }]}>✕</Text>
      </Pressable>

      {/* Hero */}
      <Text
        style={[
          typography.title,
          { color: colors.textPrimary, textAlign: 'center', marginTop: spacing.md },
        ]}
      >
        Anchor Pro
      </Text>
      <Text
        style={[
          typography.subhead,
          {
            color: colors.textSecondary,
            textAlign: 'center',
            marginTop: spacing.xs,
            marginBottom: spacing.xl,
          },
        ]}
      >
        Let Anchor do more for you.
      </Text>

      {/* Perks */}
      <Card style={{ marginBottom: spacing.xl }}>
        {PRO_PERKS.map((perk) => (
          <View
            key={perk}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs }}
          >
            <Text style={{ color: colors.accent, marginRight: spacing.sm, fontSize: 15 }}>✓</Text>
            <Text style={[typography.body, { color: colors.textPrimary }]}>{perk}</Text>
          </View>
        ))}
      </Card>

      {/* Pricing */}
      {isLoadingOfferings ? (
        <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.lg }} />
      ) : (
        <>
          {annual ? (
            <Pressable
              onPress={() => purchase(annual)}
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel={`Subscribe annually — ${annual.product.priceString} per year`}
              style={({ pressed }) => ({
                backgroundColor: colors.accent,
                borderRadius: radius.lg,
                padding: spacing.md,
                marginBottom: spacing.sm,
                alignItems: 'center',
                opacity: pressed || isBusy ? 0.8 : 1,
              })}
            >
              <Text style={[typography.headline, { color: '#FFFFFF' }]}>
                {annual.product.priceString} / year
              </Text>
              <Text
                style={[typography.caption, { color: 'rgba(255,255,255,0.75)', marginTop: 2 }]}
              >
                Best value
              </Text>
            </Pressable>
          ) : null}

          {monthly ? (
            <Pressable
              onPress={() => purchase(monthly)}
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel={`Subscribe monthly — ${monthly.product.priceString} per month`}
              style={({ pressed }) => ({
                backgroundColor: colors.surfaceElevated,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.md,
                marginBottom: spacing.sm,
                alignItems: 'center',
                opacity: pressed || isBusy ? 0.7 : 1,
              })}
            >
              <Text style={[typography.headline, { color: colors.textPrimary }]}>
                {monthly.product.priceString} / month
              </Text>
            </Pressable>
          ) : null}

          {!annual && !monthly ? (
            <Card style={{ marginBottom: spacing.lg, alignItems: 'center' }}>
              <Text
                style={[typography.subhead, { color: colors.textTertiary, textAlign: 'center' }]}
              >
                Pricing is unavailable right now. Please try again later.
              </Text>
            </Card>
          ) : null}
        </>
      )}

      {/* Trial / legal */}
      <Text
        style={[
          typography.caption,
          {
            color: colors.textTertiary,
            textAlign: 'center',
            marginTop: spacing.sm,
            marginBottom: spacing.md,
            lineHeight: 18,
          },
        ]}
      >
        Start your 7-day free trial. No charge until the trial ends.{'\n'}
        Subscription renews automatically. Cancel anytime in your device settings.
      </Text>

      {/* Restore */}
      <Pressable
        onPress={restore}
        disabled={isBusy}
        accessibilityRole="button"
        accessibilityLabel="Restore purchases"
      >
        <Text
          style={[
            typography.caption,
            {
              color: isBusy ? colors.textTertiary : colors.accent,
              textAlign: 'center',
              textDecorationLine: 'underline',
            },
          ]}
        >
          {isRestoring ? 'Restoring…' : 'Restore purchases'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
