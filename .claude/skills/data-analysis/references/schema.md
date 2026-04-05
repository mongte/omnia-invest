# Data Analysis Schema Reference

## ERD (Entity-Relationship)

```
trading.strategies (1)
  │
  ├──< trading.analysis_runs (N) ── strategy_id FK
  │       │
  │       └──< trading.strategy_signals (N) ── run_id FK
  │                    │
  │                    └── stock_code → trading.watch_universe.stock_code
  │
  └── is_active (동시에 1개만 TRUE)
```

## 테이블 상세

### trading.strategies

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGSERIAL PK | |
| name | TEXT NOT NULL | 전략명 |
| version | TEXT DEFAULT '1.0' | 버전 |
| description | TEXT | 전략 설명 |
| strategy_type | TEXT DEFAULT 'composite' | factor, momentum, mean_reversion, ml, composite |
| params | JSONB NOT NULL | 팩터 가중치, 임계값, 지표 설정 |
| universe_filter | JSONB | 대상 종목 필터 (null = 전체) |
| is_active | BOOLEAN DEFAULT FALSE | 활성 상태 (1개만 TRUE) |
| activated_at | TIMESTAMPTZ | 활성화 시각 |
| deactivated_at | TIMESTAMPTZ | 비활성화 시각 |
| report_text | TEXT | 원본 보고서 텍스트 |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| **UNIQUE** | (name, version) | |

### trading.analysis_runs

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGSERIAL PK | |
| strategy_id | BIGINT FK → strategies | |
| status | TEXT DEFAULT 'started' | started, success, failed |
| run_date | DATE DEFAULT CURRENT_DATE | 분석 기준일 |
| stocks_analyzed | INT | 분석 종목 수 |
| signals_generated | INT | 시그널 생성 수 |
| metadata | JSONB | 소요시간, 버전 등 |
| error_message | TEXT | 오류 메시지 |
| started_at | TIMESTAMPTZ | |
| finished_at | TIMESTAMPTZ | |

### trading.strategy_signals

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGSERIAL PK | |
| run_id | BIGINT FK → analysis_runs | |
| strategy_id | BIGINT FK → strategies | |
| stock_code | TEXT NOT NULL | 종목코드 |
| signal_date | DATE NOT NULL | 시그널 기준일 |
| signal | TEXT DEFAULT 'hold' | strong_buy, buy, hold, sell, strong_sell |
| total_score | NUMERIC(6,2) DEFAULT 50 | 종합 점수 (0~100) |
| score_detail | JSONB | 팩터별 점수 상세 |
| indicators | JSONB | 지표 스냅샷 |
| rank | INT | 순위 |
| created_at | TIMESTAMPTZ | |
| **UNIQUE** | (run_id, stock_code) | |

## JOIN 패턴

```sql
-- 활성 전략의 최신 시그널 + 종목 정보
SELECT ss.stock_code, wu.corp_name, ss.signal, ss.total_score,
       ss.score_detail, ss.rank
FROM trading.strategy_signals ss
JOIN trading.analysis_runs ar ON ar.id = ss.run_id
JOIN trading.strategies s ON s.id = ar.strategy_id
JOIN trading.watch_universe wu ON wu.stock_code = ss.stock_code AND wu.is_active
WHERE s.is_active = TRUE AND ar.status = 'success'
  AND ar.run_date = (
    SELECT MAX(run_date) FROM trading.analysis_runs
    WHERE strategy_id = s.id AND status = 'success'
  )
ORDER BY ss.rank;
```

## 용량 추정 (Supabase 500MB 제한)

| 테이블 | 예상 row/월 | 예상 크기 |
|--------|------------|-----------|
| strategies | ~5 (누적) | < 0.1MB |
| analysis_runs | ~22 (영업일) | < 0.1MB |
| strategy_signals | ~1,100 (50종목 x 22일) | ~2MB/월 |
| **합계** | | ~24MB/년 |

30일 보존 시 strategy_signals ~2MB로 유지 가능.
