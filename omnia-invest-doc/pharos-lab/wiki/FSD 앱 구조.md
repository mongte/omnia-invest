---
title: FSD 앱 구조
tags: [pharos-lab, fsd, architecture]
status: done
updated: 2026-07-30
---

# FSD 앱 구조

> Feature-Sliced Design 기반 레이어. 상위 → 하위 import만 허용. 코드 위치·소유권의 단일 기준.

## 레이어 스택

```
app → views → widgets → features → entities → shared
```

역방향 import 금지. **같은 레이어 간 cross-import도 금지.**

| 레이어 | 책임 | 가질 수 있는 것 |
|--------|------|----------------|
| `app/` | Next.js 진입점, 전역 providers | layout, page, route handler, middleware |
| `views/` | 페이지별 데이터 조합 | TanStack Query hook, widgets에 props |
| `widgets/` | 독립 UI 블록 | props 기반 렌더링, 로컬 상태만 |
| `features/` | 사용자 인터랙션 비즈니스 로직 | use-* hook, ui, Zustand action |
| `entities/` | 도메인 모델 | 타입, 상수, 엔티티 API |
| `shared/` | 재사용 인프라 | UI, 유틸, Supabase 클라이언트, 타입 |

## Path alias

```
@/app/*       → src/app/
@/views/*     → src/views/
@/widgets/*   → src/widgets/
@/features/*  → src/features/
@/entities/*  → src/entities/
@/shared/*    → src/shared/
```

## 실제 슬라이스 (조사)

### entities
- `stock` — 종목 타입
- `user` — auth/login-modal store, 유저 타입

### features
- `auth` — AuthProvider, LoginModal, UserMenu, `use-auth-gate`
- `favorites` — 관심 종목 hooks
- `holdings` — 보유 종목 + decision algorithm
- `virtual-trading` — 포트폴리오/주문/포지션/자산곡선/자동규칙 hooks

### widgets
- `app-shell` — 헤더, 사이드바, 모바일 내비
- `dashboard` — price-chart, score-radar, ranking-list/chart, disclosure-timeline, llm-summary
- `virtual-trading` — account/portfolio/trade/ai-signals/auto-trade-rules/equity
- `my-stocks` — holdings table, add form, detail panel, portfolio summary
- `landing` — hero, features, preview, stats, CTA, nav, footer

### views
- `dashboard`, `virtual-trading`, `my-stocks`, `landing`

### shared/api (핵심)
- Supabase: `supabase.ts`, `supabase-server.ts`, `supabase-browser.ts`, `supabase-auth-server.ts`
- 도메인 API: dashboard, holdings, favorites, virtual-*, auto-trade-rules, ranking-utils

## BE vs FE 소유권

| BE | FE |
|----|-----|
| `shared/api/`, `entities/*/types.ts`, `entities/*/api/`, `app/api/`, `features/*/api/`, `features/*/model/` | `views/`, `widgets/`, `shared/ui/`, `app/(shell)/`, `features/*/ui/` |

공유: `entities/*/types.ts`는 BE 생성·FE import만. `features/*/lib/`, `shared/lib/`는 생성자 소유.

## 올바른 데이터 흐름

```
[app/(shell)/dashboard/page.tsx]
  └─ [views/dashboard/dashboard-view.tsx]  ← Query hook
       └─ [widgets/dashboard/price-chart.tsx]  ← props
            └─ [shared/ui/charts/candlestick-chart.tsx]
```

## 금지 패턴

- `entities` → `features` / `widgets` / `views`
- `shared` → `entities` 이상
- `widgets` → `views`
- 동일 레이어 슬라이스 간 import

검사: `bash scripts/check-fsd-deps.sh` (모노레포 루트)

## 관련

- [[제품 개요와 스택]]
- [[데이터 파이프라인과 Supabase]]
- [[투자 도메인 규칙]]
- [[인덱스 (MOC)]]
