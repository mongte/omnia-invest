/**
 * GET /api/stocks/[id]/llm-summaries
 *
 * 특정 종목의 공시에 대한 LLM 요약 목록을 조회하여 반환합니다.
 * 먼저 해당 종목의 공시 ID 목록을 조회한 후 LLM 요약을 가져옵니다.
 *
 * Path params:
 *   - id: 종목 ID
 *
 * Query params:
 *   - disclosureLimit: 공시 조회 최대 수 (기본값: 20)
 */

import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseServer } from '@/shared/api/supabase-server';
import type { LlmSummaryData, LlmSentiment } from '@/entities/stock/types';

const CACHE_CONTROL = 'public, s-maxage=300, stale-while-revalidate=600';

function toLlmSentiment(raw: string): LlmSentiment {
  if (raw === 'positive' || raw === 'negative' || raw === 'neutral') return raw;
  return 'neutral';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: stockId } = await params;

  if (!stockId) {
    return NextResponse.json({ error: 'Stock ID is required' }, { status: 400 });
  }

  const { searchParams } = request.nextUrl;
  const disclosureLimit = parseInt(searchParams.get('disclosureLimit') ?? '20', 10);

  try {
    const supabase = getSupabaseServer();

    // 해당 종목의 공시 ID 목록을 먼저 조회
    const { data: disclosures, error: disclosureError } = await supabase
      .from('disclosures')
      .select('id')
      .eq('stock_id', stockId)
      .order('disclosure_date', { ascending: false })
      .limit(disclosureLimit);

    if (disclosureError) {
      console.error(
        `[GET /api/stocks/${stockId}/llm-summaries] disclosure error:`,
        disclosureError.message,
      );
      return NextResponse.json({ error: 'Failed to fetch disclosures' }, { status: 500 });
    }

    if (!disclosures || disclosures.length === 0) {
      return NextResponse.json([], {
        headers: { 'Cache-Control': CACHE_CONTROL },
      });
    }

    const disclosureIds = disclosures.map((d) => d.id);

    const { data: summaries, error: summaryError } = await supabase
      .from('llm_summaries')
      .select('id, disclosure_id, points, sentiment, impact, model, created_at')
      .in('disclosure_id', disclosureIds);

    if (summaryError) {
      console.error(
        `[GET /api/stocks/${stockId}/llm-summaries] summary error:`,
        summaryError.message,
      );
      return NextResponse.json({ error: 'Failed to fetch LLM summaries' }, { status: 500 });
    }

    const result: LlmSummaryData[] = (summaries ?? []).map((row) => ({
      id: row.id,
      disclosureId: row.disclosure_id,
      points: row.points,
      sentiment: toLlmSentiment(row.sentiment),
      impact: row.impact,
      model: row.model,
      createdAt: row.created_at,
    }));

    return NextResponse.json(result, {
      headers: { 'Cache-Control': CACHE_CONTROL },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[GET /api/stocks/${stockId}/llm-summaries] unexpected error:`, message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
