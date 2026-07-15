import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// window.fbq / __tbNoTrack 타입은 AnalyticsControl.tsx 의 declare global 에서 병합됨.

/**
 * SPA 라우트 이동마다 Meta Pixel `PageView` 를 재발화.
 * 초기 로드(랜딩)는 index.html 의 Meta Pixel base code 가 이미 PageView 를 쏘므로,
 * 최초 마운트는 중복 방지로 skip 하고 이후 pathname 변경부터 추적한다.
 * 내부계정(__tbNoTrack)은 발화하지 않는다.
 */
export function MetaPixelTracker() {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (window.__tbNoTrack) return;
    window.fbq?.('track', 'PageView');
  }, [pathname]);
  return null;
}
