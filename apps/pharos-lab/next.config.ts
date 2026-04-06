import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

const withSerwist = withSerwistInit({
  // Service Worker 소스 파일 경로 (src/ 기준)
  swSrc: 'src/app/sw.ts',
  // 빌드된 SW 출력 경로 (public/ 기준)
  swDest: 'public/sw.js',
  // 개발 환경에서는 SW 비활성화 (핫 리로드 간섭 방지)
  // 프로덕션 빌드(npm run build)에서만 SW가 활성화됨
  disable: isDev,
});

const nextConfig: NextConfig = {
  // Turbopack 기본 활성화 명시 (serwist webpack 플러그인 경고 억제)
  // SW는 isDev=true일 때 비활성화되므로 dev 서버에서는 webpack 플러그인 무해
  turbopack: {},
};

export default withSerwist(nextConfig);
