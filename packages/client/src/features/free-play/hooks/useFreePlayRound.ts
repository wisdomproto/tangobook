import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColoringCatalogEntry, HiddenObjectCatalogEntry } from '@tangobook/shared';
import { storybookApi } from '@/features/storybook/api/storybook.api';
import { makeFreePlayRound } from '../lib/free-play';
import type { FreePlayKind, FreePlayLanguage } from '../lib/free-play-options';
import { getFreePlayCatalog } from '../api/free-play.api';

export function useFreePlayRound(
  kind: FreePlayKind,
  session: string,
  lang: FreePlayLanguage = 'ko'
) {
  const client = useQueryClient();
  return useQuery({
    queryKey: ['home-free-play', kind, lang, session],
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    queryFn: async ({ signal }) => {
      const catalogKind = kind === 'hidden-object' ? 'hidden-object' : 'coloring';
      const [books, catalog] = await Promise.all([
        client.fetchQuery({
          queryKey: ['storybooks'],
          queryFn: storybookApi.list,
          staleTime: 60_000,
        }),
        client.fetchQuery({
          queryKey: ['activity-data', catalogKind],
          staleTime: 3_600_000,
          queryFn: ({ signal: catalogSignal }) => getFreePlayCatalog(catalogKind, catalogSignal),
        }),
      ]);
      return makeFreePlayRound(
        kind,
        {
          books,
          coloring: catalogKind === 'coloring' ? (catalog as ColoringCatalogEntry[]) : undefined,
          hidden:
            catalogKind === 'hidden-object' ? (catalog as HiddenObjectCatalogEntry[]) : undefined,
          loadBook: (id) => {
            signal.throwIfAborted();
            return client.fetchQuery({
              queryKey: ['storybook', id],
              queryFn: () => storybookApi.getById(id),
              staleTime: 60_000,
            });
          },
        },
        lang
      );
    },
  });
}
