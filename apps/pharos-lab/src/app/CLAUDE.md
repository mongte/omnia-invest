# app — Next.js 16 App Router

## 주의
**Next.js 16은 기존 버전과 다르다.** 코드 작성 전 반드시:
```
node_modules/next/dist/docs/
```
에서 관련 가이드를 확인할 것. deprecation notice 무시 금지.

## 라우팅 구조
```
app/
├── layout.tsx              ← 루트 레이아웃 (Geist 폰트, lang="ko")
├── page.tsx                ← 루트 페이지 (기본 템플릿)
├── globals.css
└── (shell)/
    ├── layout.tsx          ← 2컬럼 셸 (사이드바 + 메인)
    ├── dashboard/page.tsx  ← DashboardView 렌더링
    └── virtual-trading/page.tsx ← VirtualTradingView 렌더링
```

## 서버 vs 클라이언트
- `page.tsx` — 서버 컴포넌트 우선 (데이터 fetch 여기서)
- `layout.tsx` — 서버 컴포넌트
- views/widgets — 필요한 경우만 `'use client'`
