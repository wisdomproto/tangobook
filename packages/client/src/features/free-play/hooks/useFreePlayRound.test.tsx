import type { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useFreePlayRound } from './useFreePlayRound';
import { makeFreePlayRound } from '../lib/free-play';
import { storybookApi } from '@/features/storybook/api/storybook.api';
import type { FreePlayLanguage } from '../lib/free-play-options';

vi.mock('../lib/free-play', () => ({ makeFreePlayRound: vi.fn(async () => null) }));
vi.mock('../api/free-play.api', () => ({ getFreePlayCatalog: vi.fn(async () => []) }));
vi.mock('@/features/storybook/api/storybook.api', () => ({
  storybookApi: { list: vi.fn(async () => []), getById: vi.fn() },
}));

it('separates game rounds by language while reusing the public source catalog', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const view = renderHook(
    ({ lang }: { lang: FreePlayLanguage }) => useFreePlayRound('blocks', 'same-session', lang),
    { wrapper, initialProps: { lang: 'ko' as FreePlayLanguage } }
  );
  await waitFor(() => expect(view.result.current.isSuccess).toBe(true));
  view.rerender({ lang: 'en' });
  await waitFor(() =>
    expect(makeFreePlayRound).toHaveBeenLastCalledWith('blocks', expect.any(Object), 'en')
  );
  await waitFor(() => expect(view.result.current.isSuccess).toBe(true));
  expect(client.getQueryData(['home-free-play', 'blocks', 'en', 'same-session'])).toBeNull();
  expect(storybookApi.list).toHaveBeenCalledTimes(1);
  expect(makeFreePlayRound).toHaveBeenCalledWith('blocks', expect.any(Object), 'ko');
  view.unmount();
  client.clear();
});
