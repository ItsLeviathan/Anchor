import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createNote, deleteNote, fetchNotes, toggleNotePinned } from './api';

const NOTES_KEY = ['notes'] as const;

export function useNotes(userId: string | undefined) {
  return useQuery({
    queryKey: [...NOTES_KEY, userId],
    queryFn: () => fetchNotes(userId as string),
    enabled: Boolean(userId),
  });
}

export function useCreateNote(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createNote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...NOTES_KEY, userId] }),
  });
}

export function useToggleNotePinned(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleNotePinned,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...NOTES_KEY, userId] }),
  });
}

export function useDeleteNote(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...NOTES_KEY, userId] }),
  });
}
