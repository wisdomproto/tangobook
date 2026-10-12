import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { storybookApi } from '@/features/storybook/api/storybook.api';
import type { ColoringBookIndex } from '@/features/games/hooks/useColoringSheets';
import type { SceneColoringCatalog } from '@/features/games/lib/editor-scene-coloring';
import {
  auditLibraryBook,
  type LibraryContentAudit,
  type LibraryContentRow,
} from '../lib/content-audit';

async function json<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, cache: 'no-store' });
  if (!response.ok) throw new Error(`현황 자료를 불러오지 못했습니다 (${response.status}).`);
  return response.json() as Promise<T>;
}
export function useLibraryContentAudit() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const snapshot = useQuery({
    queryKey: ['library-content-snapshot'],
    queryFn: ({ signal }) => json<LibraryContentAudit>('/library-content-audit.json', signal),
    staleTime: Infinity,
    retry: false,
  });
  const live = useQuery<LibraryContentAudit>({
    queryKey: ['library-content-audit'],
    enabled: false,
    retry: false,
    queryFn: async () => {
      const [list, index, catalog] = await Promise.all([
        storybookApi.list(),
        json<ColoringBookIndex>('/coloring/book-index.json'),
        import('@/features/games/data/scene-coloring-catalog.json'),
      ]);
      const books = list.filter((b) => !b.type || b.type === 'storybook');
      setProgress({ done: 0, total: books.length });
      const rows: LibraryContentRow[] = [],
        fetchFailed: string[] = [];
      let cursor = 0,
        done = 0;
      await Promise.all(
        Array.from({ length: 8 }, async () => {
          while (cursor < books.length) {
            const summary = books[cursor++];
            try {
              const book = await storybookApi.getById(summary.id);
              rows.push(auditLibraryBook(book, index, catalog.default as SceneColoringCatalog));
              queryClient.setQueryData(['storybook', book.id], book);
            } catch {
              fetchFailed.push(summary.id);
            }
            setProgress({ done: ++done, total: books.length });
          }
        })
      );
      return {
        generatedAt: new Date().toISOString(),
        rows,
        fetchFailed,
        excludedPhonics: list.length - books.length,
      } satisfies LibraryContentAudit;
    },
  });
  return {
    data: live.data ?? snapshot.data,
    isLoading: snapshot.isLoading && !live.data,
    error: live.error ?? (!live.data ? snapshot.error : null),
    refreshing: live.isFetching,
    progress,
    refresh: () => live.refetch(),
  };
}
