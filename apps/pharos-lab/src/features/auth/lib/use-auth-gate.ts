'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore, useLoginModalStore } from '@/entities/user';

export function useAuthGate() {
  const { user } = useAuthStore();
  const { open: openLoginModal } = useLoginModalStore();
  const router = useRouter();

  const guardedNavigate = (href: string) => {
    if (user) {
      router.push(href);
    } else {
      openLoginModal(href);
    }
  };

  return { guardedNavigate, isAuthenticated: !!user };
}
