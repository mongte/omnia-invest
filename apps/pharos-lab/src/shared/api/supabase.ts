import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/supabase';

let _client: SupabaseClient<Database> | null = null;

/**
 * Supabase 클라이언트를 반환합니다.
 * 환경변수 검증은 최초 호출 시점에 수행되므로 빌드 타임 크래시가 발생하지 않습니다.
 */
export function getSupabase(): SupabaseClient<Database> {
  if (_client) return _client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY',
    );
  }

  _client = createClient<Database>(supabaseUrl, supabaseAnonKey);
  return _client;
}

/**
 * Supabase 클라이언트 싱글턴.
 * 모듈 평가 시점이 아닌 첫 속성 접근 시 lazy 초기화됩니다.
 */
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop: string | symbol) {
    const client = getSupabase();
    const value = client[prop as keyof SupabaseClient<Database>];
    return typeof value === 'function' ? (value as Function).bind(client) : value;
  },
});
