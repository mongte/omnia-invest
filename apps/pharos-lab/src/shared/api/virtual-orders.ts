'use client';

import { type SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { createSupabaseBrowser } from './supabase-browser';
import type { Database } from '@/shared/types/supabase';

type VirtualOrder = Database['public']['Tables']['virtual_orders']['Row'];

export type { VirtualOrder };

export interface PlaceOrderParams {
  userId: string;
  stockId: string;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  orderType?: string;
}

function getClient(): SupabaseClient<Database> {
  return createSupabaseBrowser() as unknown as SupabaseClient<Database>;
}

/**
 * 최신순 주문 내역을 조회합니다 (기본 50건).
 */
export async function fetchVirtualOrders(
  userId: string,
  limit = 50,
): Promise<VirtualOrder[]> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('virtual_orders')
    .select('*')
    .eq('user_id', userId)
    .order('executed_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`[virtual-orders] fetchVirtualOrders: ${error.message}`);
  return data ?? [];
}

/**
 * 매수/매도 주문을 체결합니다.
 * 클라이언트에서 직렬로 처리하며 에러 발생 시 toast.error()로 노출합니다.
 */
export async function placeVirtualOrder(params: PlaceOrderParams): Promise<void> {
  const { userId, stockId, side, price, quantity, orderType = 'market' } = params;
  const supabase = getClient();
  const totalAmount = price * quantity;

  if (side === 'buy') {
    const { data: portfolio, error: pfError } = await supabase
      .from('virtual_portfolios')
      .select('cash_balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (pfError) {
      toast.error(pfError.message);
      throw new Error(`[virtual-orders] buy: fetch portfolio: ${pfError.message}`);
    }
    if (!portfolio) {
      toast.error('포트폴리오 정보를 찾을 수 없습니다.');
      throw new Error('[virtual-orders] buy: portfolio not found');
    }
    if (portfolio.cash_balance < totalAmount) {
      toast.error('잔고가 부족합니다.');
      throw new Error('[virtual-orders] buy: insufficient balance');
    }

    const { error: orderError } = await supabase.from('virtual_orders').insert({
      user_id: userId,
      stock_id: stockId,
      side: 'buy',
      order_type: orderType,
      price,
      quantity,
      total_amount: totalAmount,
      executed_at: new Date().toISOString(),
    });

    if (orderError) {
      toast.error(orderError.message);
      throw new Error(`[virtual-orders] buy: insert order: ${orderError.message}`);
    }

    const { data: existing, error: posReadError } = await supabase
      .from('virtual_positions')
      .select('id, quantity, avg_cost')
      .eq('user_id', userId)
      .eq('stock_id', stockId)
      .maybeSingle();

    if (posReadError) {
      toast.error(posReadError.message);
      throw new Error(`[virtual-orders] buy: read position: ${posReadError.message}`);
    }

    if (existing) {
      const newQty = existing.quantity + quantity;
      const newAvgCost =
        (existing.quantity * existing.avg_cost + quantity * price) / newQty;

      const { error: posUpdateError } = await supabase
        .from('virtual_positions')
        .update({ quantity: newQty, avg_cost: newAvgCost, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (posUpdateError) {
        toast.error(posUpdateError.message);
        throw new Error(`[virtual-orders] buy: update position: ${posUpdateError.message}`);
      }
    } else {
      const { error: posInsertError } = await supabase.from('virtual_positions').insert({
        user_id: userId,
        stock_id: stockId,
        quantity,
        avg_cost: price,
        updated_at: new Date().toISOString(),
      });

      if (posInsertError) {
        toast.error(posInsertError.message);
        throw new Error(`[virtual-orders] buy: insert position: ${posInsertError.message}`);
      }
    }

    const { error: balError } = await supabase
      .from('virtual_portfolios')
      .update({ cash_balance: portfolio.cash_balance - totalAmount })
      .eq('user_id', userId);

    if (balError) {
      toast.error(balError.message);
      throw new Error(`[virtual-orders] buy: update balance: ${balError.message}`);
    }
  } else {
    // sell
    const { data: existing, error: posReadError } = await supabase
      .from('virtual_positions')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('stock_id', stockId)
      .maybeSingle();

    if (posReadError) {
      toast.error(posReadError.message);
      throw new Error(`[virtual-orders] sell: read position: ${posReadError.message}`);
    }
    if (!existing || existing.quantity < quantity) {
      toast.error('보유 수량이 부족합니다.');
      throw new Error('[virtual-orders] sell: insufficient quantity');
    }

    const { error: orderError } = await supabase.from('virtual_orders').insert({
      user_id: userId,
      stock_id: stockId,
      side: 'sell',
      order_type: orderType,
      price,
      quantity,
      total_amount: totalAmount,
      executed_at: new Date().toISOString(),
    });

    if (orderError) {
      toast.error(orderError.message);
      throw new Error(`[virtual-orders] sell: insert order: ${orderError.message}`);
    }

    const newQty = existing.quantity - quantity;

    if (newQty === 0) {
      const { error: posDeleteError } = await supabase
        .from('virtual_positions')
        .delete()
        .eq('id', existing.id);

      if (posDeleteError) {
        toast.error(posDeleteError.message);
        throw new Error(`[virtual-orders] sell: delete position: ${posDeleteError.message}`);
      }
    } else {
      const { error: posUpdateError } = await supabase
        .from('virtual_positions')
        .update({ quantity: newQty, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (posUpdateError) {
        toast.error(posUpdateError.message);
        throw new Error(`[virtual-orders] sell: update position: ${posUpdateError.message}`);
      }
    }

    const { data: portfolio, error: pfError } = await supabase
      .from('virtual_portfolios')
      .select('cash_balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (pfError) {
      toast.error(pfError.message);
      throw new Error(`[virtual-orders] sell: fetch portfolio: ${pfError.message}`);
    }
    if (!portfolio) {
      toast.error('포트폴리오 정보를 찾을 수 없습니다.');
      throw new Error('[virtual-orders] sell: portfolio not found');
    }

    const { error: balError } = await supabase
      .from('virtual_portfolios')
      .update({ cash_balance: portfolio.cash_balance + totalAmount })
      .eq('user_id', userId);

    if (balError) {
      toast.error(balError.message);
      throw new Error(`[virtual-orders] sell: update balance: ${balError.message}`);
    }
  }
}
