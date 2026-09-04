import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useAccess } from '../hooks/useAccess';
import { BETA_OPEN } from '../config';
import { EntryGate } from './EntryGate';
import { PaywallNotice } from './PaywallNotice';

/**
 * **활동**(독후활동·학습현황) 접근 게이트.
 *
 * 🔴 게이팅 축이 「어떤 책」이 아니라 「어떤 활동」이다(2026-08-13). 읽기는 미로그인 포함 누구나
 *    전 책이 열려 있고, 값어치는 **독후활동(단어 익히기·게임)과 학습현황**이 낸다.
 *
 * 🔴 벽이 두 종류다 — 사람마다 **할 수 있는 다음 행동이 다르기 때문**이다.
 *      미로그인   → `EntryGate`   ("가입하면 30일 무료") — 할 일은 가입이다.
 *      체험 만료  → `PaywallNotice` (구독·친구초대·무료책) — 이미 가입했으니 가입하라면 막다른 길이다.
 *    한 화면으로 뭉뚱그리면 둘 중 한쪽은 자기 얘기가 아닌 문구를 본다.
 *
 * 🔴 버튼에서 막는 것만으로는 반쪽이다 — `/vocabulary/book-…` URL 로 직행할 수 있어 라우트에 세운다.
 *    (파닉스는 무료 단원이 있어 단원 단위 판정이 필요하므로 `PhonicsUnitGate` 를 쓴다.)
 *
 * ⚠️ 사이드바 「어휘 게임」(`/games/vocab`)은 **일부러 열어 둔다** — 랜덤 책 맛보기로 게임의 재미를
 *    먼저 보여주는 자리다. "내가 읽은 책으로 하려면 로그인", 이 대비가 유인이다.
 * ⚠️ Supabase 미설정(게스트 전용 빌드)에선 가입·결제 경로가 없으므로 막지 않는다.
 */
export const ActivityGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isConfigured } = useAuth();
  const access = useAccess();
  const navigate = useNavigate();

  // 🔴 베타 기간엔 벽을 아예 만들지 않는다. `useAccess()` 만 열어선 부족하다 —
  //    여기는 `!session` 을 직접 보므로 미로그인이면 권한과 무관하게 가입 벽이 섰다.
  const wall = BETA_OPEN
    ? null
    : !isConfigured
      ? null
      : !session
        ? 'signup'
        : !access.isEntitled
          ? 'expired'
          : null;

  return (
    <>
      {children}
      {wall === 'signup' && <EntryGate />}
      {wall === 'expired' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-ink-900/50 p-4">
          <PaywallNotice
            status="expired"
            onSubscribe={() => navigate('/subscribe')}
            onBrowseFree={() => navigate('/library')}
          />
        </div>
      )}
    </>
  );
};
