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
import { isAppleSignInAvailable, signInWithApple, signInWithGoogle } from '../../lib/auth/socialAuth';
import { supabase } from '../../lib/supabase/client';
import { toast } from '../../lib/toast/toast';
import { useTheme } from '../../lib/theme/ThemeProvider';

export default function SignInScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'apple' | 'google' | null>(null);

  async function handleSignIn() {
    if (!email.trim() || !password) {
      toast.error('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        toast.error(error.message);
      } else {
        router.replace('/(tabs)/today');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleAppleSignIn() {
    setSocialLoading('apple');
    try {
      await signInWithApple();
      router.replace('/(tabs)/today');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Apple sign-in failed.';
      toast.error(msg);
    } finally {
      setSocialLoading(null);
    }
  }

  async function handleGoogleSignIn() {
    setSocialLoading('google');
    try {
      await signInWithGoogle();
      router.replace('/(tabs)/today');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      toast.error(msg);
    } finally {
      setSocialLoading(null);
    }
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
          Welcome back
        </Text>
        <Text
          style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.xl }]}
        >
          Sign in to sync your Anchor data across devices.
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
              onSubmitEditing={handleSignIn}
              placeholder="••••••••"
            />
          </View>
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Button
            label="Sign in"
            loading={loading}
            onPress={handleSignIn}
            hint="Signs you in to your Anchor account"
          />
        </View>

        <View style={{ marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          <Text style={[typography.caption, { color: colors.textTertiary }]}>or</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        </View>

        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          {isAppleSignInAvailable() && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign in with Apple"
              onPress={handleAppleSignIn}
              disabled={socialLoading !== null}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                paddingVertical: spacing.sm + 2,
                gap: spacing.sm,
                opacity: socialLoading === 'apple' ? 0.6 : 1,
              }}
            >
              <Text style={[typography.subhead, { color: colors.textPrimary }]}>
                {socialLoading === 'apple' ? 'Signing in…' : ' Sign in with Apple'}
              </Text>
            </Pressable>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign in with Google"
            onPress={handleGoogleSignIn}
            disabled={socialLoading !== null}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              paddingVertical: spacing.sm + 2,
              gap: spacing.sm,
              opacity: socialLoading === 'google' ? 0.6 : 1,
            }}
          >
            <Text style={[typography.subhead, { color: colors.textPrimary }]}>
              {socialLoading === 'google' ? 'Signing in…' : 'G  Sign in with Google'}
            </Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create an account"
          onPress={() => router.replace('/(onboarding)/sign-up')}
          style={{ marginTop: spacing.lg, alignItems: 'center' }}
        >
          <Text style={[typography.subhead, { color: colors.textSecondary }]}>
            Don't have an account?{' '}
            <Text style={{ color: colors.accent }}>Sign up</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
