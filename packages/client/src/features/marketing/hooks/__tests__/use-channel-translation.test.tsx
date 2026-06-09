import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('../../lib/channel-translator', () => ({
  getChannelTranslationUrl: vi.fn(),
}));
import { getChannelTranslationUrl } from '../../lib/channel-translator';
import { useChannelTranslation } from '../use-channel-translation';

function wrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}
function makeQc() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn());
});

it('returns html:null for ko and never fetches', async () => {
  const { result } = renderHook(() => useChannelTranslation('c-1', 'base', 'ko'), {
    wrapper: wrapper(makeQc()),
  });
  await new Promise((r) => setTimeout(r, 10));
  expect(result.current.html).toBeNull();
  expect(getChannelTranslationUrl).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
});

it('fetches translated HTML via /api/mkt/storage/proxy when a URL exists', async () => {
  vi.mocked(getChannelTranslationUrl).mockResolvedValue('https://r2/x.html');
  vi.mocked(fetch).mockResolvedValue({ ok: true, text: async () => '<p>hi</p>' } as Response);
  const { result } = renderHook(() => useChannelTranslation('c-1', 'base', 'en'), {
    wrapper: wrapper(makeQc()),
  });
  await waitFor(() => expect(result.current.html).toBe('<p>hi</p>'));
  expect(fetch).toHaveBeenCalledWith(
    '/api/mkt/storage/proxy?url=' + encodeURIComponent('https://r2/x.html')
  );
  expect(result.current.missingFetch).toBe(false);
});

it('sets missingFetch when the proxy fetch fails', async () => {
  vi.mocked(getChannelTranslationUrl).mockResolvedValue('https://r2/x.html');
  vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);
  const { result } = renderHook(() => useChannelTranslation('c-1', 'base', 'en'), {
    wrapper: wrapper(makeQc()),
  });
  await waitFor(() => expect(result.current.missingFetch).toBe(true));
  expect(result.current.html).toBeNull();
});

it('returns html:null (not missing) when no translation URL exists', async () => {
  vi.mocked(getChannelTranslationUrl).mockResolvedValue(null);
  const { result } = renderHook(() => useChannelTranslation('c-1', 'base', 'en'), {
    wrapper: wrapper(makeQc()),
  });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.html).toBeNull();
  expect(result.current.missingFetch).toBe(false);
});
