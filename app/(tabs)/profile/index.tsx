import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '../../../components/ui';
import { useRemainingAiActions } from '../../../features/ai/useAiUsage';
import { useSetStudentMode, useStudentMode } from '../../../features/studentMode/useStudentMode';
import { cacheProfile, getCachedProfile, type CachedProfile } from '../../../lib/database/db';
import { useEntitlements } from '../../../lib/entitlements/useEntitlements';
import { arePersonalizedSuggestionsEnabled, setPersonalizedSuggestionsEnabled } from '../../../lib/insights/preferences';
import { areRemindersEnabled, setRemindersEnabled } from '../../../lib/notifications/preferences';
import { useSession } from '../../../lib/supabase/useSession';
import { useTheme } from '../../../lib/theme/ThemeProvider';

export default function ProfileScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { session, isLoading: isSessionLoading } = useSession();
  const { entitlements, isLoading: isEntitlementsLoading } = useEntitlements(session?.user.id);
  const { remaining, limit: aiLimit, used: aiUsed, isLoading: isAiUsageLoading } = useRemainingAiActions(session?.user.id);
  const { data: studentModeOn = false, isLoading: isStudentModeLoading } = useStudentMode(session?.user.id);
  const setStudentMode = useSetStudentMode(session?.user.id);
  const [cached, setCached] = useState<CachedProfile | null>(null);
  const [remindersOn, setRemindersOn] = useState(true);
  const [personalizedSuggestionsOn, setPersonalizedSuggestionsOn] = useState(true);

  useEffect(() => {
    areRemindersEnabled()
      .then(setRemindersOn)
      .catch((err) => console.error('Failed to load reminder preference', err));
    arePersonalizedSuggestionsEnabled()
      .then(setPersonalizedSuggestionsOn)
      .catch((err) => console.error('Failed to load personalization preference', err));
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

  async function handleTogglePersonalizedSuggestions(value: boolean) {
    setPersonalizedSuggestionsOn(value);
    try {
      await setPersonalizedSuggestionsEnabled(value);
    } catch (err) {
      console.error('Failed to save personalization preference', err);
      setPersonalizedSuggestionsOn(!value);
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

  const isLoading = isSessionLoading || isEntitlementsLoading || isStudentModeLoading || isAiUsageLoading;

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

            {session?.user.is_anonymous ? (
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Create account"
                  accessibilityHint="Opens the sign up screen to save and sync your data"
                  onPress={() => router.push('/(onboarding)/sign-up')}
                  style={({ pressed }) => ({
                    flex: 1,
                    alignItems: 'center',
                    backgroundColor: colors.accent,
                    borderRadius: radius.sm,
                    paddingVertical: spacing.sm,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={[typography.subhead, { color: '#FFFFFF', fontWeight: '600' }]}>
                    Create account
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Sign in"
                  accessibilityHint="Opens the sign in screen"
                  onPress={() => router.push('/(onboarding)/sign-in')}
                  style={({ pressed }) => ({
                    flex: 1,
                    alignItems: 'center',
                    backgroundColor: colors.surfaceElevated,
                    borderRadius: radius.sm,
                    paddingVertical: spacing.sm,
                    borderWidth: 1,
                    borderColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={[typography.subhead, { color: colors.textPrimary, fontWeight: '600' }]}>
                    Sign in
                  </Text>
                </Pressable>
              </View>
            ) : null}
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

            {/* AI usage */}
            <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.xs }]}>
              {aiUsed} of {aiLimit} AI actions used this month
            </Text>
            {!entitlements.isPro && remaining <= 3 && remaining > 0 ? (
              <Text style={[typography.caption, { color: colors.danger, marginTop: 2 }]}>
                {remaining} {remaining === 1 ? 'action' : 'actions'} left
              </Text>
            ) : null}
            {!entitlements.isPro && remaining === 0 ? (
              <Text style={[typography.caption, { color: colors.danger, marginTop: 2 }]}>
                You've used all your AI actions for this month.
              </Text>
            ) : null}

            {/* Upgrade / manage */}
            {entitlements.isPro ? (
              <Text style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.sm }]}>
                To manage or cancel your subscription, go to your device's subscription settings.
              </Text>
            ) : (
              <Pressable
                onPress={() => router.push('/(paywall)')}
                accessibilityRole="button"
                accessibilityLabel="Upgrade to Anchor Pro"
                style={({ pressed }) => ({
                  marginTop: spacing.md,
                  backgroundColor: colors.accent,
                  borderRadius: radius.sm,
                  paddingVertical: spacing.sm,
                  alignItems: 'center',
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={[typography.subhead, { color: '#FFFFFF', fontWeight: '600' }]}>
                  Upgrade to Anchor Pro
                </Text>
              </Pressable>
            )}
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

          <Card style={{ marginTop: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: spacing.md }}>
                <Text style={[typography.headline, { color: colors.textPrimary }]}>Personalized suggestions</Text>
                <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
                  Free-time suggestions based on your schedule and task estimates
                </Text>
              </View>
              <Switch
                value={personalizedSuggestionsOn}
                onValueChange={handleTogglePersonalizedSuggestions}
                trackColor={{ true: colors.accent, false: colors.border }}
              />
            </View>
          </Card>

          <Card style={{ marginTop: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: spacing.md }}>
                <Text style={[typography.headline, { color: colors.textPrimary }]}>Student Mode</Text>
                <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
                  Track subjects, assignments, and exams on the Life tab
                </Text>
              </View>
              <Switch
                value={studentModeOn}
                onValueChange={(value) => setStudentMode.mutate(value)}
                trackColor={{ true: colors.accent, false: colors.border }}
              />
            </View>
          </Card>
        </>
      )}
    </ScrollView>
  );
}
