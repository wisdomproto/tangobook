import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../config/index.js', () => ({
  config: { naverAd: { apiKey: 'API', secretKey: 'SECRET', customerId: 'CUST' } },
}));

import { signNaverRequest, mapKeywordList, searchKeywords } from '../naver-searchad.js';

describe('signNaverRequest', () => {
  it('produces a deterministic base64 HMAC-SHA256 of `${ts}.${method}.${uri}`', () => {
    const sig = signNaverRequest('SECRET', '1700000000000', 'GET', '/keywordstool');
    // Precomputed via:
    //   node -e "console.log(require('crypto').createHmac('sha256','SECRET').update('1700000000000.GET./keywordstool').digest('base64'))"
    expect(sig).toBe('SXHVLG/EOE0UPejCoZmR8rGuCfDCMp/2kFl3mkJECcI=');
  });
});

describe('mapKeywordList', () => {
  it('coerces "< 10" + numeric counts and maps competition', () => {
    const out = mapKeywordList([
      {
        relKeyword: '영어유치원',
        monthlyPcQcCnt: '< 10',
        monthlyMobileQcCnt: 320,
        monthlyAvePcClkCnt: 1.2,
        monthlyAveMobileClkCnt: 5,
        compIdx: '높음',
        plAvgDepth: 3,
      },
    ]);
    expect(out[0].keyword).toBe('영어유치원');
    expect(out[0].pcSearchVolume).toBe(10);
    expect(out[0].mobileSearchVolume).toBe(320);
    expect(out[0].totalSearchVolume).toBe(330);
    expect(out[0].competition).toBe('HIGH');
  });
});

describe('searchKeywords', () => {
  beforeEach(() => vi.restoreAllMocks());
  it('calls keywordstool with signed headers and maps the result', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        keywordList: [
          {
            relKeyword: 'a',
            monthlyPcQcCnt: 10,
            monthlyMobileQcCnt: 20,
            monthlyAvePcClkCnt: 0,
            monthlyAveMobileClkCnt: 0,
            compIdx: '중간',
            plAvgDepth: 1,
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const res = await searchKeywords(['a', 'b']);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers['X-API-KEY']).toBe('API');
    expect(init.headers['X-Customer']).toBe('CUST');
    expect(init.headers['X-Signature']).toBeTruthy();
    expect(res[0].keyword).toBe('a');
    expect(res[0].competition).toBe('MEDIUM');
  });

  it('throws AppError(502) on a non-2xx upstream', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'err' })
    );
    await expect(searchKeywords(['a'])).rejects.toMatchObject({ statusCode: 502 });
  });
});
