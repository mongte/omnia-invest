---
name: pharos-domain
description: pharos-lab 투자 도메인 규칙 적용 스킬. 투자 권유 금지, 면책 문구 위치, 랭킹 명칭, Supabase 스키마 핵심 테이블, 데이터 파이프라인 현황을 다룹니다. pharos-lab 기능 구현·리뷰·QA 검증 시 반드시 이 스킬 사용할 것.
---

# Pharos Lab 투자 도메인 규칙

## 투자 정보 제공 원칙

pharos-lab은 **투자 참고 정보 플랫폼**이다. 특정 종목 매수·매도를 권유하지 않는다.

### 금지 표현 (코드·UI 텍스트 모두 포함)

| 금지 | 대체 표현 |
|------|----------|
| 매수 유리 | 긍정적 신호 |
| 매수 추천 | 참고 지표 |
| 매수 권유 | 중립 표현 사용 |
| 투자 추천 | 데이터 기반 분석 |
| 종목 추천 랭킹 | 데일리 추천 랭킹 (이 명칭만 사용) |

### 면책 문구 위치 (반드시 유지)

```
본 서비스는 투자 참고 정보를 제공하며, 특정 종목의 매수·매도를 권유하지 않습니다.
투자 판단과 그에 따른 책임은 이용자 본인에게 있습니다.
```

배치 위치:
- **대시보드 하단**: `widgets/dashboard/` 섹션 하단
- **랜딩 footer**: `widgets/landing/landing-footer.tsx`
- **랭킹 tooltip**: 랭킹 리스트 컴포넌트의 tooltip

## Supabase 스키마 핵심 테이블

### public 스키마 (앱 직접 접근)

| 테이블 | 주요 컬럼 | 용도 |
|--------|----------|------|
| `stocks` | id, name, ticker, sector, market_cap, quant_score | 종목 기본정보 + 퀀트 점수 |
| `disclosures` | id, stock_id, title, type, importance, disclosure_date | 공시 정보 |
| `auto_trade_rules` | id, user_id, stock_id, rule_type, quantity, trigger_price, trigger_signal, status | 자동 매매 규칙 |
| `virtual_positions` | id, user_id, stock_id, quantity, avg_price | 가상 보유 포지션 |
| `virtual_orders` | id, user_id, stock_id, order_type, quantity, price, status | 가상 주문 이력 |
| `virtual_equity` | id, user_id, date, equity_value | 가상 투자 자산 이력 |
| `holdings` | id, user_id, stock_id, quantity, avg_price | 실제 보유 종목 |
| `favorites` | id, user_id, stock_id | 관심 종목 |
| `llm_summaries` | id, stock_id, content, created_at | LLM 분석 요약 |

### 타입 참조

```typescript
import type { Database } from '@/shared/types/supabase';
type Stock = Database['public']['Tables']['stocks']['Row'];
type AutoTradeRule = Database['public']['Tables']['auto_trade_rules']['Row'];
```

## Supabase 클라이언트 파일

```
src/shared/api/supabase.ts            ← 공통 타입 export
src/shared/api/supabase-server.ts     ← Server Component용 (cookies)
src/shared/api/supabase-browser.ts    ← Client Component용
src/shared/api/supabase-auth-server.ts ← Auth 미들웨어용
```

## 기존 API 파일 현황

| 파일 | 담당 데이터 |
|------|-----------|
| `shared/api/dashboard.ts` | 대시보드 서버 데이터 |
| `shared/api/dashboard-client.ts` | 대시보드 클라이언트 데이터 |
| `shared/api/holdings.ts` | 보유 종목 CRUD |
| `shared/api/favorites.ts` | 관심 종목 CRUD |
| `shared/api/virtual-orders.ts` | 가상 주문 |
| `shared/api/virtual-positions.ts` | 가상 포지션 |
| `shared/api/virtual-portfolio.ts` | 가상 포트폴리오 요약 |
| `shared/api/virtual-equity.ts` | 자산 이력 |
| `shared/api/auto-trade-rules.ts` | 자동 매매 규칙 |
| `shared/api/ranking-utils.ts` | 랭킹 계산 유틸 |

## 데이터 파이프라인 현황

### 로컬 파이프라인 (키움증권 API, IP 제한)
- **07:50 KST**: pre-market — Top50 갱신 + 기본정보
- **16:30 KST**: post-market — 일봉 + 종가 업데이트

### Supabase 파이프라인 (pg_cron + OpenDART)
- **08:00 KST**: 공시 수집 + 공시 분류 + public 동기화
- **매월 15일**: 분기 재무제표 동기화
- **일요일 0시**: 정리 작업 (ohlcv 1년, 공시 6개월 초과 삭제)

### 현재 데이터 상태
- `trading.ohlcv_daily`: 50종목 × 1년치 약 8,000건
- `public.stocks`: 100건 동기화
- `public.disclosures`: 666건 동기화
- **주의**: 일부 views/widgets가 아직 `mock-data.ts` 참조 중 → 발견 시 실 API로 교체

## 주요 도메인 로직

### 퀀트 점수 (`quant_score`)
stocks 테이블의 `quant_score` 컬럼. 0~100 점수 범위. "데일리 추천 랭킹" 정렬 기준.

### 가상 투자 흐름
`virtual_orders` 주문 생성 → `virtual_positions` 포지션 업데이트 → `virtual_equity` 일일 자산 기록

### Auth Gate 패턴
보호된 기능(가상 투자, 보유 종목, 자동 매매 규칙)은 `features/auth/lib/use-auth-gate.ts` 사용.
