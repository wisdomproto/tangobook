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

/**
 * 🔴 **한 프레임 양보한 뒤 마운트한다**(2026-08-04). 프리렌더된 HTML 이 이미 DOM 에 있는데도
 *    첫 페인트가 CSS 도착보다 **1.9초** 늦었다 — 스크립트 실행이 끝나자마자 React 의 첫 렌더가
 *    메인 스레드를 잡아, 브라우저가 **이미 가진 화면을 그릴 틈을 못 얻는다**(4G·CPU 4배 실측
 *    CSS 2.7s / FCP 4.6s). 양보하면 그 사이에 프리렌더본이 그려진다.
 *    프리렌더가 없는 라우트에도 손해가 없다 — 그릴 게 없으면 그냥 한 프레임이다.
 */
const mount = () =>
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

requestAnimationFrame(() => setTimeout(mount, 0));
