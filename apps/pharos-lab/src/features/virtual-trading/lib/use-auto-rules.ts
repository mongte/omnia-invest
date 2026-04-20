'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/entities/user';
import { useLoginModalStore } from '@/entities/user';
import {
  fetchAutoRules,
  createAutoRule,
  cancelAutoRule,
  type CreateRuleParams,
} from '@/shared/api/auto-trade-rules';

export const autoRulesQueryKey = (userId: string) =>
  ['auto-trade-rules', userId] as const;

export function useAutoRules() {
  const { user } = useAuthStore();
  const { open: openLoginModal } = useLoginModalStore();

  return useQuery({
    queryKey: autoRulesQueryKey(user?.id ?? ''),
    queryFn: () => {
      if (!user) return [];
      return fetchAutoRules(user.id);
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

export function useCreateRule() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: Omit<CreateRuleParams, 'userId'>) => {
      if (!user) throw new Error('로그인이 필요합니다.');
      return createAutoRule({ ...params, userId: user.id });
    },
    onSuccess: () => {
      if (!user) return;
      toast.success('자동매매 규칙이 등록되었습니다.');
      void queryClient.invalidateQueries({ queryKey: autoRulesQueryKey(user.id) });
    },
    onError: (error: unknown) => {
      if (error instanceof Error) toast.error(error.message);
    },
  });
}

export function useCancelRule() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ruleId: string) => {
      if (!user) throw new Error('로그인이 필요합니다.');
      return cancelAutoRule(ruleId);
    },
    onSuccess: () => {
      if (!user) return;
      toast.success('자동매매 규칙이 취소되었습니다.');
      void queryClient.invalidateQueries({ queryKey: autoRulesQueryKey(user.id) });
    },
    onError: (error: unknown) => {
      if (error instanceof Error) toast.error(error.message);
    },
  });
}
