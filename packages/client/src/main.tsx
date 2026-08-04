import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider } from 'react-router-dom';
import { queryClient } from './lib/query-client';
import { router } from './router';
import { registerAssetCache } from './lib/asset-cache';
import './lib/pwa-install'; // beforeinstallprompt 조기 캡처 (홈에 설치 버튼용)
import './i18n'; // UI 다국어 초기화 (localStorage 언어 감지 + lazy 로케일 로드)
import './index.css';
import './store/theme.store';

// 자산 캐시 서비스워커 (prod 전용) — R2 이미지·음원·효과음 로컬 durable 캐시.
registerAssetCache();

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* 🔴 lazy 라우트(마케팅·운영·회원·획 편집기)를 위한 최상위 경계. fallback 은 비워 둔다 —
          라우트 청크는 보통 수백 ms 라 스피너가 번쩍이는 게 더 거슬린다. */}
      <Suspense fallback={null}>
        <RouterProvider router={router} />
      </Suspense>
      {/* 우하단은 AppBgm 🎵 플로팅 버튼 자리 — devtools 는 좌하단으로 (dev 전용, 배포엔 없음) */}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  </StrictMode>
);
