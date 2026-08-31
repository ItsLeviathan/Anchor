import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Assignment } from '../../types';
import { createAssignment, deleteAssignment, fetchAssignments, setAssignmentStatus } from './api';

const ASSIGNMENTS_KEY = ['assignments'] as const;

export function useAssignments(userId: string | undefined) {
  return useQuery({
    queryKey: [...ASSIGNMENTS_KEY, userId],
    queryFn: () => fetchAssignments(userId as string),
    enabled: Boolean(userId),
  });
}

export function useCreateAssignment(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAssignment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...ASSIGNMENTS_KEY, userId] }),
  });
}

export function useToggleAssignmentStatus(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignment: Assignment) =>
      setAssignmentStatus(assignment, assignment.status === 'completed' ? 'pending' : 'completed'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...ASSIGNMENTS_KEY, userId] }),
  });
}

export function useDeleteAssignment(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAssignment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...ASSIGNMENTS_KEY, userId] }),
  });
}
