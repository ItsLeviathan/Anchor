import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { cancelEventReminder, scheduleEventReminder } from '../../lib/notifications/scheduler';
import { createEvent, deleteEvent, fetchEvents } from './api';

const EVENTS_KEY = ['events'] as const;

export function useEvents(userId: string | undefined) {
  return useQuery({
    queryKey: [...EVENTS_KEY, userId],
    queryFn: () => fetchEvents(userId as string),
    enabled: Boolean(userId),
  });
}

export function useCreateEvent(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEvent,
    onSuccess: (createdEvent) => {
      queryClient.invalidateQueries({ queryKey: [...EVENTS_KEY, userId] });
      scheduleEventReminder(createdEvent).catch((err) => console.error('Failed to schedule event reminder', err));
    },
  });
}

export function useDeleteEvent(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await cancelEventReminder(id);
      await deleteEvent(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...EVENTS_KEY, userId] });
    },
  });
}
