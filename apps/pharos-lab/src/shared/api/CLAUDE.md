# shared/api — Supabase 데이터 페칭 레이어

## 접근 패턴

### public 스키마 (anon key 직접 접근)
```typescript
import { supabase } from './supabase'
const { data } = await supabase.from('stocks').select('*')
```

### trading 스키마 (service_role key로 REST 접근 가능)
```typescript
// service_role key + Content-Profile 헤더로 직접 접근
const { data } = await supabase.from('ohlcv_daily')
  .select('*')
  .eq('stock_code', '005930')
  // 단, headers에 Accept-Profile: 'trading', Content-Profile: 'trading' 필요
```

또는 RPC 함수 사용:
```typescript
const { data } = await supabase.rpc('get_active_universe')
const { data } = await supabase.rpc('exec_sql', { query: 'SELECT ...' })
```

**주의**: anon key로는 trading 스키마 접근 불가. 서버 사이드(service_role)에서만 접근.

## 클라이언트
- 위치: `supabase.ts` (이미 구성됨)
- 환경변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## public 스키마 테이블

### stocks (100건 — Mock 50 + trading Top50)
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | text PK | 종목 ID (Mock: 'samsung', trading: '005930') |
| code | text | 6자리 종목코드 (= trading.*.stock_code) |
| name | text | 종목명 |
| market | text | 시장 |
| sector | text? | 섹터 |
| price | integer | 현재가 |
| change | integer | 변화액 |
| change_rate | numeric | 변화율(%) |
| rank | integer? | 순위 |

### stock_scores (50건)
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | uuid PK | |
| stock_id | text FK → stocks.id | |
| fundamental | integer | 펀더멘털 점수 |
| momentum | integer | 모멘텀 점수 |
| disclosure | integer | 공시활동 점수 |
| institutional | integer | 기관관심 점수 |
| total | integer | 종합 점수 |
| score_descriptions | text[] | 점수 설명 |

### ranking_history (70건)
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | uuid PK | |
| stock_id | text FK → stocks.id | |
| rank_date | date | 순위 날짜 |
| rank | integer | 순위 |
| total_score | integer? | 당시 점수 |

### disclosures (666건 — trading에서 자동 동기화)
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | text PK | |
| stock_id | text FK → stocks.id | |
| disclosure_date | date | 공시일 |
| title | text | 공시 제목 |
| type | text | earnings / ownership / other |
| importance | text | high / medium / low |

### llm_summaries (7건)
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | uuid PK | |
| disclosure_id | text FK → disclosures.id | |
| points | text[] | 핵심 포인트 |
| sentiment | text | positive / negative / neutral |
| impact | text | 영향 평가 |
| model | text | LLM 모델명 |

## trading 스키마 테이블

### ohlcv_daily (~8,000건, 1년 롤링)
| 컬럼 | 타입 | 비고 |
|------|------|------|
| stock_code | text | 6자리 (= public.stocks.code) |
| trade_date | date | 거래일 |
| open_price | bigint | 시가 |
| high_price | bigint | 고가 |
| low_price | bigint | 저가 |
| close_price | bigint | 종가 |
| volume | bigint | 거래량 |
| trading_value | bigint? | 거래대금 |
| change_rate | numeric? | 등락률 |

### stock_fundamentals (50건)
| 컬럼 | 타입 | 비고 |
|------|------|------|
| stock_code | text | 6자리 |
| per/pbr | numeric | 밸류에이션 |
| eps/bps | bigint | 주당 지표 |
| roe | numeric | 수익률 |
| market_cap | bigint | 시가총액 |
| foreign_ratio | numeric | 외국인 보유율 |

### sync_log (운영 로그)
| 컬럼 | 타입 | 비고 |
|------|------|------|
| job_name | text | pre-market-kiwoom / post-market-kiwoom / daily-sync-opendart / monthly-financial-sync / weekly-cleanup |
| status | text | started / success / partial / error |
| rows_affected | int | 처리 건수 |
| error_message | text? | 에러 시 메시지 |
| started_at | timestamptz | 시작 시각 |
| finished_at | timestamptz? | 완료 시각 |

### RPC 함수
- `trading.exec_sql(query text)` → Edge Function에서 trading 스키마 접근용 (SECURITY DEFINER)
- `trading.get_active_universe()` → 활성 watch_universe 목록 반환
- `trading.cleanup_old_data()` → ohlcv 1년, 공시 6개월, 재무 2년 초과 삭제
- `trading.classify_disclosure_type(text)` → 공시 보고서명 → 유형 자동 분류 (earnings/dividend/capital/buyback/ownership/etc)
- `trading.sync_to_public_stocks()` → trading.watch_universe + fundamentals → public.stocks 동기화
- `trading.sync_to_public_disclosures()` → trading.disclosures → public.disclosures 동기화 (stocks.code 매핑)
- `public.check_trading_pipeline()` → 전체 파이프라인 상태 JSON 반환 (검증용)

### strategies (전략 마스터)
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | bigserial PK | |
| name | text | 전략명 |
| version | text | 버전 (기본 '1.0') |
| strategy_type | text | factor/momentum/mean_reversion/ml/composite |
| params | jsonb | 팩터 가중치, 임계값, 지표 설정 |
| is_active | boolean | 동시에 1개만 TRUE |
| report_text | text? | 원본 보고서 텍스트 |
| UNIQUE | (name, version) | |

### analysis_runs (분석 실행 이력)
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | bigserial PK | |
| strategy_id | bigint FK → strategies | |
| status | text | started/success/failed |
| run_date | date | 분석 기준일 |
| stocks_analyzed | int | 분석 종목 수 |
| signals_generated | int | 시그널 생성 수 |

### strategy_signals (종목별 시그널)
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | bigserial PK | |
| run_id | bigint FK → analysis_runs | |
| strategy_id | bigint FK → strategies | |
| stock_code | text | 종목코드 |
| signal | text | strong_buy/buy/hold/sell/strong_sell |
| total_score | numeric(6,2) | 종합 점수 0~100 |
| score_detail | jsonb | 팩터별 점수 상세 |
| indicators | jsonb | 기술적 지표 스냅샷 |
| rank | int | 순위 |
| UNIQUE | (run_id, stock_code) | |

### RPC 함수 (전략/분석)
- `trading.activate_strategy(p_strategy_id bigint)` → 기존 활성 전략 비활성화 + 지정 전략 활성화
- `trading.get_active_strategy()` → 현재 활성 전략 JSON 반환
- `trading.get_latest_signals(p_strategy_id bigint?)` → 최신 분석 시그널 목록 (기본: 활성 전략)

### JOIN 키
- `public.stocks.code` = `trading.*.stock_code`
- `public.stocks.id` = `public.stock_scores.stock_id`
- `public.disclosures.id` = `public.llm_summaries.disclosure_id`
- `trading.strategies.id` = `trading.analysis_runs.strategy_id`
- `trading.analysis_runs.id` = `trading.strategy_signals.run_id`
