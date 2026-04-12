'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, useLoginModalStore } from '@/entities/user';
import {
  fetchFavoriteStockIds,
  addFavorite,
  removeFavorite,
} from '@/shared/api/favorites';

const FAVORITES_QUERY_KEY = ['favorites'] as const;

interface UseFavoritesReturn {
  favoriteIds: Set<string>;
  isFavorite: (stockId: string) => boolean;
  toggleFavorite: (stockId: string) => void;
  isLoading: boolean;
}

export function useFavorites(): UseFavoritesReturn {
  const { user } = useAuthStore();
  const { open: openLoginModal } = useLoginModalStore();
  const queryClient = useQueryClient();

  const { data: favoriteIds = new Set<string>(), isLoading } = useQuery({
    queryKey: FAVORITES_QUERY_KEY,
    queryFn: async () => {
      const ids = await fetchFavoriteStockIds();
      return new Set(ids);
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: addFavorite,
    onMutate: async (stockId: string) => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_QUERY_KEY });
      const previous = queryClient.getQueryData<Set<string>>(FAVORITES_QUERY_KEY);
      queryClient.setQueryData<Set<string>>(FAVORITES_QUERY_KEY, (old) => {
        const next = new Set(old ?? []);
        next.add(stockId);
        return next;
      });
      return { previous };
    },
    onError: (_err, _stockId, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(FAVORITES_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY });
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeFavorite,
    onMutate: async (stockId: string) => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_QUERY_KEY });
      const previous = queryClient.getQueryData<Set<string>>(FAVORITES_QUERY_KEY);
      queryClient.setQueryData<Set<string>>(FAVORITES_QUERY_KEY, (old) => {
        const next = new Set(old ?? []);
        next.delete(stockId);
        return next;
      });
      return { previous };
    },
    onError: (_err, _stockId, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(FAVORITES_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY });
    },
  });

  function isFavorite(stockId: string): boolean {
    return favoriteIds.has(stockId);
  }

  function toggleFavorite(stockId: string): void {
    if (!user) {
      openLoginModal();
      return;
    }
    if (isFavorite(stockId)) {
      removeMutation.mutate(stockId);
    } else {
      addMutation.mutate(stockId);
    }
  }

  return {
    favoriteIds,
    isFavorite,
    toggleFavorite,
    isLoading: isLoading && !!user,
  };
}
