import { useEffect } from 'react';
import i18n from '@/i18n';
import { useAuth } from '@/features/auth/context/AuthContext';
import { isInternalEmail } from '@/config/dev';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    __tbNoTrack?: boolean;
    __tbInternal?: boolean;
    'ga-disable-G-XENG7XW959'?: boolean;
  }
}

/**
 * 트래킹 제어 (렌더 없음, 라우터 루트 AuthProvider 안에 마운트):
 *  ① 내부/테스트 계정 로그인 시 GA4·Meta 픽셀 트래킹 제외 — 이번 세션 즉시(ga-disable + __tbNoTrack)
 *     + localStorage `tb_internal` 로 다음 로드부터 index.html 이 아예 발화 안 하게.
 *  ② 앱 UI 언어를 GA4 커스텀 유저속성 `app_language` 로 전송(언어별 분포 카드용).
 */
export function AnalyticsControl() {
  const { account } = useAuth();

  // ① 내부계정 판정 — 로그인 이메일 있을 때만 세팅/해제(로그아웃·로딩 중엔 기존 플래그 유지).
  useEffect(() => {
    const email = account?.email;
    if (!email) return;
    const internal = isInternalEmail(email);
    try {
      if (internal) localStorage.setItem('tb_internal', '1');
      else localStorage.removeItem('tb_internal');
    } catch {
      /* ignore */
    }
    window.__tbNoTrack = internal;
    window['ga-disable-G-XENG7XW959'] = internal; // GA4 즉시 on/off
  }, [account?.email]);

  // ② 앱 UI 언어 → GA4 유저속성. 내부계정(__tbNoTrack)은 전송 안 함.
  useEffect(() => {
    const send = (lang: string) => {
      if (window.__tbNoTrack) return;
      window.gtag?.('set', 'user_properties', { app_language: lang });
    };
    send(i18n.language);
    i18n.on('languageChanged', send);
    return () => {
      i18n.off('languageChanged', send);
    };
  }, []);

  return null;
}
