'use client';

import { type SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseBrowser } from './supabase-browser';
import type { Database } from '@/shared/types/supabase';

export interface VirtualPositionWithStock {
  id: string;
  user_id: string;
  stock_id: string;
  quantity: number;
  avg_cost: number;
  updated_at: string | null;
  stock_name: string;
  stock_code: string;
  current_price: number;
  change_rate: number;
}

function getClient(): SupabaseClient<Database> {
  return createSupabaseBrowser() as unknown as SupabaseClient<Database>;
}

/**
 * 유저의 가상 포지션 목록을 stocks 정보와 함께 반환합니다.
 */
export async function fetchVirtualPositions(userId: string): Promise<VirtualPositionWithStock[]> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('virtual_positions')
    .select('*, stocks(id, name, code, price, change_rate)')
    .eq('user_id', userId);

  if (error) throw new Error(`[virtual-positions] fetchVirtualPositions: ${error.message}`);

  return (data ?? []).map((p) => {
    const stock = p.stocks as {
      id: string;
      name: string;
      code: string;
      price: number;
      change_rate: number;
    } | null;

    return {
      id: p.id,
      user_id: p.user_id ?? '',
      stock_id: p.stock_id ?? '',
      quantity: p.quantity,
      avg_cost: p.avg_cost,
      updated_at: p.updated_at,
      stock_name: stock?.name ?? '',
      stock_code: stock?.code ?? '',
      current_price: stock?.price ?? 0,
      change_rate: stock?.change_rate ?? 0,
    };
  });
}
