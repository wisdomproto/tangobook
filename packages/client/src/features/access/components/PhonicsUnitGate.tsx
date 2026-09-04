import React from 'react';
import { useParams } from 'react-router-dom';
import { canReadBook } from '@tangobook/shared';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useStorybook } from '@/features/storybook';
import { useAccess } from '../hooks/useAccess';
import { BETA_OPEN } from '../config';
import { EntryGate } from './EntryGate';

/**
 * 파닉스 **단원 단위** 잠금.
 *
 * 🔴 파닉스도 동화책과 같은 방식으로 "일부 공개"한다(2026-08-11). 잠깐 통째로 벽을 세웠었는데,
 *    그러면 동화책만 맛보기가 있고 파닉스는 없는 예외가 생긴다. 한글은 **모음·ㄱ**, 영어는
 *    **알파벳 첫 단원·짧은 모음 a** 를 열어 두고 나머지를 잠근다 — 판정 기준은 동화책과 똑같은
 *    `isAccessibleForFree` 라, 무료 단원을 늘리려면 데이터만 바꾸면 된다(코드 무변경).
 *
 * 🔴 단원 목록(랜딩)은 잠그지 않는다 — 뭐가 있는지도 못 보게 하면 가입할 이유를 못 만든다.
 *    `unitId` 가 없는 경로면 그냥 통과시킨다.
 * 🔴 로딩 중엔 게이트를 띄우지 않는다 — 무료 단원인데 잠깐 벽이 번쩍이면 그게 더 나쁘다.
 */
export const PhonicsUnitGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { unitId } = useParams();
  const { session, isConfigured } = useAuth();
  const access = useAccess();
  const { data: unit, isLoading } = useStorybook(unitId);

  // 🔴 베타 기간엔 단원 단위 잠금도 없다. 여기도 `!session` 을 직접 보므로
  //    `useAccess()` 만으로는 안 열린다.
  const locked =
    !BETA_OPEN &&
    !session &&
    isConfigured &&
    !!unitId &&
    !isLoading &&
    !!unit &&
    !canReadBook(unit, access);

  return (
    <>
      {children}
      {locked && <EntryGate />}
    </>
  );
};
