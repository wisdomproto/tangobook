import type { LoaderFunctionArgs } from 'react-router-dom';
import { queryClient } from '@/lib/query-client';
import { storybookApi } from '@/features/storybook/api/storybook.api';

const GAME_ENTRIES = new Set([
  'game-english-block',
  'game-english-block-listen',
  'game-line-matching',
]);

/** Start the existing unit query before React/lazy activity code mounts; never delay navigation. */
export function englishGameLoader({ params }: Pick<LoaderFunctionArgs, 'params'>) {
  const { unitId, activityKey } = params;
  if (unitId && activityKey && GAME_ENTRIES.has(activityKey)) {
    void queryClient.prefetchQuery({
      queryKey: ['storybook', unitId],
      queryFn: () => storybookApi.getById(unitId),
    });
  }
  return null;
}
