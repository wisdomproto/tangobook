import { describe, it, expect } from 'vitest';
import type { Storybook } from '@tangobook/shared';
import { pickUnitStoryScene } from './phonics-word-scene';

/** 호리 한글 나무 단원(8쪽 그림책)을 흉내 낸 최소 데이터. */
const unit = (pages: Array<{ text?: string; illustrationUrl?: string; ttsUrl?: string }>) =>
  ({
    id: 'kr-h1-u02',
    type: 'phonics',
    pages: pages.map((p, i) => ({ pageNumber: i + 1, ...p })),
  }) as unknown as Storybook;

describe('pickUnitStoryScene — 단원 자체의 호리 동화에서 예문 찾기', () => {
  it('🔴 본문이 물결로 늘여 쓴 낱말도 찾는다 — `고~기` 는 `고기` 다', () => {
    // 소리 내어 읽히려고 `고~기` 로 적혀 있다. 그대로 찾으면 128개 중 4개를 놓친다.
    const sb = unit([{ text: '호리가 "고~기!" 하고 읽었어요.', illustrationUrl: 'p1.png' }]);
    expect(pickUnitStoryScene('고기', 'ko', sb)?.pageNumber).toBe(1);
  });

  it('삽화 없는 쪽은 고르지 않는다 — 보여 줄 그림이 없으면 빈 화면이다', () => {
    const sb = unit([
      { text: '야구 이야기', ttsUrl: 'a.mp3' }, // 삽화 없음
      { text: '야구 이야기 둘', illustrationUrl: 'p2.png' },
    ]);
    expect(pickUnitStoryScene('야구', 'ko', sb)?.pageNumber).toBe(2);
  });

  it('본문에 없으면 null — 호출부가 다른 동화책으로 폴백한다', () => {
    const sb = unit([{ text: '가구 이야기', illustrationUrl: 'p1.png' }]);
    expect(pickUnitStoryScene('고기', 'ko', sb)).toBeNull();
  });

  it('여러 쪽에 나오면 그중 하나 — 매번 같은 쪽만 나오지 않는다', () => {
    const sb = unit([
      { text: '아기 새', illustrationUrl: 'p1.png' },
      { text: '아기 구름', illustrationUrl: 'p2.png' },
    ]);
    const seen = new Set(
      Array.from({ length: 40 }, () => pickUnitStoryScene('아기', 'ko', sb)?.pageNumber)
    );
    expect(seen).toEqual(new Set([1, 2]));
  });

  it('나레이션 URL 을 그대로 실어 준다 — 읽어 주는 게 목적이다', () => {
    const sb = unit([{ text: '고기 한 점', illustrationUrl: 'p1.png', ttsUrl: 'page1.mp3' }]);
    expect(pickUnitStoryScene('고기', 'ko', sb)?.pageTtsUrl).toBe('page1.mp3');
  });
});
