import { describe, it, expect } from 'vitest';
import type { Storybook } from '@tangobook/shared';
import { buildObjectSceneData } from './object-scene-data';

const page = (n: number, text: string) => ({
  pageNumber: n,
  text,
  illustrationUrl: `https://cdn/p${n}.webp`,
});
const ko = (name: string, korean: string) => ({ name, korean });
const img = (name: string) => ({ objectName: name, imageUrl: `https://cdn/card-${name}.webp` });

/** 테스트 픽스처 — 빌더가 실제로 읽는 필드만 갖는 느슨한 책. */
type TestBook = Storybook & {
  pages: Array<{ pageNumber: number; text: string; illustrationUrl: string }>;
  key_objects: Array<{ name: string; korean: string; ttsUrl?: string; pages?: number[] }>;
  keyObjectImages: Array<{ objectName: string; imageUrl: string }>;
};

const book = (extra: Record<string, unknown> = {}): TestBook =>
  ({
    id: 'b1',
    pages: [
      page(1, '옛날에 쌀뒤주가 있었어요.'),
      page(2, '형들이 새끼줄을 꼬았어요.'),
      page(3, '어머니가 반짇고리를 열었어요.'),
      page(4, '호랑이가 달아났어요.'),
      page(5, '마을 사람들이 모였어요.'),
    ],
    key_objects: [ko('dwiju', '쌀뒤주'), ko('rope', '새끼줄'), ko('sewing', '반짇고리')],
    keyObjectImages: [img('dwiju'), img('rope'), img('sewing')],
    ...extra,
  }) as unknown as TestBook;

describe('buildObjectSceneData', () => {
  it('낱말 카드를 문제로, 그 낱말이 나온 쪽을 정답으로 낸다', () => {
    const d = buildObjectSceneData(book());
    expect(d?.type).toBe('korean-object-scene');
    expect(d?.rounds).toHaveLength(3);
    for (const r of d!.rounds) {
      expect(r.promptImageUrl).toMatch(/card-/);
      expect(r.distractorImageUrls).toHaveLength(2);
    }
    const dwiju = d!.rounds.find((r) => r.text === '쌀뒤주')!;
    expect(dwiju.correctImageUrl).toBe('https://cdn/p1.webp');
  });

  it('오답은 그 낱말이 안 나오는 쪽에서만 뽑는다', () => {
    // 쌀뒤주가 두 쪽에 나오면 그 두 쪽은 오답 후보가 아니다.
    const b = book();
    b.pages[3].text = '쌀뒤주 뒤에 호랑이가 숨었어요.';
    const r = buildObjectSceneData(b)!.rounds.find((x) => x.text === '쌀뒤주')!;
    expect(r.distractorImageUrls).not.toContain('https://cdn/p1.webp');
    expect(r.distractorImageUrls).not.toContain('https://cdn/p4.webp');
  });

  it('key_objects.pages 가 틀려도 본문을 보고 정한다', () => {
    // pages 가 엉뚱한 쪽(5)을 가리켜도 본문에 있는 쪽(1)이 정답이어야 한다.
    const b = book();
    b.key_objects[0].pages = [5];
    const r = buildObjectSceneData(b)!.rounds.find((x) => x.text === '쌀뒤주')!;
    expect(r.correctImageUrl).toBe('https://cdn/p1.webp');
  });

  it('카드 그림 없는 낱말·본문에 없는 낱말은 뺀다', () => {
    const b = book({ keyObjectImages: [img('dwiju'), img('rope')] });
    expect(buildObjectSceneData(b)).toBeNull(); // 남는 건 2개
    const b2 = book();
    b2.key_objects.push(ko('ghost', '없는말'));
    b2.keyObjectImages.push(img('ghost'));
    expect(buildObjectSceneData(b2)!.rounds.map((r) => r.text)).not.toContain('없는말');
  });

  it('저작 음원이 있으면 쓰고, 없으면 빈 문자열로 둔다', () => {
    const b = book();
    b.key_objects[0].ttsUrl = 'https://cdn/w.mp3';
    const rounds = buildObjectSceneData(b)!.rounds;
    expect(rounds.find((r) => r.text === '쌀뒤주')!.ttsUrl).toBe('https://cdn/w.mp3');
    expect(rounds.find((r) => r.text === '새끼줄')!.ttsUrl).toBe('');
  });
});
