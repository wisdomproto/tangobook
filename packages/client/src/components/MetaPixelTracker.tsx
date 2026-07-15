import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * SPA 라우트 이동마다 Meta Pixel `PageView` 를 재발화.
 * 초기 로드(랜딩)는 index.html 의 Meta Pixel base code 가 이미 PageView 를 쏘므로,
 * 최초 마운트는 중복 방지로 skip 하고 이후 pathname 변경부터 추적한다.
 */
export function MetaPixelTracker() {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.fbq?.('track', 'PageView');
  }, [pathname]);
  return null;
}
