import { useQuery } from '@tanstack/react-query';

import { fetchCalendars } from './api';

export function useCalendars(userId: string | undefined) {
  return useQuery({
    queryKey: ['calendars', userId],
    queryFn: fetchCalendars,
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });
}
