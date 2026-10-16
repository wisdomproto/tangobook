import type {
  ColoringCatalogEntry,
  HiddenObjectCatalogEntry,
  HiddenObjectData,
  KoreanBlockData,
  EnglishBlockData,
  Storybook,
  StorybookSummary,
  WordWritingData,
} from '@tangobook/shared';
import { deriveStorybookUnit } from '@/features/vocabulary-unit/lib/derive-storybook-unit';
import {
  unitToKoreanBlockData,
  unitToEnglishBlockData,
  unitToWordWritingData,
} from '@/features/vocabulary-unit/lib/game-data-adapter';
import { buildHiddenObjectSceneData } from '@/features/games/lib/hidden-object-data';

import type { FreePlayKind, FreePlayLanguage } from './free-play-options';
import { CAMBRIDGE_STARTERS_TOPICS } from '@tangobook/shared';

const beginnerEnglishWords = new Set(CAMBRIDGE_STARTERS_TOPICS.flatMap((topic) => topic.words));
export const isEasyEnglishPlayWord = (word: string): boolean =>
  /^[a-z]{2,4}$/i.test(word) && beginnerEnglishWords.has(word.toLowerCase());

/** Standalone easy practice, not a claim about the child's learned curriculum. */
export function isEasyPlayWord(word: string): boolean {
  if (!/^[가-힣]{1,2}$/.test(word)) return false;
  const basicVowels = new Set([0, 2, 4, 6, 8, 12, 13, 17, 18, 20]);
  const tense = new Set([1, 4, 8, 10, 13]);
  return [...word].every((letter) => {
    const code = letter.charCodeAt(0) - 0xac00;
    return (
      code % 28 === 0 &&
      !tense.has(Math.floor(code / 588)) &&
      basicVowels.has(Math.floor((code % 588) / 28))
    );
  });
}

function shuffled<T>(values: readonly T[]): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export type FreePlayRound =
  | { kind: 'blocks'; bookId: string; data: KoreanBlockData | EnglishBlockData }
  | { kind: 'writing'; bookId: string; data: WordWritingData }
  | { kind: 'coloring'; bookId: string; entry: ColoringCatalogEntry; ttsUrl?: string }
  | { kind: 'hidden-object'; bookId: string; data: HiddenObjectData };

/** Keep all authored boxes for a chosen object, even if the object has two positions. */
export function easyHiddenScene(data: HiddenObjectData): HiddenObjectData {
  return {
    ...data,
    scenes: data.scenes.slice(0, 1).map((scene) => {
      const names = shuffled([...new Set(scene.targets.map((target) => target.objectName))]).slice(
        0,
        3
      );
      return {
        ...scene,
        targets: scene.targets.filter((target) => names.includes(target.objectName)),
      };
    }),
  };
}

interface RoundSources {
  books: StorybookSummary[];
  coloring?: ColoringCatalogEntry[];
  hidden?: HiddenObjectCatalogEntry[];
  loadBook: (id: string) => Promise<Storybook>;
}

/** One real book per round keeps TTS, illustrations and scene reveals in the same context. */
export async function makeFreePlayRound(
  kind: FreePlayKind,
  sources: RoundSources,
  lang: FreePlayLanguage = 'ko'
): Promise<FreePlayRound | null> {
  const publicIds = new Set(
    sources.books
      .filter(
        (book) =>
          book.isPublic &&
          book.type !== 'phonics' &&
          (kind === 'coloring' || kind === 'hidden-object' || book.category === '세계 명작')
      )
      .map((book) => book.id)
  );
  const coloring = (sources.coloring ?? []).filter(
    (entry) =>
      entry.bookId &&
      publicIds.has(entry.bookId) &&
      entry.lineartUrl &&
      entry.originalUrl &&
      (lang === 'en' || isEasyPlayWord(entry.word))
  );
  const hidden = (sources.hidden ?? []).filter(
    (entry) => publicIds.has(entry.bookId) && entry.sceneImageUrl && new Set(entry.words).size >= 2
  );
  // Prefer already-small scenes; larger authored scenes can supply three targets without changing positions.
  const simpleScenes = hidden.filter((entry) => new Set(entry.words).size <= 3);
  const entries =
    kind === 'hidden-object' ? (simpleScenes.length ? simpleScenes : hidden) : coloring;
  const bookIds = shuffled([...new Set(entries.map((entry) => entry.bookId!))]);
  for (const bookId of bookIds.slice(0, 6)) {
    const book = await sources.loadBook(bookId);
    // Recheck full data: a stale static catalog must not reopen unpublished content.
    if (
      !book.isPublic ||
      book.type === 'phonics' ||
      ((kind === 'blocks' || kind === 'writing') && book.category !== '세계 명작')
    )
      continue;
    if (kind === 'hidden-object') {
      for (const entry of shuffled(entries.filter((entry) => entry.bookId === bookId))) {
        const data = buildHiddenObjectSceneData(book, undefined, entry.key, lang);
        if (data) return { kind, bookId, data: easyHiddenScene(data) };
      }
    } else if (kind === 'coloring') {
      for (const entry of shuffled(coloring.filter((entry) => entry.bookId === bookId))) {
        if (lang === 'ko') return { kind, bookId, entry };
        const object = book.key_objects?.find(
          (object) =>
            object.name === entry.word ||
            object.korean === entry.word ||
            object.nameEn === entry.word
        );
        const word = object?.nameEn?.trim();
        if (word && isEasyEnglishPlayWord(word))
          return { kind, bookId, entry: { ...entry, word }, ttsUrl: object?.ttsUrls?.en };
      }
    } else {
      if (book.hideVocabulary) continue;
      const unit = deriveStorybookUnit(book);
      const seen = new Set<string>();
      unit.words = shuffled(
        unit.words.filter((word) => {
          const label =
            lang === 'en' ? (word.nameEn?.trim().toLowerCase() ?? '') : (word.korean ?? '');
          if (
            !(lang === 'en' ? isEasyEnglishPlayWord(label) : isEasyPlayWord(label)) ||
            seen.has(label) ||
            !word.images?.some((image) => image.imageUrl)
          )
            return false;
          seen.add(label);
          if (lang === 'en') word.word = label;
          return true;
        })
      ).slice(0, 3);
      if (kind === 'blocks') {
        const data = lang === 'en' ? unitToEnglishBlockData(unit) : unitToKoreanBlockData(unit);
        if (data?.items.length) return { kind, bookId, data };
      } else {
        const data = unitToWordWritingData(unit, lang);
        if (data?.items.length) return { kind, bookId, data };
      }
    }
  }
  return null;
}
