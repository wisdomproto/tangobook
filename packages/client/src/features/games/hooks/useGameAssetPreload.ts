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

  const coreKey = [
    ...images,
    ...syllables,
    ...roundAudio,
    ttsSpec ? `${ttsSpec.identifierPrefix}:${ttsSpec.items.length}` : '',
    storybookId,
    phonicsReady,
  ].join('|');
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

    void (async () => {
      const resolvedTts = ttsSpec
        ? (
            await Promise.all(
              ttsSpec.items.map((it) =>
                resolveTtsUrl({
                  text: it.text,
                  language: ttsSpec.language,
                  storybookId,
                  directUrl: it.directUrl,
                  identifierPrefix: ttsSpec.identifierPrefix,
                }).catch(() => undefined)
              )
            )
          ).filter((u): u is string => !!u)
        : [];
      if (!alive) return;

      const coreAudio = [...syllables, ...resolvedTts, ...roundAudio];
      const coreTotal = images.length + coreAudio.length;
      setTotal(coreTotal);
      if (coreTotal === 0) {
        clearTimeout(cap);
        setReady(true);
        return;
      }

      const bump = () => {
        if (alive) setLoaded((n) => n + 1);
      };
      await Promise.all([
        ...images.map((u) => warmImageUrl(u).then(bump)),
        ...coreAudio.map((u) => warmAudioUrl(u).then(bump)),
      ]);
      if (alive) {
        clearTimeout(cap);
        setReady(true);
      }
    })();

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
