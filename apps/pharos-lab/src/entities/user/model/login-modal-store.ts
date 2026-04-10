import { create } from 'zustand';

interface LoginModalState {
  isOpen: boolean;
  redirectTo: string | null;
  open: (redirectTo?: string) => void;
  close: () => void;
}

export const useLoginModalStore = create<LoginModalState>((set) => ({
  isOpen: false,
  redirectTo: null,
  open: (redirectTo) => set({ isOpen: true, redirectTo: redirectTo ?? null }),
  close: () => set({ isOpen: false, redirectTo: null }),
}));
