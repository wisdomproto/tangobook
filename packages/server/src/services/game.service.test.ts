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
