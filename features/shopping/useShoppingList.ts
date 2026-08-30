import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ShoppingList } from '../../types';
import { addShoppingItem, clearCompletedItems, fetchDefaultShoppingList, removeShoppingItem, toggleShoppingItem } from './api';

const SHOPPING_KEY = ['shopping_list'] as const;

export function useShoppingList(userId: string | undefined) {
  return useQuery({
    queryKey: [...SHOPPING_KEY, userId],
    queryFn: () => fetchDefaultShoppingList(userId as string),
    enabled: Boolean(userId),
  });
}

export function useAddShoppingItem(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ list, name, quantity }: { list: ShoppingList; name: string; quantity?: string | null }) =>
      addShoppingItem(list, name, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...SHOPPING_KEY, userId] }),
  });
}

export function useToggleShoppingItem(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ list, itemId }: { list: ShoppingList; itemId: string }) => toggleShoppingItem(list, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...SHOPPING_KEY, userId] }),
  });
}

export function useRemoveShoppingItem(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ list, itemId }: { list: ShoppingList; itemId: string }) => removeShoppingItem(list, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...SHOPPING_KEY, userId] }),
  });
}

export function useClearCompletedItems(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (list: ShoppingList) => clearCompletedItems(list),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...SHOPPING_KEY, userId] }),
  });
}
