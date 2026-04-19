'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/entities/user';
import { useLoginModalStore } from '@/entities/user';
import {
  fetchVirtualOrders,
  placeVirtualOrder,
  type PlaceOrderParams,
} from '@/shared/api/virtual-orders';

export const virtualOrdersQueryKey = (userId: string) =>
  ['virtual-orders', userId] as const;

export function useVirtualOrders() {
  const { user } = useAuthStore();
  const { open: openLoginModal } = useLoginModalStore();

  return useQuery({
    queryKey: virtualOrdersQueryKey(user?.id ?? ''),
    queryFn: () => {
      if (!user) return [];
      return fetchVirtualOrders(user.id);
    },
    enabled: !!user,
    meta: {
      onError: (error: unknown) => {
        if (error instanceof Error) toast.error(error.message);
        if (!user) openLoginModal();
      },
    },
  });
}

export function usePlaceOrder() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: Omit<PlaceOrderParams, 'userId'>) => {
      if (!user) throw new Error('로그인이 필요합니다.');
      return placeVirtualOrder({ ...params, userId: user.id });
    },
    onSuccess: () => {
      if (!user) return;
      toast.success('주문이 체결되었습니다.');
      void queryClient.invalidateQueries({ queryKey: ['virtual-portfolio', user.id] });
      void queryClient.invalidateQueries({ queryKey: ['virtual-positions', user.id] });
      void queryClient.invalidateQueries({ queryKey: virtualOrdersQueryKey(user.id) });
      void queryClient.invalidateQueries({ queryKey: ['equity-curve', user.id] });
    },
    onError: (error: unknown) => {
      if (error instanceof Error) toast.error(error.message);
    },
  });
}
