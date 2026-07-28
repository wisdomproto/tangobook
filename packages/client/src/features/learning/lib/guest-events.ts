import type { LearningEventInsert } from '@tangobook/shared';

/**
 * 게스트(계정 없이 노는 30일) 동안의 학습 기록을 **로컬에 쌓는다**.
 *
 * 🔴 예전엔 계정이 없으면 이벤트를 통째로 버렸다. 그래서 게스트 30일이 끝나고 가입해도
 *    그 30일은 **없던 일**이 됐다 — 체험의 가장 큰 가치(우리 아이 기록)를 체험 중에는 볼 수 없고,
 *    가입 시점에 0에서 시작하는 셈이었다.
 * 🔴 서버로 보내지 않는다. 계정이 없으니 붙일 곳이 없고, 익명 기록을 서버에 쌓을 이유도 없다.
 *    가입해서 프로필이 생기는 순간 그 프로필로 옮겨 붙인다(`drainGuestEvents`).
 */
const KEY = 'tangobook-guest-learning-events';

/**
 * 보관 상한. 게스트 30일이면 수천 건이 될 수 있는데 localStorage 는 5MB 남짓이고
 * 다른 기능(진척·설정)과 나눠 쓴다. 상한을 넘으면 **오래된 것부터** 버린다 —
 * 최근 기록이 리포트에서 더 쓸모 있다.
 */
const MAX = 2000;

function read(): LearningEventInsert[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as LearningEventInsert[]) : [];
  } catch {
    return [];
  }
}

/** 이벤트 하나를 로컬에 append. 저장 실패(용량 초과 등)는 조용히 넘긴다 — 놀이를 막을 이유가 없다. */
export function appendGuestEvent(event: LearningEventInsert): void {
  try {
    const next = read();
    next.push(event);
    localStorage.setItem(KEY, JSON.stringify(next.slice(-MAX)));
  } catch {
    /* 기록은 부가 기능이다 */
  }
}

export function readGuestEvents(): LearningEventInsert[] {
  return read();
}

export function countGuestEvents(): number {
  return read().length;
}

/**
 * 쌓아둔 게스트 기록을 꺼내고 **비운다** — 가입 직후 그 프로필로 옮겨 붙일 때 쓴다.
 * 🔴 꺼내면서 지우므로 호출부가 실패해도 되돌릴 수 없다. 업로드가 성공한 뒤 부를 것.
 */
export function drainGuestEvents(profileId: string): LearningEventInsert[] {
  const events = read();
  if (events.length === 0) return [];
  localStorage.removeItem(KEY);
  return events.map((e) => ({ ...e, profile_id: profileId }));
}
