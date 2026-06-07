import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('../../lib/channel-translator', () => ({
  translateAndSaveChannel: vi.fn().mockResolvedValue('https://r2/x.html'),
  getChannelTranslationUrl: vi.fn().mockResolvedValue('https://r2/x.html'),
}));

import { translateAndSaveChannel, getChannelTranslationUrl } from '../../lib/channel-translator';
import { useTranslateChannel, useChannelTranslationUrl } from '../use-translations';
import { mktKeys } from '../queries';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}
function wrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useTranslateChannel', () => {
  let queryClient: QueryClient;
  beforeEach(() => {
    queryClient = makeQueryClient();
    vi.clearAllMocks();
  });

  it('calls translateAndSaveChannel and invalidates both translation keys', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useTranslateChannel(), { wrapper: wrapper(queryClient) });
    await act(async () => {
      await result.current.mutateAsync({
        projectId: 'p-1',
        contentId: 'c-1',
        project: { id: 'p-1' } as never,
        targetLang: 'en',
        channel: 'instagram',
        sourceHtml: '<p>x</p>',
      });
    });
    expect(translateAndSaveChannel).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: mktKeys.translation('c-1', 'instagram', 'en'),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: mktKeys.translationHtml('c-1', 'instagram', 'en'),
    });
  });
});

describe('useChannelTranslationUrl', () => {
  let queryClient: QueryClient;
  beforeEach(() => {
    queryClient = makeQueryClient();
    vi.clearAllMocks();
  });

  it('is disabled (does not call) for ko', async () => {
    renderHook(() => useChannelTranslationUrl('c-1', 'base', 'ko'), {
      wrapper: wrapper(queryClient),
    });
    // give the query a tick; it must NOT fire for ko
    await new Promise((r) => setTimeout(r, 10));
    expect(getChannelTranslationUrl).not.toHaveBeenCalled();
  });

  it('fetches the url for a non-ko language', async () => {
    const { result } = renderHook(() => useChannelTranslationUrl('c-1', 'base', 'en'), {
      wrapper: wrapper(queryClient),
    });
    await waitFor(() => expect(result.current.data).toBe('https://r2/x.html'));
    expect(getChannelTranslationUrl).toHaveBeenCalledWith('c-1', 'en', 'base');
  });
});
