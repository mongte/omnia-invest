---
name: supabase-auth
description: 'Next.js App Router + Supabase Auth (Google OAuth, Email) 전체 구현. @supabase/ssr 기반 cookie 인증, 로그인 모달, 유저 메뉴, auth-gate 패턴 포함.'
version: 1.1.0
tags: [supabase, auth, next.js, google-oauth, email-login, zustand, shadcn]
triggers:
  - 로그인 기능 추가
  - 구글 로그인
  - 이메일 로그인
  - 소셜 로그인
  - Supabase Auth
  - 인증 구현
  - auth gate
---

# Supabase Auth for Next.js App Router

Next.js App Router + `@supabase/ssr` + Zustand + shadcn/ui 기반의 인증 시스템 구현 스킬.
Google OAuth + Email/Password 로그인을 모달 방식으로 제공하며, 기존 페이지 접근을 차단하지 않는 선택적 인증(auth-gate) 패턴을 사용한다.

## Use this skill when

- Next.js App Router 프로젝트에 Supabase Auth를 추가할 때
- Google OAuth + Email 로그인을 모달 방식으로 구현할 때
- 기존 페이지를 퍼블릭으로 유지하면서 특정 기능에만 로그인을 요구할 때
- FSD(Feature-Sliced Design) 아키텍처에서 인증 레이어를 구성할 때

## Do not use this skill when

- Supabase가 아닌 다른 인증 시스템(NextAuth, Clerk 등)을 사용할 때
- Pages Router 프로젝트일 때 (App Router 전용)
- 전체 앱이 인증 필수인 경우 (middleware에서 redirect하는 방식이 더 적합)

## Core Rules

1. **싱글턴 + noopLock**: 브라우저 auth 클라이언트는 싱글턴 필수. Navigator Lock `steal: true` 경합 에러 방지를 위해 `noopLock` 옵션 함께 적용
2. **fetchProfile에는 일반 클라이언트 사용**: auth 클라이언트(`createSupabaseBrowser`)로 DB 쿼리하면 내부 lock/초기화 대기로 무한 hang. 반드시 일반 `createClient`로 만든 클라이언트 사용
3. **기존 클라이언트 유지**: 데이터 페칭용 기존 Supabase 클라이언트는 수정하지 않음. Auth 전용 클라이언트를 별도 생성
3. **서버 컴포넌트에서 barrel import 금지**: `'use client'` 훅이 포함된 barrel을 서버 컴포넌트에서 import하면 빌드 에러. 직접 경로 import 사용
4. **Next.js 14+ cookies() async**: `cookies()`는 async 함수. 반드시 `await cookies()` 사용
5. **Middleware는 세션 갱신 전용**: 라우트 차단하지 않음. `getUser()`로 세션 refresh만 수행

## Architecture

```
FSD Layer           Files
─────────────────────────────────────────────
shared/api/         supabase-browser.ts (싱글턴, cookie-aware)
                    supabase-auth-server.ts (서버용, cookie-aware)
entities/user/      types.ts (UserProfile)
                    model/auth-store.ts (Zustand)
                    model/login-modal-store.ts (Zustand)
features/auth/      ui/auth-provider.tsx (세션 동기화)
                    ui/login-modal.tsx (Google + Email 모달)
                    ui/user-menu.tsx (아바타 드롭다운)
                    lib/use-auth-gate.ts (보호된 네비게이션)
app/                middleware.ts (세션 갱신)
                    auth/callback/route.ts (OAuth 콜백)
```

## Instructions

### Step 1: 의존성 설치
```bash
npm install @supabase/ssr zustand @radix-ui/react-dropdown-menu @radix-ui/react-avatar
```

shadcn/ui 컴포넌트 필요: `dialog`, `dropdown-menu`, `avatar`, `button`, `input`, `separator`

### Step 2: DB 마이그레이션
`resources/migration.sql`의 profiles 테이블 + RLS + 트리거를 적용한다.

### Step 3: 코드 생성
`resources/templates.md`의 템플릿을 프로젝트 구조에 맞게 적용한다. 순서:
1. `shared/api/` — Supabase 클라이언트 2개
2. `middleware.ts` — 세션 갱신
3. `auth/callback/route.ts` — OAuth 콜백
4. `entities/user/` — 타입 + Zustand 스토어 2개
5. `features/auth/` — AuthProvider, LoginModal, UserMenu, useAuthGate
6. Root Layout에 `<AuthProvider>` + `<LoginModal />` 래핑

### Step 4: Supabase Dashboard 설정
- Authentication > Providers > Google 활성화 (Client ID/Secret 필요)
- Authentication > URL Configuration > Redirect URLs에 `http://localhost:3000/auth/callback` 추가

### Step 5: 검증
- 비로그인 상태에서 기존 페이지 접근 가능 확인
- Google 로그인 → 프로필 자동 생성 → 아바타 표시
- Email 회원가입/로그인 → 정상 동작
- 로그아웃 → 즉시 UI 전환
- auth-gate 메뉴 → 비로그인 시 모달, 로그인 시 네비게이션

## Known Issues & Solutions

| 문제 | 원인 | 해결 |
|------|------|------|
| `NavigatorLockAcquireTimeoutError` / `Lock was released` | GoTrueClient가 `steal: true`로 Navigator Lock 경합 | `noopLock` 옵션으로 Navigator Lock 비활성화 |
| `isLoading` 무한 `true` — DB 쿼리 hang | auth 클라이언트(`createSupabaseBrowser`)로 DB 쿼리 시 내부 lock/초기화 대기 | `fetchProfile`에서 일반 `createClient` 사용 |
| `isLoading` 무한 `true` — 에러 미처리 | `fetchProfile` 에러 시 `setAuth`/`clear` 미호출 | try/catch로 에러 시 `setAuth(user, null)` 호출 |
| `useRouter` Server Component 에러 | barrel export에서 클라이언트 훅 포함 | 직접 경로 import 사용 |
| `cookies()` is not a function | Next.js 14+에서 async로 변경 | `await cookies()` 사용 |
| 로그아웃 후 UI 미갱신 | onAuthStateChange 타이밍 이슈 | signOut 직후 `clear()` 명시 호출 |

## Resources

- `resources/migration.sql` — profiles 테이블 DDL + RLS + 트리거
- `resources/templates.md` — 전체 코드 템플릿 (복사-붙여넣기 가능)
