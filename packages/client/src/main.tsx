import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider } from 'react-router-dom';
import { queryClient } from './lib/query-client';
import { router } from './router';
import { registerAssetCache } from './lib/asset-cache';
import './index.css';
import './store/theme.store';

// 자산 캐시 서비스워커 (prod 전용) — R2 이미지·음원·효과음 로컬 durable 캐시.
registerAssetCache();

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {/* 우하단은 AppBgm 🎵 플로팅 버튼 자리 — devtools 는 좌하단으로 (dev 전용, 배포엔 없음) */}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  </StrictMode>
);
