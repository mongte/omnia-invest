---
name: pharos-fsd
description: pharos-lab FSD(Feature-Sliced Design) 아키텍처 규칙 적용 스킬. 레이어별 파일 소유권, import 방향 규칙, path alias, 위반 패턴 감지를 처리할 때 반드시 이 스킬 사용. pharos-lab 코드 작성, 리뷰, 위반 검사 시 항상 로드할 것.
---

# Pharos Lab FSD 아키텍처

## 레이어 계층 (상위 → 하위)

```
app → views → widgets → features → entities → shared
```

역방향 import는 절대 금지. 같은 레이어 간 cross-import도 금지.

## Path Alias

```typescript
@/app/*       → src/app/
@/views/*     → src/views/
@/widgets/*   → src/widgets/
@/features/*  → src/features/
@/entities/*  → src/entities/
@/shared/*    → src/shared/
```

## 영역별 소유권 (BE vs FE)

### BE 담당 영역

```
src/shared/api/          ← Supabase 페칭 함수
src/entities/*/types.ts  ← 도메인 타입 (FE는 import만)
src/entities/*/api/      ← 엔티티별 API
src/app/api/             ← Route Handler
src/features/*/api/      ← 기능별 API
src/features/*/model/    ← Zustand store
```

### FE 담당 영역

```
src/views/               ← 페이지 뷰 (데이터 wiring)
src/widgets/             ← UI 위젯 (props 기반)
src/shared/ui/           ← shadcn/ui 컴포넌트 래퍼
src/app/(shell)/         ← 레이아웃, 페이지 서버 컴포넌트
src/features/*/ui/       ← 기능별 UI
```

### 공유 영역 규칙

- `entities/*/types.ts`: BE 생성, FE import만
- `features/*/lib/`: 생성자 소유 (use-* hooks는 해당 feature 담당자)
- `shared/lib/`: 생성자 소유

## 레이어별 책임

| 레이어 | 책임 | 가질 수 있는 것 |
|--------|------|----------------|
| `app/` | Next.js 진입점, 전역 providers | layout, page, route handler, middleware |
| `views/` | 페이지별 데이터 조합 | TanStack Query hook 호출, widgets에 props 전달 |
| `widgets/` | 독립적 UI 블록 | props 기반 렌더링, 자체 로컬 상태만 허용 |
| `features/` | 사용자 인터랙션 비즈니스 로직 | use-* hook, ui 컴포넌트, Zustand action |
| `entities/` | 도메인 모델 | 타입, 상수, API 함수 |
| `shared/` | 재사용 인프라 | UI 컴포넌트, 유틸, API 클라이언트, 타입 |

## 금지 패턴 (위반 예시)

```typescript
// FORBIDDEN: entities → features
// src/entities/stock/types.ts
import { useFavorites } from '@/features/favorites';  // X

// FORBIDDEN: shared → entities
// src/shared/lib/utils.ts
import { StockType } from '@/entities/stock';  // X

// FORBIDDEN: widgets → views
// src/widgets/dashboard/price-chart.tsx
import { DashboardView } from '@/views/dashboard';  // X

// FORBIDDEN: 동일 레이어 cross-import
// src/widgets/dashboard/price-chart.tsx
import { PortfolioSummary } from '@/widgets/virtual-trading';  // X (동일 레이어)
```

## 올바른 데이터 흐름

```
[app/page.tsx]
  └─ [views/dashboard-view.tsx]  ← useQuery hook 호출
       └─ [widgets/price-chart.tsx]  ← data props 수신
            └─ [shared/ui/charts/candlestick-chart.tsx]  ← 순수 UI
```

## 위반 감지 명령

```bash
# entities → features 위반
grep -r "from.*@/features" apps/pharos-lab/src/entities/ --include="*.ts" --include="*.tsx"

# shared → entities 위반
grep -r "from.*@/entities" apps/pharos-lab/src/shared/ --include="*.ts" --include="*.tsx"

# 전체 import 방향 역전 검사
grep -rn "from.*@/" apps/pharos-lab/src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
```

## Mock 데이터 현황

현재 일부 views/widgets가 `@/shared/lib/mock-data`를 참조하고 있다.  
신규 코드에서는 반드시 실 Supabase API 함수 사용. 기존 mock 참조 발견 시 교체 대상으로 표시.
