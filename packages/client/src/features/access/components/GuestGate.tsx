import React from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useGuestMode } from '@/features/access/hooks/useGuestMode';
import { EntryGate } from './EntryGate';

/**
 * 진입 게이트를 **AppShell 밖 풀화면 라우트**에 붙인다.
 *
 * 🔴 파닉스 학습 화면(`/library/phonics/{korean,english}/*`)은 셸 밖이라 게이트를 안 만난다.
 *    랜딩만 셸 안이라, 랜딩을 잠가도 **URL 로 학습 화면에 바로 들어가면 그대로 열린다**.
 *    파닉스를 동화책과 같은 규칙으로 두려면(2026-07-29 결정) 이 래퍼가 필요하다.
 *
 * 게이트 자체의 규칙은 AppShell 과 동일하다 — 미로그인 + Supabase 설정됨 + 게스트 창이
 * 아직 시작 안 됐거나 끝났을 때만 뜬다. 로그인 사용자와 게스트 창 안에서는 안 뜬다.
 */
export const GuestGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isConfigured } = useAuth();
  const guest = useGuestMode();
  return (
    <>
      {children}
      {!session && isConfigured && guest.needsGate && (
        <EntryGate expired={guest.expired} onChoose={guest.refresh} />
      )}
    </>
  );
};
