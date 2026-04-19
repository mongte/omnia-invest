'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/entities/user';
import { useLoginModalStore } from '@/entities/user';
import { fetchVirtualPortfolio, resetVirtualPortfolio } from '@/shared/api/virtual-portfolio';

export const virtualPortfolioQueryKey = (userId: string) =>
  ['virtual-portfolio', userId] as const;

export function useVirtualPortfolio() {
  const { user } = useAuthStore();
  const { open: openLoginModal } = useLoginModalStore();

  return useQuery({
    queryKey: virtualPortfolioQueryKey(user?.id ?? ''),
    queryFn: () => {
      if (!user) return null;
      return fetchVirtualPortfolio(user.id);
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

export function useResetPortfolio() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!user) throw new Error('로그인이 필요합니다.');
      return resetVirtualPortfolio(user.id);
    },
    onSuccess: () => {
      if (!user) return;
      toast.success('포트폴리오가 초기화되었습니다.');
      void queryClient.invalidateQueries({ queryKey: virtualPortfolioQueryKey(user.id) });
      void queryClient.invalidateQueries({ queryKey: ['virtual-positions', user.id] });
      void queryClient.invalidateQueries({ queryKey: ['virtual-orders', user.id] });
      void queryClient.invalidateQueries({ queryKey: ['auto-trade-rules', user.id] });
      void queryClient.invalidateQueries({ queryKey: ['equity-curve', user.id] });
    },
    onError: (error: unknown) => {
      if (error instanceof Error) toast.error(error.message);
    },
  });
}
