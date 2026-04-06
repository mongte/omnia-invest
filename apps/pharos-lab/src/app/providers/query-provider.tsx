'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

/** 비용 절감 최적화 기본값: staleTime 5분, gcTime 30분 */
const STALE_TIME = 5 * 60 * 1000;
const GC_TIME = 30 * 60 * 1000;

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // QueryClient를 useState로 생성해야 SSR 시 각 요청에 새 인스턴스가 생성됨
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: STALE_TIME,
            gcTime: GC_TIME,
            // 네트워크 에러 시 재시도 1회로 제한 (Supabase 호출 비용 절감)
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
