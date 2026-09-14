import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initDatabase } from '../lib/database/db';
import '../lib/notifications/setup';
import { getOnboardingComplete, setOnboardingComplete } from '../lib/onboarding/onboarding';
import { useSession } from '../lib/supabase/useSession';
import { useSyncLifecycle } from '../lib/sync/useSyncLifecycle';
import { AppProviders } from '../providers/AppProviders';

export default function RootLayout() {
  const [isDbReady, setIsDbReady] = useState(false);
  const { session, isLoading: isSessionLoading } = useSession();

  useEffect(() => {
    initDatabase()
      .then(() => setIsDbReady(true))
      .catch((err) => console.error('Failed to initialize local database', err));
  }, []);

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

  useSyncLifecycle(isDbReady ? session?.user.id : undefined);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProviders>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(onboarding)" options={{ animation: 'fade' }} />
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
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
