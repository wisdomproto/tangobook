import type { Lang, Storybook } from '@tangobook/shared';
import type { ColoringItem } from '../components/players/ColoringPlayer';

export interface EditorColoringScene {
  key: string;
  bookId: string;
  pageNumber: number;
  lineartUrl: string;
  colorSourceUrl: string;
  text: string;
  ttsUrl?: string | null;
  translations: Record<string, { text?: string; ttsUrl?: string | null }>;
  backgroundMusicUrl?: string;
  colorSampling?: 'median';
}

export type SceneColoringCatalog = Record<string, EditorColoringScene[]>;

/** Keep exact book/page identity and source pixels, while reading the current editor language. */
export function editorSceneColoringItem(
  scene: EditorColoringScene,
  book: Storybook,
  lang: Lang
): ColoringItem | null {
  if (scene.bookId !== book.id) return null;
  const page = book.pages?.find((p) => p.pageNumber === scene.pageNumber);
  const content =
    lang === 'ko' ? (page ?? scene) : (page?.translations?.[lang] ?? scene.translations[lang]);
  if (!content?.text) return null;
  const language = { ko: 'korean', en: 'english', vi: 'vi', zh: 'zh', th: 'th' } as const;
  return {
    word: `${book.title.replace(/_그림체[123]$/, '')} · ${scene.pageNumber}쪽`,
    lineartUrl: scene.lineartUrl,
    colorSourceUrl: scene.colorSourceUrl,
    originalUrl: scene.colorSourceUrl,
    lang,
    language: language[lang],
    // Deliberately no storybookId: explicit scene supplies the exact page, not a word lookup.
    scene: {
      pageNumber: scene.pageNumber,
      illustrationUrl: scene.colorSourceUrl,
      text: content.text,
      ttsUrl: content.ttsUrl ?? undefined,
      backgroundMusicUrl: book.backgroundMusicUrl ?? scene.backgroundMusicUrl,
      colorSampling: scene.colorSampling,
    },
  };
}
