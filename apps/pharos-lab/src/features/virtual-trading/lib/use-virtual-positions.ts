'use client';

import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/entities/user';
import { useLoginModalStore } from '@/entities/user';
import { fetchVirtualPositions } from '@/shared/api/virtual-positions';

export const virtualPositionsQueryKey = (userId: string) =>
  ['virtual-positions', userId] as const;

export function useVirtualPositions() {
  const { user } = useAuthStore();
  const { open: openLoginModal } = useLoginModalStore();

  return useQuery({
    queryKey: virtualPositionsQueryKey(user?.id ?? ''),
    queryFn: () => {
      if (!user) return [];
      return fetchVirtualPositions(user.id);
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
