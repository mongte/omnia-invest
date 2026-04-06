---
name: data-analysis
description: 동적 가중치 기반 종목 분석 모듈 - 전략 등록/활성화, 3-Layer 스코어링(팩터+타이밍+ML), 정규화, 시그널 생성
triggers:
  - 투자전략 등록
  - 전략 분석 실행
  - 종목 스코어링
  - 시그널 생성
  - 동적 가중치
  - 백테스트
---

# Data Analysis Skill

투자전략 보고서 기반 동적 스코어링 시스템. trading 스키마 데이터로 종목 분석 → 시그널 → public.stock_scores 동기화.

## 아키텍처 (3-Layer)

```
Layer 1 (팩터) ── 월간 ── "이 종목이 좋은가?" ── PER,PBR,ROE,매출성장,공시
     ↓
Layer 2 (타이밍) ── 매일 ── "지금 사야 하나?" ── RSI,MACD,BB,이격도,MA크로스
     ↓
Layer 3 (ML) ── 주간 재학습 ── "3~5일 후 오를 확률?" ── XGBoost/LightGBM
     ↓
동적 가중합 → Score_t = Σ w_i(t) × Normalize(Factor_i(t)) × 100
     ↓
시그널 판정 → Strong Buy / Buy / Hold / Sell / Strong Sell
```

## 모듈 구조

```
analyzer/
├── __init__.py           # 모듈 exports
├── base.py               # Supabase 연결, 데이터 로드 (AnalysisContext)
├── indicators.py         # 기술적 지표 (MA, RSI, MACD, BB, 이격도)
├── normalizers.py        # 4종 정규화 (Min-Max, Sigmoid, Percentile, Z-Score)
├── dynamic_weights.py    # 동적 가중치 (IC가중, 레짐스위칭, ML메타모델, EMA스무딩)
├── scoring.py            # 3-Layer 스코어러 + public.stock_scores 매핑
└── runner.py             # 분석 파이프라인 실행 엔진
```

## 동적 가중치 방법론 (3종)

| 방법 | 수식 | 장점 | 단점 |
|------|------|------|------|
| **IC 가중** | w_i(t) = \|IC_i(t)\| / Σ\|IC_j(t)\| | 구현 쉬움, 예측력 반영 | IC 노이즈 민감 |
| **레짐 스위칭** | regime = GMM(vol, mom) → 레짐별 w | 시장 국면 대응 | 레짐 전환 감지 지연 |
| **ML 메타모델** | w = XGBoost(IC, vol, mom) | 비선형 학습 | 과적합 위험, 해석 어려움 |

기본값: **IC가중 70% + 레짐스위칭 30% 하이브리드** (EMA α=0.2 스무딩)

## 정규화 매핑

| 지표 | 방법 | 이유 |
|------|------|------|
| PER, PBR | Min-Max (역수) | 낮을수록 저평가, 안정적 분포 |
| ROE, 매출성장률 | Min-Max | 높을수록 우량, 안정적 분포 |
| 이벤트 CAR | Percentile Rank | 종목 간 상대비교, 분포 무관 |
| RSI, MACD, MA크로스 | Sigmoid | 극단값 완화, 부드러운 전환 |
| BB 위치, 이격도 | Z-Score 롤링 | 시계열 특성 보존 |

## 시그널 임계값

| 점수 | 시그널 | 의미 |
|------|--------|------|
| 85~100 | Strong Buy | 강력 매수 |
| 65~84 | Buy | 매수 |
| 45~64 | Hold | 보유/관망 |
| 25~44 | Sell | 매도 |
| 0~24 | Strong Sell | 강력 매도 |

## DB 연동

### trading 스키마 (분석 결과 상세)
- `trading.strategies` — 전략 마스터 (params JSONB에 가중치/임계값)
- `trading.analysis_runs` — 분석 실행 이력
- `trading.strategy_signals` — 종목별 시그널 + score_detail + indicators

### public 스키마 (대시보드용 요약)
- `public.stock_scores` — 4팩터 점수(0~100) + total + descriptions
- `public.ranking_history` — 일별 순위 스냅샷

### 동기화 흐름
```
runner.py → trading.strategy_signals (상세)
         → public.stock_scores UPSERT (요약)
         → public.ranking_history INSERT (순위)
```

## 참조 보고서

| 보고서 | 역할 | 위치 |
|--------|------|------|
| 보고서 1 | 팩터/지표/파이프라인 설계 | `doc/research/KOSPI-대형주-200종목-대상으로-멀티팩터-피처-+.pdf` |
| 보고서 2 | 동적 가중치/정규화/안정화 | `doc/research/KOSPI-200종목-대상-3-Laye.pdf` |

## 사용 에이전트

| 에이전트 | 역할 |
|--------|------|
| **strategy** | 전략 설계, 스킬 구조 개선, 스키마 설계 |
| **backend** | Python 분석 모듈 구현, API 연동 |
| **database** | DB 마이그레이션, 데이터 동기화 |
