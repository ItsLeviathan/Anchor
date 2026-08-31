import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initDatabase } from '../lib/database/db';
import '../lib/notifications/setup';
import { useSession } from '../lib/supabase/useSession';
import { useSyncLifecycle } from '../lib/sync/useSyncLifecycle';
import { AppProviders } from '../providers/AppProviders';

export default function RootLayout() {
  const [isDbReady, setIsDbReady] = useState(false);
  const { session } = useSession();

  useEffect(() => {
    initDatabase()
      .then(() => setIsDbReady(true))
      .catch((err) => console.error('Failed to initialize local database', err));
  }, []);

  // Don't touch local_tasks/local_events/etc. before initDatabase has
  // actually created them - passing undefined here keeps the lifecycle
  // hook a no-op until then.
  useSyncLifecycle(isDbReady ? session?.user.id : undefined);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProviders>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
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
