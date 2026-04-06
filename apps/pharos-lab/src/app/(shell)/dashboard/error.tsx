'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[DashboardPage] 서버 데이터 로드 실패:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 text-center px-4">
      <div className="size-14 rounded-full bg-destructive/10 flex items-center justify-center">
        <svg
          className="size-7 text-destructive"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">
          대시보드를 불러올 수 없습니다
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          데이터베이스 연결에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        다시 시도
      </button>
    </div>
  );
}
