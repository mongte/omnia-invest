'use client';

import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/entities/user';
import { useLoginModalStore } from '@/entities/user';
import { fetchEquityCurve } from '@/shared/api/virtual-equity';

export const equityCurveQueryKey = (userId: string, days: number) =>
  ['equity-curve', userId, days] as const;

export function useEquityCurve(days = 30) {
  const { user } = useAuthStore();
  const { open: openLoginModal } = useLoginModalStore();

  return useQuery({
    queryKey: equityCurveQueryKey(user?.id ?? '', days),
    queryFn: () => {
      if (!user) return [];
      return fetchEquityCurve(user.id, days);
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
