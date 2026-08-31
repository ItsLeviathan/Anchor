import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createSubject, deleteSubject, fetchSubjects } from './api';

const SUBJECTS_KEY = ['subjects'] as const;

export function useSubjects(userId: string | undefined) {
  return useQuery({
    queryKey: [...SUBJECTS_KEY, userId],
    queryFn: () => fetchSubjects(userId as string),
    enabled: Boolean(userId),
  });
}

export function useCreateSubject(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSubject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...SUBJECTS_KEY, userId] }),
  });
}

export function useDeleteSubject(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...SUBJECTS_KEY, userId] }),
  });
}
