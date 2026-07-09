import type { Lang, Storybook } from '@tangobook/shared';
import { resolveSceneFromWord } from './resolve-scene';

/** getGameData 반환 union — 게임별 items 형태만 최소로 안다. */
type AnyGameData = { type: string; items?: Array<Record<string, unknown>> };

/** 게임 데이터의 모든 아이템 이미지 URL (점잇기는 originalImageUrl). 빈 값 제외. */
export function extractItemImages(data: AnyGameData): string[] {
  const out: string[] = [];
  for (const it of data.items ?? []) {
    const url = (it.imageUrl as string) || (it.originalImageUrl as string);
    if (url) out.push(url);
  }
  return out;
}

/** 게임 데이터의 모든 아이템 단어 (점잇기는 objectName). 빈 값 제외. */
export function extractItemWords(data: AnyGameData): string[] {
  const out: string[] = [];
  for (const it of data.items ?? []) {
    const w = (it.word as string) || (it.objectName as string);
    if (w) out.push(w);
  }
  return out;
}

/**
 * 단어들의 한글 음절(가-힣)을 phonics 맵에서 lookup. 중복 제거.
 * map 은 usePhonicsMap 의 mapRef.current (미로드 시 null → 빈 배열).
 * 원본: KoreanBlockPlayer 의 syllableUrls useMemo.
 */
export function collectSyllableUrls(words: string[], map: Map<string, string> | null): string[] {
  if (!map) return [];
  const urls = new Set<string>();
  for (const w of words) {
    for (const ch of [...(w ?? '')]) {
      if (/[가-힣]/.test(ch)) {
        const u = map.get(ch);
        if (u) urls.add(u);
      }
    }
  }
  return [...urls];
}

const SCENE_GAMES = new Set(['korean-block', 'english-block']);

/**
 * 블록 게임 한정: 각 단어의 SceneReveal 삽화 + 나레이션 URL 수집.
 * resolveSceneFromWord 는 동기. book 없거나 비블록 게임이면 빈 결과.
 */
export function collectSceneAssets(
  words: string[],
  lang: Lang,
  book: Storybook | undefined,
  style: string | undefined,
  game: string
): { sceneImages: string[]; sceneNarrations: string[] } {
  const sceneImages: string[] = [];
  const sceneNarrations: string[] = [];
  if (!book || !SCENE_GAMES.has(game)) return { sceneImages, sceneNarrations };
  for (const w of words) {
    const scene = resolveSceneFromWord(w, lang, book, style);
    if (scene?.illustrationUrl) sceneImages.push(scene.illustrationUrl);
    if (scene?.pageTtsUrl) sceneNarrations.push(scene.pageTtsUrl);
  }
  return { sceneImages, sceneNarrations };
}

export interface TtsSpec {
  items: Array<{ text: string; directUrl?: string }>;
  language: 'korean' | 'english';
  identifierPrefix: string;
}

// 점잇기/LineMatching 은 제외 — 점잇기는 런타임 target resolve(플레이어 프리워밍 유지),
// LineMatching 은 음절 직접 재생(concat 미사용).
const TTS_PREFIX: Record<string, { prefix: string; language: 'korean' | 'english' }> = {
  'korean-block': { prefix: 'kblock', language: 'korean' },
  'english-block': { prefix: 'eblock', language: 'english' },
  'korean-word-writing': { prefix: 'wwrite-ko', language: 'korean' },
  'english-word-writing': { prefix: 'wwrite-en', language: 'english' },
};

/**
 * 게임별 정답 TTS 프리워밍 스펙. 대상 아닌 게임은 null.
 * text/directUrl 은 각 플레이어의 prewarmItems(= { text: it.word, directUrl: it.ttsUrl })와 동일.
 * ⚠️ directUrl 을 빼면 영어 프리워밍이 런타임과 다른 URL 을 데운다 — 반드시 포함.
 */
export function buildTtsSpec(data: AnyGameData, game: string): TtsSpec | null {
  const cfg = TTS_PREFIX[game];
  if (!cfg) return null;
  const items = (data.items ?? [])
    .map((it) => ({ text: (it.word as string) ?? '', directUrl: it.ttsUrl as string | undefined }))
    .filter((i) => !!i.text);
  if (items.length === 0) return null;
  return { items, language: cfg.language, identifierPrefix: cfg.prefix };
}
