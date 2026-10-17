import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { queryClient } from '@/lib/query-client';
import { storybookApi } from '@/features/storybook/api/storybook.api';
import { englishGameLoader } from './english-game-loader';
import type { Storybook } from '@tangobook/shared';

vi.mock('@/features/storybook/api/storybook.api', () => ({
  storybookApi: { getById: vi.fn() },
}));
beforeEach(() => {
  queryClient.clear();
  vi.clearAllMocks();
});
afterEach(() => queryClient.clear());

it.each(['game-english-block', 'game-english-block-listen', 'game-line-matching'])(
  'starts %s data early without waiting and shares the query with the real screen',
  async (activityKey) => {
    let finish!: (value: Storybook) => void;
    vi.mocked(storybookApi.getById).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const params = { unitId: 'en-b3-u01', activityKey };
    expect(englishGameLoader({ params })).toBeNull();
    expect(englishGameLoader({ params })).toBeNull();
    const screen = queryClient.fetchQuery({
      queryKey: ['storybook', params.unitId],
      queryFn: () => storybookApi.getById(params.unitId),
    });
    expect(storybookApi.getById).toHaveBeenCalledTimes(1);
    finish({ id: params.unitId } as Storybook);
    await expect(screen).resolves.toEqual({ id: params.unitId });
  }
);

it('reuses the existing fresh unit cache without changing its policy', async () => {
  const params = { unitId: 'en-b2-u01', activityKey: 'game-line-matching' };
  queryClient.setQueryData(['storybook', params.unitId], { id: params.unitId });
  englishGameLoader({ params });
  await Promise.resolve();
  expect(storybookApi.getById).not.toHaveBeenCalled();
});

it.each([
  { unitId: undefined, activityKey: 'game-english-block' },
  { unitId: 'en-b1-u01', activityKey: 'letters-write' },
  { unitId: 'en-b1-u01', activityKey: undefined },
])('does not add a speculative query for other activities/missing ids', (params) => {
  englishGameLoader({ params });
  expect(storybookApi.getById).not.toHaveBeenCalled();
});

it('keeps query failure in the existing query path, not a route error', async () => {
  const params = { unitId: 'en-error', activityKey: 'game-line-matching' };
  queryClient.setQueryDefaults(['storybook', params.unitId], { retry: false });
  vi.mocked(storybookApi.getById).mockRejectedValue(new Error('offline'));
  expect(englishGameLoader({ params })).toBeNull();
  await waitFor(() =>
    expect(queryClient.getQueryState(['storybook', params.unitId])?.status).toBe('error')
  );
});
