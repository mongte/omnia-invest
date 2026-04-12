'use client';

import { type SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseBrowser } from './supabase-browser';
import type { Database } from '@/shared/types/supabase';

/**
 * createSupabaseBrowser()를 SupabaseClient<Database>로 캐스팅합니다.
 * @supabase/ssr의 createBrowserClient 반환 타입이 완전한 Database 제네릭을
 * 보존하지 않는 경우 타입 안전성을 확보하기 위해 명시적 캐스팅을 사용합니다.
 */
function getClient(): SupabaseClient<Database> {
  return createSupabaseBrowser() as unknown as SupabaseClient<Database>;
}

/**
 * 현재 로그인한 유저의 즐겨찾기 stock_id 배열을 반환합니다.
 * RLS가 auth.uid()를 기반으로 필터링하므로 user_id 조건이 별도로 필요하지 않습니다.
 */
export async function fetchFavoriteStockIds(): Promise<string[]> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('user_favorites')
    .select('stock_id');

  if (error) {
    throw new Error(`[favorites] fetchFavoriteStockIds: ${error.message}`);
  }

  return (data ?? []).map((row) => row.stock_id);
}

/**
 * 즐겨찾기를 추가합니다.
 * 이미 존재하는 경우(중복) 무시합니다.
 */
export async function addFavorite(stockId: string): Promise<void> {
  const supabase = getClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`[favorites] addFavorite getUser: ${userError.message}`);
  }
  if (!user) {
    throw new Error('[favorites] addFavorite: 로그인이 필요합니다.');
  }

  const { error } = await supabase
    .from('user_favorites')
    .insert({ user_id: user.id, stock_id: stockId });

  if (error) {
    // 중복 삽입(23505 unique violation)은 에러로 처리하지 않음
    if (error.code === '23505') return;
    throw new Error(`[favorites] addFavorite: ${error.message}`);
  }
}

/**
 * 즐겨찾기를 삭제합니다.
 */
export async function removeFavorite(stockId: string): Promise<void> {
  const supabase = getClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`[favorites] removeFavorite getUser: ${userError.message}`);
  }
  if (!user) {
    throw new Error('[favorites] removeFavorite: 로그인이 필요합니다.');
  }

  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('stock_id', stockId);

  if (error) {
    throw new Error(`[favorites] removeFavorite: ${error.message}`);
  }
}
