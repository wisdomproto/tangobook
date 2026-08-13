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
  const { account, loading } = useAuth();

  // ① 내부 판정 — 이메일뿐 아니라 **index.html 이 이미 내린 판정(`__tbInternal`)도 존중**한다.
  //
  // 🔴 예전엔 이메일만 봤다(2026-08-13 수정). 그래서 ⓐ 로그아웃 상태의 자동화 브라우저는
  //    `__tbNoTrack` 이 undefined 로 남아 **Meta 픽셀 라우트 PageView 가 그대로 발화**했고,
  //    ⓑ 자동화 브라우저에서 일반 계정으로 로그인하면 `internal=false` 가 되어 index.html 이
  //    켜 둔 제외를 **도로 꺼 버렸다**. 이제 둘 중 하나라도 내부면 내부다.
  useEffect(() => {
    const email = account?.email;
    const byEmail = !!email && isInternalEmail(email);
    const internal = byEmail || window.__tbInternal === true;
    try {
      if (byEmail) localStorage.setItem('tb_internal', '1');
      // 일반 계정 로그인 시에만 해제 — webdriver·?__tb 로 켜 둔 제외는 건드리지 않는다.
      else if (email && !window.__tbInternal) localStorage.removeItem('tb_internal');
    } catch {
      /* ignore */
    }
    window.__tbInternal = internal;
    window.__tbNoTrack = internal;
    window['ga-disable-G-XENG7XW959'] = internal; // GA4 즉시 on/off
  }, [account?.email]);

  // ①-b 가입 전환 이벤트 (Meta 광고 최적화 목표) — accounts 행은 첫 로그인 때 lazy 생성이라
  // createdAt ≈ 가입 완료 시각(이메일 확인 후 첫 로그인 / OAuth 완료 둘 다). 신선한 계정이면
  // 1회만 CompleteRegistration 발화. localStorage 가드로 재로드·재세션 중복 방지.
  useEffect(() => {
    if (!account || window.__tbNoTrack) return;
    const key = `tb_fbq_reg:${account.id}`;
    try {
      if (localStorage.getItem(key)) return;
      const ageMs = Date.now() - new Date(account.createdAt).getTime();
      if (ageMs < 0 || ageMs > 60 * 60 * 1000) return; // 1시간 지난 계정은 기존 회원
      window.fbq?.('track', 'CompleteRegistration');
      window.gtag?.('event', 'sign_up');
      localStorage.setItem(key, '1');
    } catch {
      /* localStorage 불가 환경 — 추적 생략 */
    }
  }, [account]);

  // ② 회원 vs 비회원 → GA4 유저속성 membership (auth 확정 후, 내부계정 제외).
  useEffect(() => {
    if (loading || window.__tbNoTrack) return;
    window.gtag?.('set', 'user_properties', { membership: account ? 'member' : 'guest' });
  }, [account, loading]);

  // ③ 앱 UI 언어 → GA4 유저속성. 내부계정(__tbNoTrack)은 전송 안 함.
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
