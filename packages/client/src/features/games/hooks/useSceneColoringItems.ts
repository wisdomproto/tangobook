import { useQuery } from '@tanstack/react-query';
import type { Lang, Storybook } from '@tangobook/shared';
import { editorSceneColoringItem, type SceneColoringCatalog } from '../lib/editor-scene-coloring';

/** Lightweight availability index; the full catalog is loaded only when the game opens. */
export function useSceneColoringCount(bookId: string | undefined, lang: Lang): number {
  const { data } = useQuery({
    queryKey: ['scene-coloring', 'book-index'],
    queryFn: async (): Promise<Record<string, Partial<Record<Lang, number>>>> => {
      const response = await fetch('/scene-coloring/book-index.json');
      if (!response.ok) throw new Error(`Scene coloring index ${response.status}`);
      return response.json();
    },
    enabled: !!bookId,
    staleTime: Infinity,
  });
  return bookId ? (data?.[bookId]?.[lang] ?? 0) : 0;
}

export function useSceneColoringItems(book: Storybook, lang: Lang) {
  const query = useQuery({
    queryKey: ['scene-coloring', 'editor-catalog'],
    queryFn: async () =>
      (await import('../data/scene-coloring-catalog.json')).default as SceneColoringCatalog,
    staleTime: Infinity,
  });
  const items = (query.data?.[book.id] ?? [])
    .map((scene) => editorSceneColoringItem(scene, book, lang))
    .filter((item) => item !== null);
  return { items, isPending: query.isPending };
}
