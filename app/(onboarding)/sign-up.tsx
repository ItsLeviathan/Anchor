import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components/ui';
import { Input } from '../../components/ui';
import { toast } from '../../lib/toast/toast';
import { supabase } from '../../lib/supabase/client';
import { useTheme } from '../../lib/theme/ThemeProvider';

export default function SignUpScreen() {
  const { colors, spacing, typography } = useTheme();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSignUp() {
    if (!email.trim()) {
      toast.error('Please enter your email address.');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      // If the user is currently signed in anonymously, upgrade them in-place
      // using updateUser — this keeps their existing user ID so all their
      // locally-created data (tasks, notes, etc.) is automatically preserved.
      // A regular signUp would create a NEW user ID and leave orphaned data.
      const { data: sessionData } = await supabase.auth.getSession();
      const isAnonymous = sessionData.session?.user.is_anonymous ?? false;

      const { error } = isAnonymous
        ? await supabase.auth.updateUser({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password });

      if (error) {
        toast.error(error.message);
      } else {
        setSent(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign up failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
        }}
      >
        <Text
          style={[
            typography.title,
            { color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.md },
          ]}
        >
          Check your email
        </Text>
        <Text
          style={[
            typography.body,
            {
              color: colors.textSecondary,
              textAlign: 'center',
              lineHeight: 24,
              marginBottom: spacing.xl,
            },
          ]}
        >
          We sent a confirmation link to {email.trim()}. Open it to activate your account, then come back to sign in.
        </Text>
        <View style={{ width: '100%' }}>
          <Button
            label="Go to sign in"
            onPress={() => router.replace('/(onboarding)/sign-in')}
            hint="Returns to the sign in screen"
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue without signing in"
          onPress={() => router.replace('/(tabs)/today')}
          style={{ marginTop: spacing.lg }}
        >
          <Text style={[typography.subhead, { color: colors.textTertiary }]}>
            Continue without signing in
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + spacing.xl,
          paddingHorizontal: spacing.xl,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={{ marginBottom: spacing.lg }}
          hitSlop={12}
        >
          <Text style={[typography.body, { color: colors.accent }]}>← Back</Text>
        </Pressable>

        <Text style={[typography.title, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
          Create account
        </Text>
        <Text
          style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.xl }]}
        >
          Save your data and sync it across all your devices.
        </Text>

        <View style={{ gap: spacing.md }}>
          <View>
            <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.xs }]}>
              Email
            </Text>
            <Input
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              placeholder="you@example.com"
            />
          </View>
          <View>
            <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.xs }]}>
              Password
            </Text>
            <Input
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
              placeholder="At least 8 characters"
            />
          </View>
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Button
            label="Create account"
            loading={loading}
            onPress={handleSignUp}
            hint="Creates your Anchor account and sends a confirmation email"
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign in instead"
          onPress={() => router.replace('/(onboarding)/sign-in')}
          style={{ marginTop: spacing.lg, alignItems: 'center' }}
        >
          <Text style={[typography.subhead, { color: colors.textSecondary }]}>
            Already have an account?{' '}
            <Text style={{ color: colors.accent }}>Sign in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
