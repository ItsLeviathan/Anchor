import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { View } from 'react-native';

import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { ToastContainer } from '../components/ui/Toast';
import { queryClient } from '../lib/query/queryClient';
import { ThemeProvider } from '../lib/theme/ThemeProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <View style={{ flex: 1 }}>
            {children}
            <ToastContainer />
          </View>
        </ErrorBoundary>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
