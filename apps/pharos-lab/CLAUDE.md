# Pharos Lab

퀀트 기반 투자 분석 플랫폼. Supabase DB → 대시보드 + 가상 투자 UI.

@AGENTS.md

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프레임워크 | Next.js 16 (App Router) + React 19 |
| 언어 | TypeScript strict (`any` 금지) |
| 스타일 | Tailwind CSS 4 + shadcn/ui (Radix) |
| 차트 | lightweight-charts (캔들), Recharts (레이더/라인/에어리어) |
| DB | Supabase (PostgreSQL) |
| 아이콘 | Lucide React |

## FSD 아키텍처

`app → views → widgets → features → entities → shared` (역방향 금지)

## Path Aliases

`@/app/*`, `@/views/*`, `@/widgets/*`, `@/features/*`, `@/entities/*`, `@/shared/*`

## 명령어

```bash
npm run dev          # localhost:3000
npm run build        # 프로덕션 빌드
npx tsc --noEmit     # 타입 체크
```

## 데이터 파이프라인

### 로컬 (launchd, 키움증권 API — IP 제한)
- **07:50 KST**: `daily_sync_kiwoom.py --job pre-market` — Top50 갱신 + 기본정보
- **16:30 KST**: `daily_sync_kiwoom.py --job post-market` — 일봉(ka10081) + 종가 업데이트

### Supabase (pg_cron, OpenDART — IP 제한 없음)
- **08:00 KST**: `daily-sync-opendart` Edge Function — 공시 수집 + 공시 분류 + public 동기화
- **매월 15일**: `monthly-financial-sync` — 분기 재무제표
- **일요일 0시**: `weekly-cleanup` — ohlcv 1년, 공시 6개월 초과 삭제

### 데이터 현황
- **trading.ohlcv_daily**: 50종목 × 1년치 ~8,000건 (롤링 윈도우, ~2.2MB)

## 현재 상태

- **1단계(데이터 수집) 완료** — trading 스키마에 실제 데이터 적재됨 (12,500건+)
- **public 동기화 완료** — trading → public.stocks(100건), public.disclosures(666건) 자동 동기화
- **Mock → 실제 DB 교체 필요** — views/widgets가 아직 `shared/lib/mock-data.ts` 참조 중
- 파이프라인 상세: `.claude/skills/trading-data-pipeline/SKILL.md` 참조
