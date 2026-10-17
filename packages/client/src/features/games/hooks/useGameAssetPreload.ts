import { useEffect, useMemo, useState } from 'react';
import type { Lang, Storybook, GameTypeId } from '@tangobook/shared';
import { resolveTtsUrl } from '@/features/tts';
import { warmImageUrl, warmAudioUrl } from './useGamePrefetch';
import {
  extractItemImages,
  extractItemWords,
  extractRoundAudio,
  collectSyllableUrls,
  collectSceneAssets,
  buildTtsSpec,
} from '../lib/collect-game-assets';

const PRELOAD_MAX_MS = 6000;

interface Args {
  data: {
    type: string;
    items?: Array<Record<string, unknown>>;
    rounds?: Array<{
      text?: string;
      ttsUrl?: string;
      correctImageUrl?: string;
      distractorImageUrls?: string[];
    }>;
  };
  game: GameTypeId;
  lang: Lang;
  book: Storybook | undefined;
  phonicsMap: Map<string, string> | null;
  phonicsReady: boolean;
  style: string | undefined;
  storybookId: string; // effectiveStorybookId (동기, concat 캐시 키)
}

export function useGameAssetPreload(args: Args): { ready: boolean; loaded: number; total: number } {
  const { data, game, lang, book, phonicsMap, phonicsReady, style, storybookId } = args;

  const images = useMemo(() => extractItemImages(data), [data]);
  const words = useMemo(() => extractItemWords(data), [data]);
  const syllables = useMemo(
    () => (phonicsReady ? collectSyllableUrls(words, phonicsMap) : []),
    [phonicsReady, words, phonicsMap]
  );
  const scene = useMemo(
    () => collectSceneAssets(words, lang, book, style, game),
    [words, lang, book, style, game]
  );
  const ttsSpec = useMemo(() => buildTtsSpec(data, game), [data, game]);
  const roundAudio = useMemo(() => extractRoundAudio(data), [data]);

  const [loaded, setLoaded] = useState(0);
  const [total, setTotal] = useState(0);
  const [ready, setReady] = useState(false);

  const coreKey = JSON.stringify([
    images,
    syllables,
    roundAudio,
    ttsSpec,
    storybookId,
    phonicsReady,
  ]);
  const bgKey = [...scene.sceneImages, ...scene.sceneNarrations].join('|');

  useEffect(() => {
    if (!phonicsReady) {
      setReady(false);
      return;
    }
    let alive = true;
    setLoaded(0);
    setReady(false);

    // 6초 상한 — TTS resolve(콜드 concat: 음절 합성→R2 업로드)까지 포함해 전체 대기를 bound.
    // 상한 전에 async 밖에서 걸어야 콜드 concat 이 오래 걸려도 게임이 6초 뒤 무조건 시작된다.
    const cap = setTimeout(() => {
      if (alive) setReady(true);
    }, PRELOAD_MAX_MS);

    const imageUrls = [...new Set(images)];
    const audioUrls = [...new Set([...syllables, ...roundAudio])];
    // Count pending URL resolutions too: cached images must not show 100% while concat is pending.
    setTotal(imageUrls.length + audioUrls.length + (ttsSpec?.items.length ?? 0));
    const bump = () => {
      if (alive) setLoaded((n) => n + 1);
    };
    // A one-syllable answer/alias can share a URL with a tile or round voice. Prepare it once per run,
    // without a permanent "ready" flag that could outlive the browser's actual media cache.
    const audioJobs = new Map<string, Promise<void>>();
    const warmAudioOnce = (url: string) => {
      let job = audioJobs.get(url);
      if (!job) {
        job = warmAudioUrl(url);
        audioJobs.set(url, job);
      }
      return job;
    };
    const counted = (job: Promise<unknown>) => job.catch(() => {}).then(bump);
    // Known images/voices start immediately. Each answer voice starts as soon as its own URL is
    // resolved, rather than waiting for the slowest concat before warming the entire round.
    const jobs = [
      ...imageUrls.map((url) => counted(warmImageUrl(url))),
      ...audioUrls.map((url) => counted(warmAudioOnce(url))),
      ...(ttsSpec?.items.map((it) =>
        counted(
          resolveTtsUrl({
            text: it.text,
            language: ttsSpec.language,
            storybookId,
            directUrl: it.directUrl,
            identifierPrefix: ttsSpec.identifierPrefix,
          }).then((url) => (alive && url ? warmAudioOnce(url) : undefined))
        )
      ) ?? []),
    ];
    void Promise.all(jobs).then(() => {
      if (alive) {
        clearTimeout(cap);
        setReady(true);
      }
    });

    return () => {
      alive = false;
      clearTimeout(cap);
    };
  }, [coreKey]);

  useEffect(() => {
    for (const u of scene.sceneImages) void warmImageUrl(u);
    for (const u of scene.sceneNarrations) void warmAudioUrl(u);
  }, [bgKey]);

  return { ready, loaded, total };
}
