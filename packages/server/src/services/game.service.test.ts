import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks must be declared before importing the module under test.
vi.mock('../repositories/r2.repository.js', () => ({
  R2Repository: {
    getStorybook: vi.fn(),
  },
}));
vi.mock('../utils/phonics-data-helpers.js', () => ({
  collectStorybookImagePool: vi.fn(),
  collectPhonicsWordPool: vi.fn(),
  isKoreanPhonics: vi.fn(() => false),
}));
vi.mock('./tts.service.js', () => ({
  TtsService: {
    generate: vi.fn(
      async ({ identifier }: { identifier: string }) => `https://r2.fake/${identifier}.mp3`
    ),
  },
}));

import { buildHiddenObjectData } from './game.service.js';
import type { HiddenObjectConfig } from '@tangobook/shared';
import type { Storybook } from '@tangobook/shared';
import * as gameService from './game.service.js';
import { R2Repository } from '../repositories/r2.repository.js';
import { collectStorybookImagePool } from '../utils/phonics-data-helpers.js';
import { TtsService } from './tts.service.js';

describe('generateKoreanSpeaking / generateEnglishSpeaking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (R2Repository.getStorybook as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'test-book',
      title: 'Test',
    });
  });

  it('한국어 모드: word = korean, TTS 생성 (identifier = speaking-ko-{slug})', async () => {
    (collectStorybookImagePool as ReturnType<typeof vi.fn>).mockReturnValue([
      { word: 'apple', korean: '사과', imageUrl: 'img1.webp' },
      { word: 'banana', korean: '바나나', imageUrl: 'img2.webp' },
      { word: 'cat', korean: '고양이', imageUrl: 'img3.webp' },
    ]);

    const data = await gameService.generateKoreanSpeaking('test-book');
    expect(data.type).toBe('korean-speaking');
    expect(data.items).toHaveLength(3);
    expect(data.items[0].word).toBe('사과');
    expect(data.items[0].koreanMeaning).toBeUndefined();
    expect(data.items[0].ttsUrl).toContain('speaking-ko-');
    expect(TtsService.generate).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'ko', text: '사과' })
    );
  });

  it('영어 모드: word = word, koreanMeaning 채워짐, pool의 ttsUrl 재사용', async () => {
    (collectStorybookImagePool as ReturnType<typeof vi.fn>).mockReturnValue([
      { word: 'apple', korean: '사과', imageUrl: 'img1.webp', ttsUrl: 'existing-tts.mp3' },
      { word: 'banana', korean: '바나나', imageUrl: 'img2.webp' },
      { word: 'cat', korean: '고양이', imageUrl: 'img3.webp' },
    ]);

    const data = await gameService.generateEnglishSpeaking('test-book');
    expect(data.items[0].word).toBe('apple');
    expect(data.items[0].koreanMeaning).toBe('사과');
    expect(data.items[0].ttsUrl).toBe('existing-tts.mp3'); // 재사용
    expect(data.items[1].ttsUrl).toContain('speaking-en-'); // 생성
  });

  it('pool 3개 미만이면 AppError(400)', async () => {
    (collectStorybookImagePool as ReturnType<typeof vi.fn>).mockReturnValue([
      { word: 'apple', korean: '사과', imageUrl: 'img1.webp' },
    ]);
    await expect(gameService.generateKoreanSpeaking('small-book')).rejects.toThrow(/부족/);
  });
});

describe('buildHiddenObjectData', () => {
  const book = {
    id: 'b1',
    title: 't',
    targetAge: '4-5',
    artStyle: 's',
    key_objects: [
      { name: 'fox', korean: '여우', description: '', pages: [1], ttsUrl: 'https://tts/fox.mp3' },
    ],
    keyObjectImages: [{ objectName: 'fox', imageUrl: 'https://r2/fox.png', success: true }],
    hiddenObjectScenes: [
      {
        id: 'hobj_1',
        sceneImageUrl: 'https://r2/scene.png',
        hotspots: [{ objectName: 'fox', x: 0.1, y: 0.2, w: 0.3, h: 0.4 }],
      },
    ],
  } as unknown as Storybook;

  it('씬의 핫스팟을 라벨/썸네일/TTS resolve 된 타깃으로 변환한다', () => {
    const cfg: HiddenObjectConfig = { type: 'hidden-object', sceneCount: 1 };
    const data = buildHiddenObjectData(book, cfg);
    expect(data.type).toBe('hidden-object');
    expect(data.scenes).toHaveLength(1);
    const t = data.scenes[0].targets[0];
    expect(t).toMatchObject({
      objectName: 'fox',
      label: '여우',
      thumbnailUrl: 'https://r2/fox.png',
      ttsUrl: 'https://tts/fox.mp3',
      x: 0.1,
      y: 0.2,
      w: 0.3,
      h: 0.4,
    });
  });

  it('씬이 없으면 명확한 에러를 던진다', () => {
    const empty = { ...book, hiddenObjectScenes: [] } as Storybook;
    const cfg: HiddenObjectConfig = { type: 'hidden-object', sceneCount: 1 };
    expect(() => buildHiddenObjectData(empty, cfg)).toThrow();
  });
});
