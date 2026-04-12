'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const supabase = createSupabaseBrowser();
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createSupabaseBrowser();

    try {
      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
        });
        if (err) throw err;
      }
      close();
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : '오류가 발생했습니다.';
      setError(message);
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
          <DialogTitle>
            {mode === 'login' ? '로그인' : '회원가입'}
          </DialogTitle>
          <DialogDescription>
            Pharos Lab에 오신 것을 환영합니다
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* Google 로그인 */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            loading={isGoogleLoading}
            disabled={isLoading || isGoogleLoading}
          >
            {!isGoogleLoading && <Globe className="mr-2 size-4" />}
            Google로 계속하기
          </Button>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">또는</span>
            <Separator className="flex-1" />
          </div>

          {/* Email 로그인/회원가입 폼 */}
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
            <Input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
              minLength={6}
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              disabled={isLoading || isGoogleLoading}
            >
              {!isLoading && <Mail className="mr-2 size-4" />}
              {mode === 'login' ? '이메일로 로그인' : '이메일로 회원가입'}
            </Button>
          </form>

          {/* 모드 전환 */}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError(null);
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
          >
            {mode === 'login'
              ? '계정이 없으신가요? 회원가입'
              : '이미 계정이 있으신가요? 로그인'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
