import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '../types';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  setAuth: (user: User | null, profile: UserProfile | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  setAuth: (user, profile) => set({ user, profile, isLoading: false }),
  clear: () => set({ user: null, profile: null, isLoading: false }),
}));
