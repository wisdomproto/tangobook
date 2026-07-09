import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('./useGamePrefetch', () => ({
  warmImageUrl: vi.fn(() => Promise.resolve()),
  warmAudioUrl: vi.fn(() => Promise.resolve()),
}));
vi.mock('@/features/tts', () => ({
  resolveTtsUrl: vi.fn(() => Promise.resolve('https://r2/tts.mp3')),
}));

import { useGameAssetPreload } from './useGameAssetPreload';
import { resolveTtsUrl } from '@/features/tts';

afterEach(() => {
  vi.mocked(resolveTtsUrl).mockImplementation(() => Promise.resolve('https://r2/tts.mp3'));
});

const blockData = {
  type: 'korean-block',
  items: [{ word: '나무', imageUrl: 'https://r2/a.webp', ttsUrl: 'https://r2/na.mp3' }],
} as any;

describe('useGameAssetPreload', () => {
  it('core 자산 워밍 완료 시 ready=true, loaded===total', async () => {
    const { result } = renderHook(() =>
      useGameAssetPreload({
        data: blockData,
        game: 'korean-block',
        lang: 'ko',
        book: undefined,
        phonicsMap: new Map([
          ['나', 'u-na'],
          ['무', 'u-mu'],
        ]),
        phonicsReady: true,
        style: undefined,
        storybookId: 'book-1',
      })
    );
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.total).toBeGreaterThan(0);
    expect(result.current.loaded).toBe(result.current.total);
  });

  it('phonicsReady=false 면 ready 안 됨(맵 대기)', async () => {
    const { result } = renderHook(() =>
      useGameAssetPreload({
        data: blockData,
        game: 'korean-block',
        lang: 'ko',
        book: undefined,
        phonicsMap: null,
        phonicsReady: false,
        style: undefined,
        storybookId: 'book-1',
      })
    );
    // phonics 미준비 → 게이트 유지
    await new Promise((r) => setTimeout(r, 50));
    expect(result.current.ready).toBe(false);
  });

  it('TTS resolve 가 지연돼도(콜드 concat) 6초 상한에 ready=true', async () => {
    // resolveTtsUrl 이 영영 안 끝나는 상황(콜드 concat 지연) 시뮬레이션
    vi.mocked(resolveTtsUrl).mockImplementation(() => new Promise<string>(() => {}));
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() =>
        useGameAssetPreload({
          data: blockData,
          game: 'korean-block',
          lang: 'ko',
          book: undefined,
          phonicsMap: new Map([['나', 'u-na']]),
          phonicsReady: true,
          style: undefined,
          storybookId: 'book-1',
        })
      );
      expect(result.current.ready).toBe(false);
      // 6초 상한 경과 → TTS 가 안 끝나도 게임 시작
      await vi.advanceTimersByTimeAsync(6000);
      expect(result.current.ready).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
