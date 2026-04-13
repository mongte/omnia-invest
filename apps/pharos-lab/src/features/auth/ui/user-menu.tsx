'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const PROTECTED_ROUTES = ['/my-stocks', '/virtual-trading'];
import { LogOut, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { createSupabaseBrowser } from '@/shared/api/supabase-browser';
import { useAuthStore, useLoginModalStore } from '@/entities/user';

export function UserMenu() {
  const { user, profile, isLoading } = useAuthStore();
  const { open: openLoginModal } = useLoginModalStore();
  const router = useRouter();
  const pathname = usePathname();
  const { clear } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createSupabaseBrowser();
      await supabase.auth.signOut();
      clear();
      const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
      if (isProtected) {
        router.push('/');
      } else {
        router.refresh();
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="inline-flex items-center justify-center rounded-full size-8 bg-secondary animate-pulse" />
    );
  }

  if (!user) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => openLoginModal()}
        className="text-sm"
      >
        로그인
      </Button>
    );
  }

  const displayName = profile?.displayName ?? user.email ?? '사용자';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full size-8 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="사용자 메뉴"
        >
          <Avatar className="size-8">
            {profile?.avatarUrl && (
              <AvatarImage src={profile.avatarUrl} alt={displayName} />
            )}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            {user.email && (
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="cursor-pointer"
        >
          {isLoggingOut
            ? <Loader2 className="mr-2 size-4 animate-spin" />
            : <LogOut className="mr-2 size-4" />
          }
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
