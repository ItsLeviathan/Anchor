import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '../../../components/ui';
import { cacheProfile, getCachedProfile, type CachedProfile } from '../../../lib/database/db';
import { useEntitlements } from '../../../lib/entitlements/useEntitlements';
import { areRemindersEnabled, setRemindersEnabled } from '../../../lib/notifications/preferences';
import { useSession } from '../../../lib/supabase/useSession';
import { useTheme } from '../../../lib/theme/ThemeProvider';

export default function ProfileScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { session, isLoading: isSessionLoading } = useSession();
  const { entitlements, isLoading: isEntitlementsLoading } = useEntitlements(session?.user.id);
  const [cached, setCached] = useState<CachedProfile | null>(null);
  const [remindersOn, setRemindersOn] = useState(true);

  useEffect(() => {
    areRemindersEnabled()
      .then(setRemindersOn)
      .catch((err) => console.error('Failed to load reminder preference', err));
  }, []);

  async function handleToggleReminders(value: boolean) {
    setRemindersOn(value); // optimistic - this is a local, instant preference
    try {
      await setRemindersEnabled(value);
    } catch (err) {
      console.error('Failed to save reminder preference', err);
      setRemindersOn(!value);
    }
  }

  useEffect(() => {
    if (!session) return;

    const isAnonymous = session.user.is_anonymous ?? true;

    // Write-then-read against the local database to prove the local-first
    // pattern end to end: this works identically offline. Syncing this
    // cache with the server `profiles` row is Phase 3 scope.
    cacheProfile({ id: session.user.id, displayName: null, isAnonymous })
      .then(() => getCachedProfile(session.user.id))
      .then(setCached)
      .catch((err) => console.error('Local profile cache failed', err));
  }, [session]);

  const isLoading = isSessionLoading || isEntitlementsLoading;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.lg }}
    >
      <Text style={[typography.title, { color: colors.textPrimary, marginBottom: spacing.lg }]}>Profile</Text>

      {isLoading ? (
        <ActivityIndicator color={colors.accent} />
      ) : (
        <>
          <Card style={{ marginBottom: spacing.md }}>
            <Text style={[typography.headline, { color: colors.textPrimary }]}>
              {session?.user.is_anonymous ? 'Signed in anonymously' : 'Signed in'}
            </Text>
            <Text style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.xs }]}>
              User ID: {session?.user.id.slice(0, 8)}…
            </Text>
            <Text style={[typography.caption, { color: cached ? colors.success : colors.textTertiary, marginTop: spacing.xs }]}>
              {cached ? 'Cached locally — available offline' : 'Caching locally…'}
            </Text>
          </Card>

          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[typography.headline, { color: colors.textPrimary }]}>
                {entitlements.isPro ? 'Anchor Pro' : 'Anchor Free'}
              </Text>
              <View
                style={{
                  backgroundColor: colors.accentMuted,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: 2,
                  borderRadius: radius.full,
                }}
              >
                <Text style={[typography.caption, { color: colors.accent }]}>
                  {entitlements.isPro ? 'Pro' : 'Free'}
                </Text>
              </View>
            </View>
            <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.xs }]}>
              {entitlements.aiMonthlyLimit} AI actions per month
            </Text>
          </Card>

          <Card style={{ marginTop: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: spacing.md }}>
                <Text style={[typography.headline, { color: colors.textPrimary }]}>Task & event reminders</Text>
                <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
                  Notify me when something is due or about to start
                </Text>
              </View>
              <Switch
                value={remindersOn}
                onValueChange={handleToggleReminders}
                trackColor={{ true: colors.accent, false: colors.border }}
              />
            </View>
          </Card>
        </>
      )}
    </ScrollView>
  );
}
