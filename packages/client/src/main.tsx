import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider } from 'react-router-dom';
import { queryClient } from './lib/query-client';
import { router } from './router';
import { registerAssetCache } from './lib/asset-cache';
import { registerStaleChunkReload, clearStaleChunkMark } from './lib/stale-chunk-reload';
import './lib/pwa-install'; // beforeinstallprompt 조기 캡처 (홈에 설치 버튼용)
import './i18n'; // UI 다국어 초기화 (localStorage 언어 감지 + lazy 로케일 로드)
import './index.css';
import './store/theme.store';

// 자산 캐시 서비스워커 (prod 전용) — R2 이미지·음원·효과음 로컬 durable 캐시.
registerAssetCache();

// 배포로 사라진 청크(옛 탭)를 만나면 1회 자동 새로고침. 여기까지 왔다는 건 이번 빌드가 정상
// 부팅했다는 뜻이라 표식을 지워, 다음 배포 때도 한 번 더 자동 복구할 수 있게 한다.
registerStaleChunkReload();
clearStaleChunkMark();

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
