import { MutationCache, QueryClient } from '@tanstack/react-query';

import { toast } from '../toast/toast';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30,
    },
  },
  mutationCache: new MutationCache({
    onError(error) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      toast.error(message);
    },
  }),
});
