import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

vi.mock('./useGamePrefetch', () => ({
  warmImageUrl: vi.fn(() => Promise.resolve()),
  warmAudioUrl: vi.fn(() => Promise.resolve()),
}));
vi.mock('@/features/tts', () => ({
  resolveTtsUrl: vi.fn(() => Promise.resolve('https://r2/tts.mp3')),
}));
vi.mock('./usePhonicsMap', () => ({
  usePhonicsMap: vi.fn(() => ({ mapRef: { current: new Map() }, loading: true })),
}));

import { useGameAssetPreload } from './useGameAssetPreload';
import { resolveTtsUrl } from '@/features/tts';
import { warmAudioUrl, warmImageUrl } from './useGamePrefetch';
import { usePhonicsMap } from './usePhonicsMap';
import type { Storybook } from '@tangobook/shared';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.mocked(resolveTtsUrl).mockImplementation(() => Promise.resolve('https://r2/tts.mp3'));
  vi.mocked(warmAudioUrl).mockImplementation(() => Promise.resolve());
  vi.mocked(warmImageUrl).mockImplementation(() => Promise.resolve());
});

const blockData = {
  type: 'korean-block',
  items: [{ word: '나무', imageUrl: 'https://r2/a.webp', ttsUrl: 'https://r2/na.mp3' }],
};

const args = {
  data: blockData,
  game: 'korean-block' as const,
  lang: 'ko' as const,
  book: undefined,
  phonicsMap: new Map([['나', 'u-na']]),
  phonicsReady: true,
  style: undefined,
  storybookId: 'book-1',
};

it.each(['english-block', 'english-line-matching'] as const)(
  'prepares %s sounds while core media is pending, without bypassing the core gate',
  async (game) => {
    let finishImage!: () => void;
    vi.mocked(warmImageUrl).mockImplementation(
      () => new Promise<void>((resolve) => (finishImage = resolve))
    );
    const view = renderHook(() =>
      useGameAssetPreload({
        ...args,
        game,
        lang: 'en',
        data: {
          type: 'english-block',
          items: [{ word: 'cat', imageUrl: 'cat.webp', ttsUrl: 'cat.mp3' }],
        },
      })
    );
    expect(usePhonicsMap).toHaveBeenCalledWith(['mod_phonics', 'mod_english'], true);
    expect(warmImageUrl).toHaveBeenCalledWith('cat.webp');
    expect(view.result.current.ready).toBe(false);
    await act(async () => finishImage());
    expect(view.result.current.ready).toBe(true);
    // The player still owns its map-readiness overlay if the library is slower than core assets.
    expect(vi.mocked(usePhonicsMap).mock.results.at(-1)?.value.loading).toBe(true);
    view.unmount();
  }
);

it.each(['korean-block', 'english-word-writing', 'korean-word-writing'] as const)(
  'does not add an English letter-library request to %s',
  async (game) => {
    const view = renderHook(() => useGameAssetPreload({ ...args, game }));
    expect(usePhonicsMap).toHaveBeenCalledWith(['mod_phonics', 'mod_english'], false);
    await waitFor(() => expect(view.result.current.ready).toBe(true));
    view.unmount();
  }
);

it('starts optional scene media only after core readiness, once per scene URL, without waiting for it', async () => {
  let finishCore!: () => void;
  const book = {
    key_objects: [{ name: '나무', korean: '나무', pages: [1] }],
    pages: [
      { pageNumber: 1, text: '나무가 있다', illustrationUrl: 'scene.webp', ttsUrl: 'scene.mp3' },
    ],
  } as Storybook;
  vi.mocked(warmAudioUrl).mockImplementation((url) => {
    if (url === 'scene.mp3') return new Promise<void>(() => {});
    if (url === 'https://r2/tts.mp3') return new Promise<void>((resolve) => (finishCore = resolve));
    return Promise.resolve();
  });
  const { result } = renderHook(() =>
    useGameAssetPreload({
      ...args,
      book,
      data: { type: 'korean-block', items: [blockData.items[0], blockData.items[0]] },
    })
  );
  await waitFor(() => expect(finishCore).toBeTypeOf('function'));
  expect(result.current.ready).toBe(false);
  expect(warmImageUrl).not.toHaveBeenCalledWith('scene.webp');
  expect(warmAudioUrl).not.toHaveBeenCalledWith('scene.mp3');
  await act(async () => finishCore());
  expect(result.current.ready).toBe(true);
  expect(result.current.loaded).toBe(result.current.total);
  expect(vi.mocked(warmImageUrl).mock.calls.filter(([url]) => url === 'scene.webp')).toHaveLength(
    1
  );
  expect(vi.mocked(warmAudioUrl).mock.calls.filter(([url]) => url === 'scene.mp3')).toHaveLength(1);
});

it('does not carry the previous round readiness into a new target or warm its scene early', async () => {
  let finishNext!: () => void;
  const makeBook = (word: string) =>
    ({
      key_objects: [{ name: word, korean: word, pages: [1] }],
      pages: [
        {
          pageNumber: 1,
          text: `${word} 있다`,
          illustrationUrl: `${word}.webp`,
          ttsUrl: `${word}.mp3`,
        },
      ],
    }) as Storybook;
  vi.mocked(resolveTtsUrl).mockImplementation(({ text }) => Promise.resolve(`answer-${text}`));
  vi.mocked(warmAudioUrl).mockImplementation((url) =>
    url === 'answer-바다'
      ? new Promise<void>((resolve) => (finishNext = resolve))
      : Promise.resolve()
  );
  const view = renderHook(
    ({ word }) =>
      useGameAssetPreload({
        ...args,
        data: { type: 'korean-block', items: [{ word }] },
        book: makeBook(word),
      }),
    { initialProps: { word: '나무' } }
  );
  await waitFor(() => expect(view.result.current.ready).toBe(true));
  view.rerender({ word: '바다' });
  await waitFor(() => expect(finishNext).toBeTypeOf('function'));
  expect(view.result.current.ready).toBe(false);
  expect(warmImageUrl).not.toHaveBeenCalledWith('바다.webp');
  await act(async () => finishNext());
  expect(view.result.current.ready).toBe(true);
  expect(warmImageUrl).toHaveBeenCalledWith('바다.webp');
});

it('느린 단어 URL을 기다리는 동안에도 그림/음절과 먼저 확인된 단어를 준비한다', async () => {
  let finishSlow!: (url: string) => void;
  let finishVoice!: () => void;
  vi.mocked(resolveTtsUrl).mockImplementation(({ text }) =>
    text === '나무'
      ? Promise.resolve('voice-fast')
      : new Promise<string>((resolve) => {
          finishSlow = resolve;
        })
  );
  vi.mocked(warmAudioUrl).mockImplementation((url) =>
    url === 'voice-slow'
      ? new Promise<void>((resolve) => {
          finishVoice = resolve;
        })
      : Promise.resolve()
  );
  const { result } = renderHook(() =>
    useGameAssetPreload({
      ...args,
      data: { type: 'korean-block', items: [...blockData.items, { word: '바다' }] },
    })
  );
  expect(warmImageUrl).toHaveBeenCalledWith('https://r2/a.webp');
  expect(warmAudioUrl).toHaveBeenCalledWith('u-na');
  await waitFor(() => expect(warmAudioUrl).toHaveBeenCalledWith('voice-fast'));
  expect(result.current.ready).toBe(false);
  expect(result.current.loaded).toBeLessThan(result.current.total);
  await act(async () => finishSlow('voice-slow'));
  expect(result.current.ready).toBe(false); // URL resolution alone cannot open the gate.
  await act(async () => finishVoice());
  expect(result.current.ready).toBe(true);
  expect(result.current.loaded).toBe(result.current.total);
});

it('같은 URL의 그림/음절/정답 중복 준비를 합치되 재진입 시 실제 준비를 다시 확인한다', async () => {
  vi.mocked(resolveTtsUrl).mockResolvedValue('u-na');
  const data = { type: 'korean-block', items: [blockData.items[0], blockData.items[0]] };
  const first = renderHook(() => useGameAssetPreload({ ...args, data }));
  await waitFor(() => expect(first.result.current.ready).toBe(true));
  expect(warmImageUrl).toHaveBeenCalledTimes(1);
  expect(warmAudioUrl).toHaveBeenCalledTimes(1);
  first.unmount();
  const next = renderHook(() => useGameAssetPreload({ ...args, data }));
  await waitFor(() => expect(next.result.current.ready).toBe(true));
  expect(warmAudioUrl).toHaveBeenCalledTimes(2);
});

it('실패도 진행률에 반영하며 이탈 후 늦게 온 URL로 음원을 준비하지 않는다', async () => {
  let finish!: (url: string) => void;
  vi.mocked(warmImageUrl).mockRejectedValue(new Error('image failed'));
  vi.mocked(resolveTtsUrl).mockImplementation(
    () =>
      new Promise<string>((r) => {
        finish = r;
      })
  );
  const view = renderHook(() => useGameAssetPreload(args));
  await waitFor(() => expect(view.result.current.loaded).toBe(2));
  expect(view.result.current.ready).toBe(false);
  view.unmount();
  await act(async () => finish('late-voice'));
  expect(warmAudioUrl).not.toHaveBeenCalledWith('late-voice');
});

it('같은 개수/그림이어도 타깃 낱말이 바뀌면 새 음원을 준비한다', async () => {
  const view = renderHook(
    ({ word }) =>
      useGameAssetPreload({
        ...args,
        data: { type: 'korean-block', items: [{ ...blockData.items[0], word }] },
      }),
    { initialProps: { word: '나무' } }
  );
  await waitFor(() => expect(view.result.current.ready).toBe(true));
  view.rerender({ word: '바다' });
  await waitFor(() =>
    expect(resolveTtsUrl).toHaveBeenCalledWith(expect.objectContaining({ text: '바다' }))
  );
  await waitFor(() => expect(view.result.current.ready).toBe(true));
});

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
      await act(async () => vi.advanceTimersByTimeAsync(6000));
      expect(result.current.ready).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
