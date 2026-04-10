'use client';

import { useEffect } from 'react';
import { createSupabaseBrowser } from '@/shared/api/supabase-browser';
import { getSupabase } from '@/shared/api/supabase';
import { useAuthStore } from '@/entities/user';
import type { UserProfile } from '@/entities/user';
import type { Database } from '@/shared/types/supabase';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

interface AuthProviderProps {
  children: React.ReactNode;
}

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  console.log('[fetchProfile] start:', userId);
  const supabase = getSupabase();
  const response = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  console.log('[fetchProfile] response:', response.data, response.error);

  const data = response.data as ProfileRow | null;
  if (!data) return null;
  return {
    id: data.id,
    email: data.email ?? null,
    displayName: data.display_name ?? null,
    avatarUrl: data.avatar_url ?? null,
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setAuth, clear } = useAuthStore();

  useEffect(() => {
    const supabase = createSupabaseBrowser();

    // INITIAL_SESSION 포함 모든 이벤트 처리.
    // fetchProfile 실패해도 setAuth(user, null)로 isLoading: false 보장.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthProvider] event:', event, '| user:', session?.user?.email ?? null);
      if (session?.user) {
        try {
          const profile = await fetchProfile(session.user.id);
          console.log('[AuthProvider] profile:', profile);
          setAuth(session.user, profile);
        } catch (err) {
          console.error('[AuthProvider] fetchProfile error:', err);
          setAuth(session.user, null);
        }
      } else {
        console.log('[AuthProvider] no session → clear()');
        clear();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setAuth, clear]);

  return <>{children}</>;
}
