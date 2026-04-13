'use client';

import { type SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseBrowser } from './supabase-browser';
import type { Database } from '@/shared/types/supabase';

function getClient(): SupabaseClient<Database> {
  return createSupabaseBrowser() as unknown as SupabaseClient<Database>;
}

export interface HoldingWithStock {
  id: string;
  user_id: string;
  stock_id: string;
  quantity: number;
  avg_price: number;
  purchased_at: string | null;
  created_at: string;
  updated_at: string;
  stock_name: string;
  stock_code: string;
  current_price: number;
  pharos_score: number | null;
}

export interface StockSearchResult {
  id: string;
  name: string;
  code: string;
  price: number;
}

export interface UpsertHoldingPayload {
  stock_id: string;
  quantity: number;
  avg_price: number;
  purchased_at?: string | null;
}

/**
 * 종목 이름/코드로 검색합니다 (add-holding-form용).
 */
export async function searchStocksForHolding(query: string): Promise<StockSearchResult[]> {
  if (!query.trim()) return [];
  const supabase = getClient();

  const { data, error } = await supabase
    .from('stocks')
    .select('id, name, code, price')
    .or(`name.ilike.%${query}%,code.ilike.%${query}%`)
    .limit(10);

  if (error) throw new Error(`[holdings] searchStocks: ${error.message}`);
  return (data ?? []) as StockSearchResult[];
}

/**
 * 현재 유저의 보유 종목 목록을 stocks 정보와 함께 반환합니다.
 */
export async function fetchHoldings(): Promise<HoldingWithStock[]> {
  const supabase = getClient();

  const { data: holdingsData, error: holdingsError } = await supabase
    .from('user_holdings')
    .select('*, stocks(id, name, code, price)');

  if (holdingsError) {
    throw new Error(`[holdings] fetchHoldings: ${holdingsError.message}`);
  }

  const holdings = holdingsData ?? [];

  if (holdings.length === 0) return [];

  const stockIds = holdings.map((h) => h.stock_id);

  const { data: scoresData, error: scoresError } = await supabase
    .from('stock_scores')
    .select('stock_id, total, created_at')
    .in('stock_id', stockIds)
    .order('created_at', { ascending: false });

  if (scoresError) {
    throw new Error(`[holdings] fetchHoldings scores: ${scoresError.message}`);
  }

  const latestScoreMap = new Map<string, number>();
  for (const row of scoresData ?? []) {
    if (!latestScoreMap.has(row.stock_id)) {
      latestScoreMap.set(row.stock_id, row.total);
    }
  }

  return holdings.map((h) => {
    const stock = h.stocks as { id: string; name: string; code: string; price: number } | null;
    return {
      id: h.id,
      user_id: h.user_id,
      stock_id: h.stock_id,
      quantity: h.quantity,
      avg_price: h.avg_price,
      purchased_at: h.purchased_at,
      created_at: h.created_at,
      updated_at: h.updated_at,
      stock_name: stock?.name ?? '',
      stock_code: stock?.code ?? '',
      current_price: stock?.price ?? 0,
      pharos_score: latestScoreMap.get(h.stock_id) ?? null,
    };
  });
}

/**
 * 보유 종목을 추가하거나 평균단가를 갱신합니다 (upsert).
 */
export async function upsertHolding(payload: UpsertHoldingPayload): Promise<void> {
  const supabase = getClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw new Error(`[holdings] upsertHolding getUser: ${userError.message}`);
  if (!user) throw new Error('[holdings] upsertHolding: 로그인이 필요합니다.');

  const { error } = await supabase
    .from('user_holdings')
    .upsert(
      { user_id: user.id, ...payload },
      { onConflict: 'user_id,stock_id' },
    );

  if (error) {
    throw new Error(`[holdings] upsertHolding: ${error.message}`);
  }
}

/**
 * 보유 종목을 삭제합니다.
 */
export async function deleteHolding(holdingId: string): Promise<void> {
  const supabase = getClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw new Error(`[holdings] deleteHolding getUser: ${userError.message}`);
  if (!user) throw new Error('[holdings] deleteHolding: 로그인이 필요합니다.');

  const { error } = await supabase
    .from('user_holdings')
    .delete()
    .eq('id', holdingId)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`[holdings] deleteHolding: ${error.message}`);
  }
}
