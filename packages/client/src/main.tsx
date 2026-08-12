import { StrictMode, Suspense } from 'react';
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

/**
 * 🔴 **한 프레임 양보한 뒤 마운트한다**(2026-08-04). 프리렌더된 HTML 이 이미 DOM 에 있는데도
 *    첫 페인트가 CSS 도착보다 **1.9초** 늦었다 — 스크립트 실행이 끝나자마자 React 의 첫 렌더가
 *    메인 스레드를 잡아, 브라우저가 **이미 가진 화면을 그릴 틈을 못 얻는다**(4G·CPU 4배 실측
 *    CSS 2.7s / FCP 4.6s). 양보하면 그 사이에 프리렌더본이 그려진다.
 *    프리렌더가 없는 라우트에도 손해가 없다 — 그릴 게 없으면 그냥 한 프레임이다.
 */
let mounted = false;
const mount = () => {
  if (mounted) return;
  mounted = true;
  return createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        {/* 🔴 lazy 라우트(마케팅·운영·회원·획 편집기)를 위한 최상위 경계. fallback 은 비워 둔다 —
          라우트 청크는 보통 수백 ms 라 스피너가 번쩍이는 게 더 거슬린다. */}
        <Suspense fallback={null}>
          <RouterProvider router={router} />
        </Suspense>
        {/* devtools 는 좌하단 (dev 전용, 배포엔 없음) */}
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      </QueryClientProvider>
    </StrictMode>
  );
};

requestAnimationFrame(() => setTimeout(mount, 0));
// 🔴 rAF 는 **보이지 않는 탭에서 안 돈다** — 백그라운드 탭으로 열거나 헤드리스로 띄우면 위 콜백이
//    영영 안 불려 앱이 통째로 안 뜬다(실측: `visibilityState:'hidden'` 에서 root 자식 0).
//    한 프레임 양보는 첫 페인트를 위한 최적화지 마운트 조건이 아니므로, 프레임이 안 오면 시간으로
//    깨운다. 보이는 탭에서는 rAF 가 먼저 이겨 최적화가 그대로 유지된다(`mounted` 가드로 1회만).
setTimeout(mount, 300);
