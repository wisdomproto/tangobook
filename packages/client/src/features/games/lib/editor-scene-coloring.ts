import type { Lang, Storybook } from '@tangobook/shared';
import type { ColoringItem } from '../components/players/ColoringPlayer';

export interface EditorColoringScene {
  key: string;
  bookId: string;
  pageNumber: number;
  lineartUrl: string;
  colorSourceUrl: string;
  /** 정렬된 색 답안과 별도로 완료 때 보여 줄 실제 본문 삽화. */
  originalUrl?: string;
  /** 얇은 목끈 등 검수된 작은 칸을 포함할 때만 지정한다. */
  minRegionAreaRatio?: number;
  text: string;
  ttsUrl?: string | null;
  translations: Record<string, { text?: string; ttsUrl?: string | null }>;
  backgroundMusicUrl?: string;
  colorSampling?: 'median';
}

export type SceneColoringCatalog = Record<string, EditorColoringScene[]>;

function canvasAssetUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'assets.tangobook.co.kr' && !parsed.hostname.endsWith('.r2.dev'))
      return url;
    const query = new URLSearchParams({
      key: decodeURIComponent(parsed.pathname).replace(/^\//, ''),
    });
    if (parsed.searchParams.has('v')) query.set('v', parsed.searchParams.get('v')!);
    return '/api/r2-proxy?' + query.toString();
  } catch {
    return url;
  }
}

/** Keep exact book/page identity and source pixels, while reading the current editor language. */
export function editorSceneColoringItem(
  scene: EditorColoringScene,
  book: Storybook,
  lang: Lang
): ColoringItem | null {
  if (scene.bookId !== book.id) return null;
  const page = book.pages?.find(
    (p, i) =>
      (p.pageNumber ?? (p as unknown as { page_number?: number }).page_number ?? i + 1) ===
      scene.pageNumber
  );
  const content =
    lang === 'ko' ? (page ?? scene) : (page?.translations?.[lang] ?? scene.translations[lang]);
  if (!content?.text) return null;
  const language = { ko: 'korean', en: 'english', vi: 'vi', zh: 'zh', th: 'th' } as const;
  return {
    word: `${(lang === 'ko' ? book.title : (book.titleTranslations?.[lang] ?? book.title)).replace(/_그림체[123]$/, '')} · ${lang === 'en' ? 'p. ' : ''}${scene.pageNumber}${lang === 'en' ? '' : '쪽'}`,
    lineartUrl: canvasAssetUrl(scene.lineartUrl),
    colorSourceUrl: canvasAssetUrl(scene.colorSourceUrl),
    originalUrl: scene.originalUrl ?? scene.colorSourceUrl,
    lang,
    language: language[lang],
    // Deliberately no storybookId: explicit scene supplies the exact page, not a word lookup.
    scene: {
      pageNumber: scene.pageNumber,
      illustrationUrl: scene.originalUrl ?? scene.colorSourceUrl,
      text: content.text,
      ttsUrl: content.ttsUrl ?? undefined,
      backgroundMusicUrl: book.backgroundMusicUrl ?? scene.backgroundMusicUrl,
      colorSampling: scene.colorSampling,
      minRegionAreaRatio: scene.minRegionAreaRatio,
    },
  };
}
