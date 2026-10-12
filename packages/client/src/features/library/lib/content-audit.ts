import type { Storybook } from '@tangobook/shared';
import { deriveStorybookUnit } from '@/features/vocabulary-unit/lib/derive-storybook-unit';
import { getAvailableGames } from '@/features/vocabulary-unit/lib/game-data-adapter';
import {
  coloringBookId,
  countColoringSheets,
  type ColoringBookIndex,
} from '@/features/games/hooks/useColoringSheets';
import {
  editorSceneColoringItem,
  type SceneColoringCatalog,
} from '@/features/games/lib/editor-scene-coloring';

export interface ContentCount {
  have: number;
  total: number;
  missing: string[];
  broken: string[];
}
export interface LibraryContentRow {
  id: string;
  title: string;
  category: string;
  public: boolean;
  cover: boolean;
  illustrations: ContentCount;
  ko: ContentCount;
  en: ContentCount;
  english: ContentCount;
  words: ContentCount;
  vocabularyHidden: boolean;
  games: { ko: string[]; en: string[]; stored: string[] };
  coloring: { ko: number; en: number; total: number; broken: string[] };
  sceneColoring: number;
  hiddenScenes: number;
  hiddenPlayable: boolean;
}
export interface LibraryContentAudit {
  generatedAt: string;
  assetCheckedAt?: string;
  rows: LibraryContentRow[];
  fetchFailed: string[];
  excludedPhonics: number;
}
export function r2AssetKey(url: string): string | undefined {
  try {
    const u = new URL(url, 'https://www.tangobook.co.kr');
    return (
      u.searchParams.get('key') ??
      (/^(assets\.tangobook\.co\.kr)$|\.r2\.dev$/.test(u.hostname)
        ? decodeURIComponent(u.pathname).replace(/^\//, '')
        : undefined)
    );
  } catch {
    return undefined;
  }
}
const blank = (): ContentCount => ({ have: 0, total: 0, missing: [], broken: [] });
const present = (v?: string) => !!v?.trim();
function add(count: ContentCount, label: string, url?: string, keys?: Set<string>) {
  count.total++;
  if (!present(url)) {
    count.missing.push(label);
    return;
  }
  const key = r2AssetKey(url!);
  if (keys && key && !keys.has(key)) {
    count.broken.push(label);
    return;
  }
  count.have++;
}
export function auditLibraryBook(
  book: Storybook,
  index: ColoringBookIndex,
  scenes: SceneColoringCatalog,
  keys?: Set<string>,
  brokenColoring: string[] = []
): LibraryContentRow {
  const illustrations = blank(),
    ko = blank(),
    en = blank(),
    english = blank(),
    words = blank();
  (book.pages ?? []).forEach((p, i) => {
    const n = p.pageNumber ?? (p as unknown as { page_number?: number }).page_number ?? i + 1;
    add(illustrations, `${n}쪽`, p.illustrationUrl, keys);
    // Intentional textless end pages do not require narration or translation.
    if (present(p.text)) {
      add(ko, `${n}쪽`, p.ttsUrl, keys);
      add(en, `${n}쪽`, p.translations?.en?.ttsUrl, keys);
      add(english, `${n}쪽`, p.translations?.en?.text);
    }
  });
  (book.key_objects ?? []).forEach((w) =>
    add(
      words,
      w.korean || w.name,
      book.keyObjectImages?.find((im) => im.objectName === w.name)?.imageUrl,
      keys
    )
  );
  // File-aware investigations must not report broken URLs as playable game assets.
  const usable = (url?: string) => {
    const key = url ? r2AssetKey(url) : undefined;
    return !keys || !key || keys.has(key);
  };
  const gameBook = keys ? structuredClone(book) : book;
  if (keys) {
    for (const p of gameBook.pages ?? []) {
      if (!usable(p.illustrationUrl)) p.illustrationUrl = undefined;
      if (!usable(p.ttsUrl)) p.ttsUrl = undefined;
      for (const tr of Object.values(p.translations ?? {}))
        if (!usable(tr.ttsUrl)) tr.ttsUrl = undefined;
    }
    gameBook.keyObjectImages = gameBook.keyObjectImages?.filter((im) => usable(im.imageUrl));
    gameBook.hiddenObjectScenes = gameBook.hiddenObjectScenes?.filter((s) =>
      usable(s.sceneImageUrl)
    );
  }
  const unit = deriveStorybookUnit(gameBook);
  const sheetWords = (index[coloringBookId(book)] ?? []).filter((w) => !brokenColoring.includes(w));
  const coloring = {
    ko: countColoringSheets(sheetWords, book, 'ko'),
    en: countColoringSheets(sheetWords, book, 'en'),
    total: sheetWords.length,
    broken: brokenColoring,
  };
  const available = (lang: 'ko' | 'en') =>
    getAvailableGames(unit, lang, (k) => k, gameBook, undefined, coloring[lang])
      .filter((g) => g.available && (!book.hideVocabulary || g.group === 'story'))
      .map((g) => g.id);
  const games = {
    ko: available('ko'),
    en: available('en'),
    stored: (book.games ?? []).map((g) => g.gameType),
  };
  return {
    id: book.id,
    title: book.title,
    category: book.category || '기타',
    public: book.isPublic !== false,
    cover:
      !!(book.primaryCoverByLang?.ko || book.coverImage) &&
      usable(book.primaryCoverByLang?.ko || book.coverImage),
    illustrations,
    ko,
    en,
    english,
    words,
    vocabularyHidden: !!book.hideVocabulary,
    games,
    coloring,
    sceneColoring: (scenes[book.id] ?? []).filter(
      (s) =>
        usable(s.lineartUrl) &&
        usable(s.colorSourceUrl) &&
        editorSceneColoringItem(s, gameBook, 'ko') !== null
    ).length,
    hiddenScenes: (book.hiddenObjectScenes ?? []).filter(
      (s) => s.sceneImageUrl && s.hotspots?.length
    ).length,
    hiddenPlayable: games.ko.includes('hidden-object'),
  };
}
export function completeCount(c: ContentCount): boolean {
  return c.total > 0 && c.have === c.total;
}
export function readingReady(row: LibraryContentRow): boolean {
  return row.cover && completeCount(row.illustrations) && completeCount(row.ko);
}

export const GAME_NAMES: Record<string, string> = {
  'korean-line-matching': '한글 그림 연결',
  'english-line-matching': '영어 그림 연결',
  'korean-block': '한글 블록',
  'english-block': '영어 블록',
  'korean-word-writing': '한글 쓰기',
  'english-word-writing': '영어 쓰기',
  'connect-the-dots': '점잇기',
  coloring: '단어 색칠',
  'korean-story-image': '이야기 듣고 그림 찾기',
  'english-story-image': '영어 듣고 그림 찾기',
  'korean-page-order': '이야기 순서',
  'korean-object-scene': '물건과 장면',
  'hidden-object': '숨은그림찾기',
};
