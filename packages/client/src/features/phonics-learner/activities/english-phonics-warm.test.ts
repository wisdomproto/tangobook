import { describe, it, expect } from 'vitest';

/**
 * 🔴 영어 파닉스 활동은 **진입 시 발음을 데워야** 첫 탭이 안 늦는다(`usePhonicsTtsWarm`).
 *
 * 한 화면씩 빠뜨리다 사용자에게 반복해서 지적받았다("영어 파닉스 전부 진입 프리워밍 좀 해봐").
 * 그래서 소스에 warm 호출이 있는지를 **정적으로 잠근다** — 새 영어 활동을 만들면서 warm 을 안 붙이면
 * 이 테스트가 빨갛게 뜬다. (프리픽스·언어가 실제 탭과 맞는지는 잡지 못한다 — 그건 game-reviewer 몫.)
 *
 * 제외: `AlphabetLetterWriteActivity` — 통과 시 낱말 `ttsUrl`(directUrl)만 재생해 서버 왕복이 없다.
 */
const MUST_WARM = [
  'AlphabetLetterLearnActivity',
  'CvcPatternLearnActivity',
  'CvcPatternWriteActivity',
  'WordListenChooseActivity',
  'WordFamilyLearnActivity',
  'ReviewFlipMatchActivity',
  'LetterHuntActivity',
  'ReviewWriteActivity',
];

// Vite 네이티브 — 소스를 문자열로 읽는다(node:fs 불필요, 브라우저 환경에서도 동작).
const sources = import.meta.glob('./*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

describe('영어 파닉스 활동 진입 프리워밍', () => {
  it.each(MUST_WARM)('%s 는 usePhonicsTtsWarm 을 호출한다', (name) => {
    const entry = Object.entries(sources).find(([path]) => path.endsWith(`/${name}.tsx`));
    expect(entry, `${name}.tsx 를 못 찾음`).toBeTruthy();
    expect(entry![1]).toMatch(/usePhonicsTtsWarm\(/);
  });
});
