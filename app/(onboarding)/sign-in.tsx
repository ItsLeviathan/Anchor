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
import { useTheme } from '../../lib/theme/ThemeProvider';
import { supabase } from '../../lib/supabase/client';

export default function SignInScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
        router.replace('/(tabs)/today/index');
      }
    } finally {
      setLoading(false);
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
