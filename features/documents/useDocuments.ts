import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { cancelDocumentExpirationReminder, scheduleDocumentExpirationReminder } from '../../lib/notifications/scheduler';
import type { AnchorDocument } from '../../types';
import { createDocument, deleteDocument, fetchDocuments } from './api';

const DOCUMENTS_KEY = ['documents'] as const;

export function useDocuments(userId: string | undefined) {
  return useQuery({
    queryKey: [...DOCUMENTS_KEY, userId],
    queryFn: () => fetchDocuments(userId as string),
    enabled: Boolean(userId),
  });
}

export function useCreateDocument(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDocument,
    onSuccess: (createdDocument) => {
      queryClient.invalidateQueries({ queryKey: [...DOCUMENTS_KEY, userId] });
      scheduleDocumentExpirationReminder(createdDocument).catch((err) =>
        console.error('Failed to schedule document expiration reminder', err)
      );
    },
  });
}

export function useDeleteDocument(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (document: AnchorDocument) => {
      await cancelDocumentExpirationReminder(document.id);
      await deleteDocument(document);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...DOCUMENTS_KEY, userId] }),
  });
}
