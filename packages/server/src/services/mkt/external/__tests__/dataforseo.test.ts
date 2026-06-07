import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../config/index.js', () => ({
  config: { dataforseo: { login: 'LOGIN', password: 'PASS' } },
}));

import { mapVolumeResult, getKeywordVolumes } from '../dataforseo.js';

describe('mapVolumeResult', () => {
  it('maps fields and defaults missing values to 0', () => {
    const out = mapVolumeResult([
      { keyword: '키즈영어', search_volume: 1200, competition: 0.4, cpc: 0.9 },
      { keyword: 'novol', search_volume: null, competition: null, cpc: null },
    ]);
    expect(out[0]).toEqual({ keyword: '키즈영어', searchVolume: 1200, competition: 0.4, cpc: 0.9 });
    expect(out[1]).toEqual({ keyword: 'novol', searchVolume: 0, competition: 0, cpc: 0 });
  });
});

describe('getKeywordVolumes', () => {
  beforeEach(() => vi.restoreAllMocks());
  it('sends Basic auth + maps tasks[0].result', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tasks: [{ result: [{ keyword: 'a', search_volume: 10, competition: 0.1, cpc: 0.2 }] }],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const res = await getKeywordVolumes(['a']);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe(
      'Basic ' + Buffer.from('LOGIN:PASS').toString('base64')
    );
    expect(res[0]).toEqual({ keyword: 'a', searchVolume: 10, competition: 0.1, cpc: 0.2 });
  });

  it('throws AppError(502) on a non-2xx upstream', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'err' })
    );
    await expect(getKeywordVolumes(['a'])).rejects.toMatchObject({ statusCode: 502 });
  });
});
