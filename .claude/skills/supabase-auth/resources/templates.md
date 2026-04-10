# Supabase Auth 코드 템플릿

프로젝트 path alias에 맞게 import 경로를 조정할 것. 아래는 `@/shared/*`, `@/entities/*`, `@/features/*` 기준.

## 환경 변수

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

---

## 1. shared/api/supabase-browser.ts

브라우저 전용 cookie-aware 클라이언트. **싱글턴 + noopLock** 필수.
- 싱글턴: 다중 인스턴스 방지
- noopLock: GoTrueClient의 Navigator Lock `steal: true` 경합 에러(`NavigatorLockAcquireTimeoutError`) 방지

```typescript
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/shared/types/supabase';

// GoTrueClient가 Navigator Lock을 steal: true로 요청하면서 경합 에러 발생.
// 싱글턴이므로 인스턴스 경합은 없음 — lock을 no-op으로 대체하여 에러 억제.
function noopLock(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<unknown>,
): Promise<unknown> {
  return fn();
}

type SupabaseBrowserClient = ReturnType<typeof createBrowserClient<Database>>;

let client: SupabaseBrowserClient | null = null;

export function createSupabaseBrowser(): SupabaseBrowserClient {
  if (client) return client;
  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        lock: noopLock,
      },
    },
  );
  return client;
}
```

---

## 2. shared/api/supabase-auth-server.ts

서버 전용 cookie-aware 클라이언트. RSC, Route Handler, Server Action에서 사용.

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/shared/types/supabase';

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function createSupabaseAuthServer() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}
```

---

## 3. middleware.ts (app root)

세션 갱신 전용. 라우트를 차단하지 않는다.

```typescript
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

---

## 4. app/auth/callback/route.ts

OAuth PKCE 콜백. code를 세션으로 교환 후 redirect.

```typescript
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard'; // 로그인 후 이동할 경로

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: CookieToSet[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return response;
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
```

---

## 5. entities/user/types.ts

```typescript
export interface UserProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}
```

---

## 6. entities/user/model/auth-store.ts

```typescript
import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '../types';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  setAuth: (user: User | null, profile: UserProfile | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  setAuth: (user, profile) => set({ user, profile, isLoading: false }),
  clear: () => set({ user: null, profile: null, isLoading: false }),
}));
```

---

## 7. entities/user/model/login-modal-store.ts

```typescript
import { create } from 'zustand';

interface LoginModalState {
  isOpen: boolean;
  redirectTo: string | null;
  open: (redirectTo?: string) => void;
  close: () => void;
}

export const useLoginModalStore = create<LoginModalState>((set) => ({
  isOpen: false,
  redirectTo: null,
  open: (redirectTo) => set({ isOpen: true, redirectTo: redirectTo ?? null }),
  close: () => set({ isOpen: false, redirectTo: null }),
}));
```

---

## 8. features/auth/ui/auth-provider.tsx

Supabase 세션을 Zustand 스토어에 동기화하는 래퍼 컴포넌트.

**핵심 주의사항:**
- `fetchProfile`에서 반드시 일반 `createClient` 클라이언트 사용. auth 클라이언트(`createSupabaseBrowser`)로 DB 쿼리하면 내부 lock/초기화 대기로 무한 hang 발생
- `fetchProfile`에 try/catch 필수. 에러 시 `setAuth(user, null)` 호출하여 `isLoading: false` 보장
- `onAuthStateChange` 단독으로 INITIAL_SESSION + 이후 이벤트 모두 처리. 별도 `getUser()` 병행 호출 불필요

```typescript
'use client';

import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js'; // 일반 클라이언트 (data-fetching용)
import { createSupabaseBrowser } from '@/shared/api/supabase-browser';
import { useAuthStore } from '@/entities/user';
import type { UserProfile } from '@/entities/user';
import type { Database } from '@/shared/types/supabase';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// 프로젝트에 기존 data-fetching 클라이언트가 있으면 그것을 import.
// 없으면 아래처럼 별도 생성. auth 클라이언트와 반드시 분리해야 함.
const dataClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AuthProviderProps {
  children: React.ReactNode;
}

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const response = await dataClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  const data = response.data as ProfileRow | null;
  if (!data) return null;
  return {
    id: data.id,
    email: data.email ?? null,
    displayName: data.display_name ?? null,
    avatarUrl: data.avatar_url ?? null,
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setAuth, clear } = useAuthStore();

  useEffect(() => {
    const supabase = createSupabaseBrowser();

    // onAuthStateChange만으로 INITIAL_SESSION + 이후 변경 모두 처리.
    // fetchProfile 실패해도 setAuth(user, null)로 isLoading: false 보장.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        try {
          const profile = await fetchProfile(session.user.id);
          setAuth(session.user, profile);
        } catch {
          setAuth(session.user, null);
        }
      } else {
        clear();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setAuth, clear]);

  return <>{children}</>;
}
```

---

## 9. features/auth/ui/login-modal.tsx

Google + Email 로그인/회원가입 모달.
shadcn/ui 컴포넌트 필요: `Dialog`, `Button`, `Input`, `Separator`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, Mail, Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Separator } from '@/shared/ui/separator';
import { createSupabaseBrowser } from '@/shared/api/supabase-browser';
import { useLoginModalStore } from '@/entities/user';

type AuthMode = 'login' | 'signup';

export function LoginModal() {
  const { isOpen, close } = useLoginModalStore();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const supabase = createSupabaseBrowser();

    try {
      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
      }
      close();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      close();
      setEmail('');
      setPassword('');
      setError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{mode === 'login' ? '로그인' : '회원가입'}</DialogTitle>
          <DialogDescription>계정에 로그인하세요</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-2">
          <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
            <Globe className="mr-2 size-4" />
            Google로 계속하기
          </Button>
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">또는</span>
            <Separator className="flex-1" />
          </div>
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
            <Input type="email" placeholder="이메일" value={email}
              onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            <Input type="password" placeholder="비밀번호" value={password}
              onChange={(e) => setPassword(e.target.value)} required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Mail className="mr-2 size-4" />}
              {mode === 'login' ? '이메일로 로그인' : '이메일로 회원가입'}
            </Button>
          </form>
          <button type="button"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center">
            {mode === 'login' ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 10. features/auth/ui/user-menu.tsx

아바타 드롭다운 (로그인) / 로그인 버튼 (비로그인).
shadcn/ui 컴포넌트 필요: `DropdownMenu`, `Avatar`, `Button`

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { createSupabaseBrowser } from '@/shared/api/supabase-browser';
import { useAuthStore, useLoginModalStore } from '@/entities/user';

export function UserMenu() {
  const { user, profile, isLoading, clear } = useAuthStore();
  const { open: openLoginModal } = useLoginModalStore();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    clear();
    router.refresh();
  };

  if (isLoading) {
    return <div className="inline-flex items-center justify-center rounded-full size-8 bg-secondary animate-pulse" />;
  }

  if (!user) {
    return (
      <Button variant="ghost" size="sm" onClick={() => openLoginModal()} className="text-sm">
        로그인
      </Button>
    );
  }

  const displayName = profile?.displayName ?? user.email ?? '사용자';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button"
          className="inline-flex items-center justify-center rounded-full size-8 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="사용자 메뉴">
          <Avatar className="size-8">
            {profile?.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={displayName} />}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            {user.email && <p className="text-xs leading-none text-muted-foreground">{user.email}</p>}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 size-4" />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## 11. features/auth/lib/use-auth-gate.ts

특정 메뉴를 로그인 사용자만 접근하도록 보호하는 훅.

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore, useLoginModalStore } from '@/entities/user';

export function useAuthGate() {
  const { user } = useAuthStore();
  const { open: openLoginModal } = useLoginModalStore();
  const router = useRouter();

  const guardedNavigate = (href: string) => {
    if (user) {
      router.push(href);
    } else {
      openLoginModal(href);
    }
  };

  return { guardedNavigate, isAuthenticated: !!user };
}
```

---

## 12. Root Layout 래핑

```tsx
// app/layout.tsx (서버 컴포넌트)
// 주의: barrel(@/features/auth)이 아닌 직접 경로 import
import { AuthProvider } from '@/features/auth/ui/auth-provider';
import { LoginModal } from '@/features/auth/ui/login-modal';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          {children}
          <LoginModal />
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

## 13. Auth-Gate 네비게이션 사용 예시

```tsx
'use client';

import { useAuthGate } from '@/features/auth/lib/use-auth-gate';

export function MyNavItem() {
  const { guardedNavigate } = useAuthGate();

  return (
    <button onClick={() => guardedNavigate('/my-page')}>
      내 페이지
    </button>
  );
}
```
