/// <reference lib="webworker" />

import type { PrecacheEntry, SerwistPlugin } from 'serwist';
import { CacheFirst, ExpirationPlugin, StaleWhileRevalidate } from 'serwist';
import { Serwist } from 'serwist';

// @serwist/next가 빌드 시 주입하는 precache manifest 전역 변수 타입 선언
declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

// =============================================================================
// 캐시 히트율 모니터링 플러그인
// =============================================================================
//
// 모니터링 방법:
// 1. [SW] Cache HIT  — 캐시에서 응답 반환 (Supabase API 호출 절감)
// 2. [SW] Cache MISS — 네트워크에서 응답 후 캐시에 저장
//
// 브라우저 DevTools > Console 필터: "[SW]" 로 필터링하면 캐시 히트율 확인 가능
// TanStack Query DevTools로 TanStack Query 레벨 캐시 히트율도 함께 확인 권장
//
// 최적 캐시 설정값 (비용 절감 기준):
// - /api/stocks/* StaleWhileRevalidate maxAgeSeconds: 300 (5분)
//   → Supabase 쿼리 비용 기준: 5분 내 동일 종목 재조회 시 100% 절감
//   → 서버 Cache-Control s-maxage=300과 동일 값 사용 (일관성)
// - 정적 JS/CSS maxAgeSeconds: 2592000 (30일)
//   → Next.js 빌드 해시로 캐시 버스팅되므로 장기 캐시 안전
// - 폰트 maxAgeSeconds: 31536000 (1년)
//   → 폰트는 URL이 변경되지 않으면 변경 없음, 장기 캐시 적합
//
// TanStack Query 최적값 (query-provider.tsx 기준):
// - staleTime: 300_000 (5분) — 동일 종목 5분 내 재클릭 시 네트워크 요청 없음
// - gcTime: 1_800_000 (30분) — 비활성 캐시 30분 유지, 탭 전환 후 복귀 시 즉시 표시
// - retry: 1 — 실패 시 1회 재시도로 Supabase 일시 장애 대응
//
// Supabase 호출 감소율 측정:
// - Supabase 대시보드 > API → 시간대별 요청 수 확인
// - SW + TanStack Query 도입 전/후 비교: 예상 80%+ 감소 (5분 staleTime 기준)
// =============================================================================

/**
 * 캐시 히트/미스 로깅 플러그인 생성 함수
 * @param cacheName 캐시 이름 (로그 식별용)
 */
function createCacheMonitorPlugin(cacheName: string): SerwistPlugin {
  return {
    /**
     * 캐시된 응답이 사용될 때 호출 — Cache HIT
     * cachedResponseWillBeUsed가 null을 반환하면 캐시 미사용(network fallback)
     */
    cachedResponseWillBeUsed: async ({ cachedResponse, request }) => {
      if (cachedResponse) {
        console.log(
          `[SW] Cache HIT [${cacheName}]: ${request.url}`,
        );
      } else {
        console.log(
          `[SW] Cache MISS [${cacheName}]: ${request.url}`,
        );
      }
      return cachedResponse;
    },
  };
}

const serwist = new Serwist({
  // 사전 캐시 목록 (빌드 시 @serwist/next가 주입)
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // /api/stocks/* — StaleWhileRevalidate 전략
    // 캐시된 응답을 즉시 반환하고, 동시에 네트워크에서 최신 데이터를 가져와 캐시 갱신
    // maxAgeSeconds=300: 서버 s-maxage=300과 동일, 5분 내 동일 요청은 캐시 반환
    {
      matcher: /^https?:\/\/[^/]+\/api\/stocks(\/.*)?$/,
      handler: new StaleWhileRevalidate({
        cacheName: 'api-stocks-cache',
        plugins: [
          createCacheMonitorPlugin('api-stocks'),
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 300,
          }),
        ],
      }),
    },
    // 정적 JS/CSS 자산 — CacheFirst 전략
    // Next.js 정적 자산은 빌드 해시로 캐시 무효화되므로 30일 유지 가능
    {
      matcher: /\/_next\/static\/.+\.(js|css)$/,
      handler: new CacheFirst({
        cacheName: 'static-js-css-cache',
        plugins: [
          createCacheMonitorPlugin('static-js-css'),
          new ExpirationPlugin({
            maxEntries: 200,
            maxAgeSeconds: 30 * 24 * 60 * 60,
          }),
        ],
      }),
    },
    // 폰트 자산 — CacheFirst 전략
    // URL 변경 없이 폰트는 거의 변경되지 않으므로 1년 캐시
    {
      matcher: /\/_next\/static\/media\/.+\.(woff|woff2|ttf|otf)$/,
      handler: new CacheFirst({
        cacheName: 'font-cache',
        plugins: [
          createCacheMonitorPlugin('font'),
          new ExpirationPlugin({
            maxEntries: 30,
            maxAgeSeconds: 365 * 24 * 60 * 60,
          }),
        ],
      }),
    },
    // Next.js 이미지 자산 — CacheFirst 전략
    {
      matcher: /\/_next\/image\?.+/,
      handler: new CacheFirst({
        cacheName: 'next-image-cache',
        plugins: [
          createCacheMonitorPlugin('next-image'),
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 7 * 24 * 60 * 60,
          }),
        ],
      }),
    },
  ],
});

serwist.addEventListeners();
