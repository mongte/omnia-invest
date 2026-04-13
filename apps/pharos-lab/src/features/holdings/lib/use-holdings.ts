'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchHoldings,
  upsertHolding,
  deleteHolding,
  type UpsertHoldingPayload,
  type HoldingWithStock,
} from '@/shared/api/holdings';

export const HOLDINGS_QUERY_KEY = ['holdings'] as const;

export function useHoldings() {
  return useQuery({
    queryKey: HOLDINGS_QUERY_KEY,
    queryFn: fetchHoldings,
  });
}

export function useUpsertHolding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpsertHoldingPayload) => upsertHolding(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: HOLDINGS_QUERY_KEY });
    },
  });
}

export function useDeleteHolding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (holdingId: string) => deleteHolding(holdingId),
    onMutate: async (holdingId) => {
      await queryClient.cancelQueries({ queryKey: HOLDINGS_QUERY_KEY });
      const previous = queryClient.getQueryData<HoldingWithStock[]>(HOLDINGS_QUERY_KEY);
      queryClient.setQueryData<HoldingWithStock[]>(
        HOLDINGS_QUERY_KEY,
        (old) => old?.filter((h) => h.id !== holdingId) ?? [],
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(HOLDINGS_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: HOLDINGS_QUERY_KEY });
    },
  });
}
