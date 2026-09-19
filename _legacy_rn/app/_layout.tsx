import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BootstrapScreen } from '../components/bootstrap/BootstrapScreen';
import { LockScreen } from '../components/security/LockScreen';
import { useBootstrap } from '../lib/bootstrap/useBootstrap';
import '../lib/notifications/setup';
import { getOnboardingComplete, setOnboardingComplete } from '../lib/onboarding/onboarding';
import { useAppLock } from '../lib/security/useAppLock';
import { useSession } from '../lib/supabase/useSession';
import { useSyncLifecycle } from '../lib/sync/useSyncLifecycle';
import { AppProviders } from '../providers/AppProviders';

// Keep the native splash up until bootstrap explicitly hides it below —
// otherwise Expo hides it as soon as the first frame renders, which for a
// startup-gated app would be the loading screen itself, not the real app.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Safe to ignore: this only fails if the splash module isn't available in
  // the current runtime (e.g. Expo Go on an unsupported platform), in which
  // case there's nothing to keep hidden anyway.
});

// Cross-fade the native splash into the bootstrap screen instead of a hard
// cut — both use the same BrandMark, so this reads as one continuous
// moment rather than a flash between two unrelated screens.
SplashScreen.setOptions({ duration: 400, fade: true });

function AppContent() {
  const { isLocked, unlock, isAuthenticating, lastError } = useAppLock();

  // The lock screen below is a JS-level overlay sibling to the Stack, not a
  // navigation-level guard — a natively-presented modal screen (task-new,
  // add-sheet, etc.) could otherwise render above it instead of being
  // covered by it. Dismissing any open modal the moment the app locks
  // closes that gap.
  useEffect(() => {
    if (!isLocked) return;
    try {
      router.dismissAll();
    } catch {
      // Nothing presented to dismiss — fine.
    }
  }, [isLocked]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(onboarding)" options={{ animation: 'fade' }} />
        <Stack.Screen name="search" options={{ presentation: 'modal' }} />
        <Stack.Screen name="add-sheet" options={{ presentation: 'modal' }} />
        <Stack.Screen name="task-new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="event-new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="brain-dump" options={{ presentation: 'modal' }} />
        <Stack.Screen name="expense-new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="bill-new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="note-new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="habit-new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="shopping-item-new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="document-new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="subject-new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="assignment-new" options={{ presentation: 'modal' }} />
      </Stack>
      {isLocked ? (
        <View style={StyleSheet.absoluteFill}>
          <LockScreen onUnlock={unlock} isAuthenticating={isAuthenticating} error={lastError} />
        </View>
      ) : null}
    </View>
  );
}

// Owns everything that depends on a restored session: the once-per-install
// onboarding redirect and the sync lifecycle. Only mounted once bootstrap
// has resolved, so `useSession()` here already has its final value on its
// very first render — no "unauthenticated flashes, then authenticated"
// flicker.
function BootstrappedApp() {
  const { session, isLoading: isSessionLoading } = useSession();

  useEffect(() => {
    if (isSessionLoading) return;

    async function checkOnboarding() {
      const done = await getOnboardingComplete();
      if (!done) {
        await setOnboardingComplete();
        router.replace('/(onboarding)/welcome');
      }
    }

    checkOnboarding().catch((err) => console.error('Onboarding check failed', err));
  }, [isSessionLoading]);

  useSyncLifecycle(session?.user.id);

  return <AppContent />;
}

export default function RootLayout() {
  const { status, retry } = useBootstrap();

  // Hide the native splash once we have *something* to show in its place —
  // the bootstrap loading screen itself (a deliberate, branded state) or
  // the recovery screen — never leave the native splash up indefinitely.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProviders>
          {status === 'ready' ? (
            <BootstrappedApp />
          ) : (
            <BootstrapScreen status={status === 'error' ? 'error' : 'loading'} onRetry={retry} />
          )}
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
