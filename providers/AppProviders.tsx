import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { queryClient } from '../lib/query/queryClient';
import { ThemeProvider } from '../lib/theme/ThemeProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
