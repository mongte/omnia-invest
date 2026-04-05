---
name: data-analysis
description: 투자전략 기반 종목 분석 모듈 - 전략 등록/활성화, 기술적·펀더멘털 분석, 시그널 생성
triggers:
  - 투자전략 등록
  - 전략 분석 실행
  - 종목 스코어링
  - 시그널 생성
  - 백테스트
---

# Data Analysis Skill

투자전략 보고서를 등록하고, trading 스키마의 데이터를 기반으로 종목 분석을 실행하여 시그널을 생성하는 파이프라인.

## 아키텍처

```
투자전략 보고서 등록
  ↓
trading.strategies 저장 + 활성화
  ↓
analyzer/runner.py 실행
  ├─ indicators.py  (기술적 지표 계산)
  ├─ scoring.py     (전략 파라미터 기반 스코어링)
  └─ base.py        (DB 연결, 데이터 로드)
  ↓
trading.strategy_signals 저장
  ↓
결과 조회 (get_latest_signals RPC)
```

## DB 테이블

| 테이블 | 역할 |
|--------|------|
| `trading.strategies` | 전략 마스터 (name, version, params, is_active) |
| `trading.analysis_runs` | 분석 실행 이력 (strategy_id, status, run_date) |
| `trading.strategy_signals` | 종목별 시그널 (signal, total_score, score_detail, rank) |

### 핵심 RPC 함수

| 함수 | 역할 |
|------|------|
| `trading.activate_strategy(id)` | 기존 전략 비활성화 + 지정 전략 활성화 |
| `trading.get_active_strategy()` | 현재 활성 전략 JSON 반환 |
| `trading.get_latest_signals(strategy_id?)` | 최신 분석 시그널 목록 |

## 전략 파라미터 구조 (params JSONB)

```json
{
  "factors": {
    "momentum": {
      "weight": 0.3,
      "lookback_days": 60,
      "indicators": ["rsi14", "macd", "ma_cross"]
    },
    "value": {
      "weight": 0.3,
      "metrics": ["per", "pbr", "roe"]
    },
    "quality": {
      "weight": 0.2,
      "metrics": ["roe", "debt_ratio", "revenue_growth"]
    },
    "event": {
      "weight": 0.2,
      "disclosure_types": ["earnings", "buyback", "dividend"]
    }
  },
  "signal_thresholds": {
    "strong_buy": 80,
    "buy": 65,
    "hold": 40,
    "sell": 25
  },
  "universe": {
    "market": "KOSPI",
    "min_market_cap": null,
    "max_stocks": 50
  }
}
```

## 시그널 유형

| 시그널 | 점수 범위 | 의미 |
|--------|-----------|------|
| `strong_buy` | 80~100 | 강력 매수 |
| `buy` | 65~79 | 매수 |
| `hold` | 40~64 | 보유/관망 |
| `sell` | 25~39 | 매도 |
| `strong_sell` | 0~24 | 강력 매도 |

## 사용 가능 데이터 소스

| 소스 테이블 | 데이터 | 레코드 수 |
|-------------|--------|-----------|
| `trading.ohlcv_daily` | 일봉 OHLCV (1년) | ~8,200 |
| `trading.stock_fundamentals` | PER, PBR, ROE, 시총 등 | ~100 |
| `trading.financial_statements` | IFRS 재무제표 (2년) | ~3,500 |
| `trading.disclosures` | 공시 (6개월) | ~700 |
| `trading.watch_universe` | KOSPI Top50 활성 종목 | ~56 |

## 분석 모듈 (analyzer/)

### base.py — DB 연결 & 데이터 로드
- Supabase REST API 호출로 trading 스키마 데이터 로드
- pandas DataFrame 변환
- 활성 전략 파라미터 파싱

### indicators.py — 기술적 지표 계산
- 이동평균 (MA5, MA20, MA60, MA120)
- RSI (14일)
- MACD (12, 26, 9)
- 볼린저밴드 (20, 2)
- 이격도 (현재가/MA20 비율)
- 52주 고/저 대비 위치

### scoring.py — 팩터 스코어링
- 모멘텀 스코어: RSI, MACD, MA 크로스 기반
- 밸류 스코어: PER, PBR 섹터 상대 평가
- 퀄리티 스코어: ROE, 재무 안정성
- 이벤트 스코어: 최근 공시 유형별 가중치
- 종합 점수 = 팩터별 가중합

### runner.py — 분석 실행 엔진
1. 활성 전략 로드
2. 유니버스 종목 목록 로드
3. 종목별 지표 계산 + 스코어링
4. 시그널 판정 + 순위 매기기
5. `trading.analysis_runs` + `trading.strategy_signals` 저장

## 워크플로우

### 전략 등록
```
사용자 → 투자전략 보고서 텍스트 제공
  ↓
strategy 에이전트가 보고서 파싱 → params JSON 구성
  ↓
trading.strategies INSERT → trading.activate_strategy(id) 호출
  ↓
기존 활성 전략 자동 비활성화
```

### 분석 실행
```
사용자 → "분석 실행해줘"
  ↓
runner.py → 활성 전략 로드
  ↓
종목별: OHLCV + Fundamentals + Financials + Disclosures 로드
  ↓
indicators.py → 기술적 지표 계산
  ↓
scoring.py → 팩터별 스코어 → 종합 점수 → 시그널 판정
  ↓
DB 저장: analysis_runs + strategy_signals
  ↓
결과 리포트 출력
```

## 제약사항

- Supabase 무료 티어 500MB 제한 — 시그널은 최근 30일만 보존 권장
- OHLCV 1년 데이터 → 장기 모멘텀(200일 등) 계산 제한
- 재무제표 2년 → YoY 성장률 계산 가능, 장기 트렌드 제한
- 실시간 데이터 없음 — 일 단위 분석만 가능
