/**
 * 서버 전용 Supabase 클라이언트
 *
 * SUPABASE_SERVICE_ROLE_KEY를 사용하여 서버 사이드에서만 호출 가능합니다.
 * Route Handler 및 Server Action에서만 import하세요.
 * 클라이언트 컴포넌트에서 import하면 서비스 키가 노출됩니다.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/supabase';

let _serverClient: SupabaseClient<Database> | null = null;

/**
 * service_role key를 사용하는 서버 전용 Supabase 클라이언트를 반환합니다.
 * 최초 호출 시 환경변수를 검증하고 클라이언트를 생성합니다.
 */
export function getSupabaseServer(): SupabaseClient<Database> {
  if (_serverClient) return _serverClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!serviceRoleKey) {
    throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
  }

  _serverClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      // 서버 사이드에서는 세션 관리 불필요
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return _serverClient;
}
