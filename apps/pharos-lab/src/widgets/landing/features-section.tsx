import { BarChart2, Wallet, Database, type LucideIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';

interface FeatureCard {
  icon: LucideIcon;
  title: string;
  description: string;
  details: string[];
}

const FEATURES: FeatureCard[] = [
  {
    icon: BarChart2,
    title: '종목 스코어링',
    description: '퀀트 알고리즘 기반의 체계적 종목 분석',
    details: [
      '코스피 Top50 퀀트 점수 분석',
      '멀티팩터 스코어링 모델',
      '레이더 차트 시각화',
    ],
  },
  {
    icon: Wallet,
    title: '가상 투자',
    description: '리스크 없는 모의 포트폴리오 운용',
    details: ['모의 매수/매도 주문', '포트폴리오 손익 추적', 'AI 투자 신호'],
  },
  {
    icon: Database,
    title: '실시간 데이터',
    description: '트레이딩 API 기반 자동 데이터 수집',
    details: [
      '일봉/종가 자동 수집 (일 2회)',
      '12,500+ 건의 OHLCV 데이터',
      '공시 정보 자동 분류',
    ],
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 섹션 헤더 */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            핵심 기능 소개
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            데이터 수집부터 분석, 가상 투자까지 퀀트 투자의 전 과정을
            지원합니다.
          </p>
        </div>

        {/* 기능 카드 그리드 */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="group cursor-default border-border/50 bg-card/50 transition-all duration-200 hover:border-primary/50 hover:bg-card hover:shadow-lg hover:shadow-primary/5"
              >
                <CardHeader>
                  <div className="mb-3 inline-flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    <Icon className="size-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.details.map((detail) => (
                      <li
                        key={detail}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <span className="size-1.5 flex-shrink-0 rounded-full bg-primary" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
