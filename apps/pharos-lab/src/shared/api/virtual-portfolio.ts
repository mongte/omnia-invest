'use client';

import { type SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseBrowser } from './supabase-browser';
import type { Database } from '@/shared/types/supabase';

type VirtualPortfolio = Database['public']['Tables']['virtual_portfolios']['Row'];

export type { VirtualPortfolio };

function getClient(): SupabaseClient<Database> {
  return createSupabaseBrowser() as unknown as SupabaseClient<Database>;
}

/**
 * 유저의 가상 포트폴리오 1행을 조회합니다.
 */
export async function fetchVirtualPortfolio(userId: string): Promise<VirtualPortfolio | null> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('virtual_portfolios')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`[virtual-portfolio] fetchVirtualPortfolio: ${error.message}`);
  return data;
}

/**
 * 가상 포트폴리오를 초기화합니다.
 * 포지션, 자동매매 규칙, 주문 내역을 삭제하고 잔고를 initial_balance로 복원합니다.
 */
export async function resetVirtualPortfolio(userId: string): Promise<void> {
  const supabase = getClient();

  const { error: posError } = await supabase
    .from('virtual_positions')
    .delete()
    .eq('user_id', userId);

  if (posError) throw new Error(`[virtual-portfolio] reset positions: ${posError.message}`);

  const { error: rulesError } = await supabase
    .from('auto_trade_rules')
    .delete()
    .eq('user_id', userId);

  if (rulesError) throw new Error(`[virtual-portfolio] reset rules: ${rulesError.message}`);

  const { error: ordersError } = await supabase
    .from('virtual_orders')
    .delete()
    .eq('user_id', userId);

  if (ordersError) throw new Error(`[virtual-portfolio] reset orders: ${ordersError.message}`);

  const { data: portfolio, error: fetchError } = await supabase
    .from('virtual_portfolios')
    .select('initial_balance')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) throw new Error(`[virtual-portfolio] reset fetch: ${fetchError.message}`);
  if (!portfolio) return;

  const { error: updateError } = await supabase
    .from('virtual_portfolios')
    .update({ cash_balance: portfolio.initial_balance, reserved_cash: 0 })
    .eq('user_id', userId);

  if (updateError) throw new Error(`[virtual-portfolio] reset update: ${updateError.message}`);
}
