'use client';

import { type SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseBrowser } from './supabase-browser';
import type { Database } from '@/shared/types/supabase';

type EquitySnapshot = Database['public']['Tables']['virtual_equity_snapshots']['Row'];

export type { EquitySnapshot };

function getClient(): SupabaseClient<Database> {
  return createSupabaseBrowser() as unknown as SupabaseClient<Database>;
}

/**
 * 최근 N일간의 자산 스냅샷을 조회합니다 (기본 30일).
 */
export async function fetchEquityCurve(
  userId: string,
  days = 30,
): Promise<EquitySnapshot[]> {
  const supabase = getClient();

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('virtual_equity_snapshots')
    .select('*')
    .eq('user_id', userId)
    .gte('snapshot_date', sinceStr)
    .order('snapshot_date', { ascending: true });

  if (error) throw new Error(`[virtual-equity] fetchEquityCurve: ${error.message}`);
  return data ?? [];
}

/**
 * 오늘 날짜 자산 스냅샷을 생성하거나 갱신합니다.
 * total_equity = cash_balance + sum(position.quantity * stocks.price)
 */
export async function upsertEquitySnapshot(userId: string): Promise<void> {
  const supabase = getClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: portfolio, error: pfError } = await supabase
    .from('virtual_portfolios')
    .select('cash_balance')
    .eq('user_id', userId)
    .maybeSingle();

  if (pfError) throw new Error(`[virtual-equity] upsert: fetch portfolio: ${pfError.message}`);
  if (!portfolio) throw new Error('[virtual-equity] upsert: portfolio not found');

  const { data: positions, error: posError } = await supabase
    .from('virtual_positions')
    .select('quantity, stocks(price)')
    .eq('user_id', userId);

  if (posError) throw new Error(`[virtual-equity] upsert: fetch positions: ${posError.message}`);

  const marketValue = (positions ?? []).reduce((acc, p) => {
    const stock = p.stocks as { price: number } | null;
    return acc + p.quantity * (stock?.price ?? 0);
  }, 0);

  const totalEquity = portfolio.cash_balance + marketValue;

  const { error: upsertError } = await supabase
    .from('virtual_equity_snapshots')
    .upsert(
      {
        user_id: userId,
        snapshot_date: today,
        cash_balance: portfolio.cash_balance,
        market_value: marketValue,
        total_equity: totalEquity,
      },
      { onConflict: 'user_id,snapshot_date' },
    );

  if (upsertError) throw new Error(`[virtual-equity] upsert: ${upsertError.message}`);
}
