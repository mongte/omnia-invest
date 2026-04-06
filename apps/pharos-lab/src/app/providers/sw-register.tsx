'use client';

import { useEffect } from 'react';

/**
 * Service Worker 등록 컴포넌트
 *
 * @serwist/next의 register 옵션 대신 수동 등록을 사용하여
 * 업데이트 알림 및 skipWaiting 로직을 제어합니다.
 */
export function SwRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (typeof window === 'undefined') return;
    // 프로덕션 환경에서만 SW 등록 (개발 환경에서 precaching 404 에러 방지)
    if (process.env.NODE_ENV !== 'production') return;

    void registerSW();
  }, []);

  return null;
}

async function registerSW() {
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    // 설치 대기 중인 SW가 있을 때 사용자에게 알림 (선택적)
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (
          newWorker.state === 'installed' &&
          navigator.serviceWorker.controller
        ) {
          // 새 SW가 설치됨 — skipWaiting을 통해 즉시 활성화 요청
          newWorker.postMessage({ type: 'SKIP_WAITING' });
          console.log('[SW] 새 서비스 워커가 활성화되었습니다.');
        }
      });
    });

    // SW 변경 시 페이지 자동 리로드 (새 버전 즉시 적용)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    console.log('[SW] 서비스 워커가 등록되었습니다:', registration.scope);
  } catch (err) {
    console.error('[SW] 서비스 워커 등록 실패:', err);
  }
}
