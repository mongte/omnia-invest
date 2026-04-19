'use client';

import { type SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseBrowser } from './supabase-browser';
import type { Database } from '@/shared/types/supabase';

type AutoTradeRule = Database['public']['Tables']['auto_trade_rules']['Row'];

export interface AutoRuleWithStock extends AutoTradeRule {
  stock_name: string;
  stock_code: string;
}

export interface CreateRuleParams {
  userId: string;
  stockId: string;
  ruleType: string;
  quantity: number;
  triggerPrice?: number | null;
  triggerSignal?: string | null;
}

function getClient(): SupabaseClient<Database> {
  return createSupabaseBrowser() as unknown as SupabaseClient<Database>;
}

/**
 * 활성 자동매매 규칙 목록을 종목 정보와 함께 반환합니다.
 */
export async function fetchAutoRules(userId: string): Promise<AutoRuleWithStock[]> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('auto_trade_rules')
    .select('*, stocks(id, name, code)')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (error) throw new Error(`[auto-trade-rules] fetchAutoRules: ${error.message}`);

  return (data ?? []).map((r) => {
    const stock = r.stocks as { id: string; name: string; code: string } | null;
    return {
      ...r,
      stock_name: stock?.name ?? '',
      stock_code: stock?.code ?? '',
    };
  });
}

/**
 * 자동매매 규칙을 생성합니다.
 */
export async function createAutoRule(params: CreateRuleParams): Promise<void> {
  const supabase = getClient();

  const { error } = await supabase.from('auto_trade_rules').insert({
    user_id: params.userId,
    stock_id: params.stockId,
    rule_type: params.ruleType,
    quantity: params.quantity,
    trigger_price: params.triggerPrice ?? null,
    trigger_signal: params.triggerSignal ?? null,
    status: 'active',
  });

  if (error) throw new Error(`[auto-trade-rules] createAutoRule: ${error.message}`);
}

/**
 * 자동매매 규칙을 취소합니다 (status = 'cancelled').
 */
export async function cancelAutoRule(ruleId: string): Promise<void> {
  const supabase = getClient();

  const { error } = await supabase
    .from('auto_trade_rules')
    .update({ status: 'cancelled' })
    .eq('id', ruleId);

  if (error) throw new Error(`[auto-trade-rules] cancelAutoRule: ${error.message}`);
}
