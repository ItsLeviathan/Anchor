import { useQuery } from '@tanstack/react-query';

import { fetchCategories } from './api';

export function useCategories(userId: string | undefined) {
  return useQuery({
    queryKey: ['categories', userId],
    queryFn: fetchCategories,
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });
}
