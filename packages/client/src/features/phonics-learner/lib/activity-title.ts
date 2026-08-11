import type { TFunction } from 'i18next';

/**
 * 활동·단원 **제목의 i18n**.
 *
 * 🔴 plan 생성기(`{korean,english,chinese}-phonics-units.ts`)는 React 밖이라 `t()` 를 못 부른다.
 *    그래서 생성기는 **키와 보간값만** 싣고, 그리는 건 화면이 여기서 한다.
 * 🔴 기존 `title`(한국어)은 지우지 않고 **폴백**으로 남긴다 — 키를 안 단 항목이나 로케일에 없는
 *    키가 있어도 화면이 비지 않는다(제목이 사라지면 무슨 활동인지 아무도 못 읽는다).
 * 🔴 보간값은 **콘텐츠**(ㄱ·Aa·-ake)라 번역 대상이 아니다. 언어를 타는 건 문장 틀뿐이다.
 */
type Vars = Record<string, string | number>;

function resolve(t: TFunction, fallback: string, key?: string, vars?: Vars): string {
  if (!key) return fallback;
  return t(key, { ...vars, defaultValue: fallback }) as string;
}

export function activityTitle(
  t: TFunction,
  a: { title: string; titleKey?: string; titleVars?: Vars }
): string {
  return resolve(t, a.title, a.titleKey, a.titleVars);
}

export function unitTitle(
  t: TFunction,
  u: { unitTitle: string; unitTitleKey?: string; unitTitleVars?: Vars }
): string {
  return resolve(t, u.unitTitle, u.unitTitleKey, u.unitTitleVars);
}

/** 레벨 이름(`한글2: 받침`·`Level 5: 복운모`) — 사이드바 머리글·단원 화면이 같이 쓴다. */
export function levelName(t: TFunction, u: { levelName: string; levelNameKey?: string }): string {
  return resolve(t, u.levelName, u.levelNameKey);
}
