import { useEffect, useMemo, useState } from 'react';
import type { Lang, Storybook, GameTypeId } from '@tangobook/shared';
import { resolveTtsUrl } from '@/features/tts';
import { warmImageUrl, warmAudioUrl } from './useGamePrefetch';
import {
  extractItemImages,
  extractItemWords,
  collectSyllableUrls,
  collectSceneAssets,
  buildTtsSpec,
} from '../lib/collect-game-assets';

const PRELOAD_MAX_MS = 6000;

interface Args {
  data: { type: string; items?: Array<Record<string, unknown>> };
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

  const [loaded, setLoaded] = useState(0);
  const [total, setTotal] = useState(0);
  const [ready, setReady] = useState(false);

  const coreKey = [
    ...images,
    ...syllables,
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

      const coreAudio = [...syllables, ...resolvedTts];
      const coreTotal = images.length + coreAudio.length;
      setTotal(coreTotal);
      if (coreTotal === 0) {
        setReady(true);
        return;
      }

      const cap = setTimeout(() => {
        if (alive) setReady(true);
      }, PRELOAD_MAX_MS);
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
    };
  }, [coreKey]);

  useEffect(() => {
    for (const u of scene.sceneImages) void warmImageUrl(u);
    for (const u of scene.sceneNarrations) void warmAudioUrl(u);
  }, [bgKey]);

  return { ready, loaded, total };
}
