import React from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { EntryGate } from './EntryGate';

/**
 * 로그인해야 쓸 수 있는 **활동** 화면에 붙이는 벽.
 *
 * 🔴 게이팅 축이 「어떤 책」이 아니라 「어떤 활동」이다(2026-08-13). 읽기는 미로그인 포함 누구나
 *    전 책이 열려 있고, 로그인의 값어치는 **독후활동(단어 익히기·게임)과 학습현황**이다.
 *
 * 🔴 버튼에서 막는 것만으로는 반쪽이다 — 책 상세의 카드를 눌러야만 오는 게 아니라
 *    `/vocabulary/book-…` URL 로 바로 들어올 수 있다. 그래서 라우트에도 세운다.
 *    (파닉스는 무료 단원이 있어 단원 단위 판정이 필요하므로 `PhonicsUnitGate` 를 쓴다.)
 *
 * ⚠️ 사이드바 「어휘 게임」(`/games/vocab`)은 **일부러 열어 둔다** — 랜덤 책 맛보기라
 *    게임의 재미를 먼저 보여주는 자리다. 내가 읽은 책으로 하려면 로그인, 이 대비가 유인이다.
 */
export const LoginGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isConfigured } = useAuth();
  return (
    <>
      {children}
      {!session && isConfigured && <EntryGate />}
    </>
  );
};
