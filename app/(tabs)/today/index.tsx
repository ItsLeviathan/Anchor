import React from 'react';
import { ActivityIndicator, ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '../../../components/ui';
import { useTheme } from '../../../lib/theme/ThemeProvider';
import { useSession } from '../../../lib/supabase/useSession';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function TodayScreen() {
  const { colors, spacing, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const { isLoading } = useSession();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.lg }}
    >
      <Text style={[typography.largeTitle, { color: colors.textPrimary }]}>{getGreeting()}</Text>
      <Text
        style={[
          typography.subhead,
          { color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xl },
        ]}
      >
        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      </Text>

      {isLoading ? (
        <ActivityIndicator color={colors.accent} />
      ) : (
        // Tasks, events, and bills arrive in Phase 2, so Today has nothing
        // to prioritize yet — this is the real empty state, not a stub.
        <EmptyState message="Nothing demanding your attention yet." />
      )}
    </ScrollView>
  );
}
