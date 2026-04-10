'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AppSidebar } from './app-sidebar';
import { useAuthGate } from '@/features/auth/lib/use-auth-gate';

const STORAGE_KEY = 'sidebar-collapsed';

export function SidebarWithPathname() {
  const pathname = usePathname();
  // SSR hydration mismatch 방지: 초기값은 false(펼침)로 고정
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { guardedNavigate } = useAuthGate();

  // 마운트 후 localStorage에서 저장된 상태 반영
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setIsCollapsed(stored === 'true');
      }
    } catch {
      // localStorage 접근 실패 시 기본값(false) 유지
    }
  }, []);

  const handleToggle = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // localStorage 쓰기 실패 시 무시
      }
      return next;
    });
  };

  return (
    <AppSidebar
      pathname={pathname}
      isCollapsed={isCollapsed}
      onToggle={handleToggle}
      onAuthGatedClick={guardedNavigate}
    />
  );
}
