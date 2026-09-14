import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from '../supabase/client';

WebBrowser.maybeCompleteAuthSession();

// Apple Sign-In — iOS only, native sheet. No deep link needed.
export async function signInWithApple() {
  // Lazy-load so the module is safe to import on Android (where it's absent).
  const AppleAuth = require('expo-apple-authentication');

  const available = await AppleAuth.isAvailableAsync();
  if (!available) throw new Error('Apple Sign-In is not available on this device.');

  const credential = await AppleAuth.signInAsync({
    requestedScopes: [
      AppleAuth.AppleAuthenticationScope.FULL_NAME,
      AppleAuth.AppleAuthenticationScope.EMAIL,
    ],
  });

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });

  if (error) throw error;
  return data;
}

// Google Sign-In — opens an in-app browser, redirects back via deep link.
// Requires EXPO_PUBLIC_SUPABASE_URL to be configured (already is).
// The Supabase project must have Google OAuth enabled and the redirect URI
// anchor://auth/callback listed as allowed.
export async function signInWithGoogle() {
  const redirectUri = makeRedirectUri({ scheme: 'anchor', path: 'auth/callback' });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUri,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error('No OAuth URL returned from Supabase.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

  if (result.type === 'success') {
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(result.url);
    if (sessionError) throw sessionError;
  }
  // result.type === 'cancel' or 'dismiss' — user cancelled, do nothing
}

// True on iOS devices that support Apple Sign-In (iOS 13+).
export function isAppleSignInAvailable(): boolean {
  return Platform.OS === 'ios';
}
