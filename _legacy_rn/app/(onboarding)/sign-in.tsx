import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Input } from '../../components/ui';
import { isAppleSignInAvailable, signInWithApple, signInWithGoogle } from '../../lib/auth/socialAuth';
import { supabase } from '../../lib/supabase/client';
import { toast } from '../../lib/toast/toast';
import { useTheme } from '../../lib/theme/ThemeProvider';

interface SocialButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
}

function SocialButton({ icon, label, onPress, loading, disabled }: SocialButtonProps) {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy: loading }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          paddingVertical: spacing.sm + 6,
          gap: spacing.sm,
          opacity: pressed ? 0.85 : disabled && !loading ? 0.5 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.textPrimary} />
      ) : (
        <>
          <Ionicons name={icon} size={18} color={colors.textPrimary} />
          <Text style={[typography.subhead, { color: colors.textPrimary }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export default function SignInScreen() {
  const { colors, spacing, typography } = useTheme();
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
            <SocialButton
              icon="logo-apple"
              label="Sign in with Apple"
              onPress={handleAppleSignIn}
              loading={socialLoading === 'apple'}
              disabled={socialLoading !== null}
            />
          )}

          <SocialButton
            icon="logo-google"
            label="Sign in with Google"
            onPress={handleGoogleSignIn}
            loading={socialLoading === 'google'}
            disabled={socialLoading !== null}
          />
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
