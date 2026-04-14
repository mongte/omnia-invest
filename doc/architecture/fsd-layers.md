# FSD 레이어 아키텍처

Feature-Sliced Design 패턴 기반. 상위 → 하위 방향 의존만 허용.

## 레이어 스택

```
app         최상위: Next.js App Router, 전역 providers, 라우팅
views       페이지 단위 컴포넌트 (route segments)
widgets     독립 UI 블록 (여러 features 조합)
features    사용자 인터랙션 단위 (use case)
entities    도메인 모델 (주식, 사용자, 포트폴리오)
shared      공용 유틸, UI 프리미티브, 타입
```

## 허용/금지 규칙

```
✅ app     → views, widgets, features, entities, shared
✅ views   → widgets, features, entities, shared
✅ widgets → features, entities, shared
✅ features → entities, shared
✅ entities → shared
✅ shared   → (외부 라이브러리만)

❌ entities → features, widgets, views
❌ shared   → entities, features, widgets, views
❌ features → widgets, views
```

## 폴더 구조 (pharos-lab)

```
apps/pharos-lab/src/
├── app/                # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   └── (routes)/
├── views/              # 페이지 레벨 컴포넌트
├── widgets/            # 독립 UI 블록
├── features/           # 기능 단위
│   ├── stock-analysis/
│   ├── portfolio/
│   └── watchlist/
├── entities/           # 도메인 모델
│   ├── stock/
│   └── user/
└── shared/             # 공용
    ├── ui/             # shadcn/ui 래퍼
    ├── lib/            # 유틸리티
    ├── types/          # 공용 타입
    └── api/            # API 클라이언트
```

## 검사 방법

```bash
bash scripts/check-fsd-deps.sh
```

위반 시 에러 메시지에 수정 방법이 포함됩니다.

## 위반 해결 패턴

entities에서 features 기능이 필요할 때:
```typescript
// ❌ 금지
import { useFeatureX } from '@/features/x'

// ✅ 이벤트 버스 패턴
// entities는 이벤트를 발행, features가 구독
```
