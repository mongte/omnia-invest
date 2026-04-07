import { RadarChart } from '@/shared/ui/charts';
import { BarChart2, TrendingUp, AlertCircle } from 'lucide-react';

// 정적 더미 데이터 - API 호출 없음
const PREVIEW_STOCKS = [
  { rank: 1, name: '삼성전자', code: '005930', score: 87 },
  { rank: 2, name: 'SK하이닉스', code: '000660', score: 82 },
  { rank: 3, name: 'LG에너지솔루션', code: '373220', score: 79 },
  { rank: 4, name: '현대차', code: '005380', score: 75 },
  { rank: 5, name: '기아', code: '000270', score: 71 },
];

const PREVIEW_DISCLOSURES = [
  { time: '14:32', title: '분기보고서 제출', stock: 'SK하이닉스' },
  { time: '11:05', title: '주요사항보고서', stock: '삼성전자' },
  { time: '09:20', title: '사업보고서 제출', stock: '현대차' },
];

export function PreviewSection() {
  return (
    <section id="preview" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 섹션 헤더 */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            실시간 퀀트 분석 대시보드
          </h2>
          <p className="text-lg text-muted-foreground">
            실제 플랫폼에서 제공하는 분석 화면을 미리 확인하세요.
          </p>
        </div>

        {/* 브라우저 프레임 */}
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-xl border border-border/50 bg-card shadow-2xl shadow-primary/10">
          {/* 브라우저 상단 바 */}
          <div className="flex items-center gap-3 border-b border-border/50 bg-secondary/50 px-4 py-3">
            <div className="flex gap-1.5">
              <span className="size-3 rounded-full bg-destructive/60" />
              <span className="size-3 rounded-full bg-yellow-500/60" />
              <span className="size-3 rounded-full bg-green-500/60" />
            </div>
            <div className="flex-1 rounded-md bg-background/50 px-3 py-1 text-center text-xs text-muted-foreground">
              pharos-lab.vercel.app/dashboard
            </div>
          </div>

          {/* 대시보드 목업 콘텐츠 */}
          <div className="grid grid-cols-1 gap-0 lg:grid-cols-3">
            {/* 왼쪽: 종목 랭킹 */}
            <div className="border-r border-border/30 bg-background/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="size-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  퀀트 랭킹 Top 5
                </span>
              </div>
              <div className="space-y-2">
                {PREVIEW_STOCKS.map((stock) => (
                  <div
                    key={stock.code}
                    className="flex items-center justify-between rounded-md bg-secondary/30 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground">
                        #{stock.rank}
                      </span>
                      <div>
                        <div className="text-xs font-medium text-foreground">
                          {stock.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {stock.code}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-16 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${stock.score}%` }}
                        />
                      </div>
                      <span className="w-7 text-right text-xs font-semibold text-primary">
                        {stock.score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 가운데: 레이더 차트 */}
            <div className="border-r border-border/30 bg-background/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <BarChart2 className="size-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  종목 스코어 분석
                </span>
              </div>
              <p className="mb-3 text-[10px] text-muted-foreground">
                삼성전자 (005930) · 종합점수 87
              </p>
              <RadarChart height={180} />
            </div>

            {/* 오른쪽: 공시 타임라인 */}
            <div className="bg-background/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <AlertCircle className="size-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  최근 공시
                </span>
              </div>
              <div className="space-y-3">
                {PREVIEW_DISCLOSURES.map((disclosure, idx) => (
                  <div
                    key={idx}
                    className="border-l-2 border-primary/40 pl-3"
                  >
                    <div className="text-[10px] text-muted-foreground">
                      {disclosure.time} · {disclosure.stock}
                    </div>
                    <div className="text-xs text-foreground">
                      {disclosure.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 하단 그라디언트 페이드아웃 */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </div>
      </div>
    </section>
  );
}
