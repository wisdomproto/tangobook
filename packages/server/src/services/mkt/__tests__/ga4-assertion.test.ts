import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'node:crypto';
import {
  buildServiceAccountAssertion,
  getAccessToken,
  runReport,
  __resetGa4TokenCache,
  __getGa4TokenCache,
} from '../external/ga4.js';

// Throwaway RSA key pair generated once for the whole suite. The private key
// signs the assertion; the public key verifies the signature — the real
// correctness gate for RS256 JWT signing.
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const decode = (seg: string) => JSON.parse(Buffer.from(seg, 'base64url').toString());

const CLIENT_EMAIL = 'svc@proj.iam.gserviceaccount.com';

describe('buildServiceAccountAssertion', () => {
  it('builds a RS256 JWT with the correct header/claim and a verifiable signature', () => {
    const a = buildServiceAccountAssertion(CLIENT_EMAIL, privateKey, 1_700_000_000);
    const segs = a.split('.');
    expect(segs).toHaveLength(3);
    const [h, p, s] = segs;

    expect(decode(h)).toEqual({ alg: 'RS256', typ: 'JWT' });
    expect(decode(p)).toEqual({
      iss: CLIENT_EMAIL,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: 1_700_000_000,
      exp: 1_700_003_600,
    });

    // The signature must verify against the matching public key.
    const ok = crypto
      .createVerify('RSA-SHA256')
      .update(`${h}.${p}`)
      .verify(publicKey, Buffer.from(s, 'base64url'));
    expect(ok).toBe(true);
  });

  it('produces base64url segments (no +, /, or = padding)', () => {
    const a = buildServiceAccountAssertion(CLIENT_EMAIL, privateKey, 1_700_000_000);
    expect(a).not.toMatch(/[+/=]/);
  });

  it('defaults exp to iat + 3600 with a fixed nowSec', () => {
    const a = buildServiceAccountAssertion(CLIENT_EMAIL, privateKey, 42);
    const claim = decode(a.split('.')[1]);
    expect(claim.iat).toBe(42);
    expect(claim.exp).toBe(42 + 3600);
  });

  it('accepts a PEM private key that arrives with literal \\n escapes (after un-escaping)', () => {
    // Simulate an env/JSON value where real newlines were escaped to "\\n",
    // then un-escaped before signing (as resolveGa4Config / config does).
    const escaped = privateKey.replace(/\n/g, '\\n');
    const unescaped = escaped.replace(/\\n/g, '\n');
    const a = buildServiceAccountAssertion(CLIENT_EMAIL, unescaped, 1_700_000_000);
    const [h, p, s] = a.split('.');
    const ok = crypto
      .createVerify('RSA-SHA256')
      .update(`${h}.${p}`)
      .verify(publicKey, Buffer.from(s, 'base64url'));
    expect(ok).toBe(true);
  });
});

describe('getAccessToken', () => {
  beforeEach(() => {
    __resetGa4TokenCache();
    vi.restoreAllMocks();
  });

  it('POSTs a jwt-bearer grant with the assertion and caches the token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'tok-123', expires_in: 3600 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const token = await getAccessToken(CLIENT_EMAIL, privateKey);
    expect(token).toBe('tok-123');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://oauth2.googleapis.com/token');
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    // URLSearchParams body
    const body = init.body as URLSearchParams;
    expect(body.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');
    const assertion = body.get('assertion')!;
    expect(assertion.split('.')).toHaveLength(3);

    // Cache populated with a future expiry.
    const cache = __getGa4TokenCache(CLIENT_EMAIL);
    expect(cache?.token).toBe('tok-123');
    expect(cache!.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('does NOT re-exchange on a second call within the cache window', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'tok-abc', expires_in: 3600 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const t1 = await getAccessToken(CLIENT_EMAIL, privateKey);
    const t2 = await getAccessToken(CLIENT_EMAIL, privateKey);
    expect(t1).toBe('tok-abc');
    expect(t2).toBe('tok-abc');
    expect(fetchMock).toHaveBeenCalledTimes(1); // minted once
  });

  it('throws AppError(502) when the token endpoint returns non-2xx', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    await expect(getAccessToken(CLIENT_EMAIL, privateKey)).rejects.toMatchObject({
      statusCode: 502,
    });
  });

  it('throws AppError(502) when the token response lacks access_token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ expires_in: 3600 }) })
    );
    await expect(getAccessToken(CLIENT_EMAIL, privateKey)).rejects.toMatchObject({
      statusCode: 502,
    });
  });
});

describe('runReport', () => {
  const cfg = { propertyId: '123456789', clientEmail: CLIENT_EMAIL, privateKey };

  beforeEach(() => {
    __resetGa4TokenCache();
    vi.restoreAllMocks();
  });

  it('exchanges a token then POSTs the report body to the runReport endpoint with a Bearer header', async () => {
    const fetchMock = vi
      .fn()
      // 1st call: token exchange
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'bearer-xyz', expires_in: 3600 }),
      })
      // 2nd call: runReport
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          dimensionHeaders: [],
          metricHeaders: [],
          rowCount: 1,
          rows: [
            {
              dimensionValues: [{ value: 'Organic Search' }],
              metricValues: [{ value: '80' }, { value: '50' }],
            },
          ],
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const reportBody = {
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      limit: 10,
    };
    const report = await runReport(cfg, reportBody);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe('https://analyticsdata.googleapis.com/v1beta/properties/123456789:runReport');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer bearer-xyz');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual(reportBody);

    // Row shape reconciliation: rows are { dimensionValues:{value}[], metricValues:{value}[] }.
    expect(report.rows[0].dimensionValues[0].value).toBe('Organic Search');
    expect(report.rows[0].metricValues[1].value).toBe('50');
  });

  it('reuses the cached token across runReport calls (single token exchange)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok-cache', expires_in: 3600 }),
      })
      .mockResolvedValue({
        ok: true,
        json: async () => ({ dimensionHeaders: [], metricHeaders: [], rowCount: 0, rows: [] }),
      });
    vi.stubGlobal('fetch', fetchMock);

    await runReport(cfg, { dateRanges: [] });
    await runReport(cfg, { dateRanges: [] });

    // 1 token exchange + 2 runReport = 3 fetch calls.
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('throws AppError(502) on a non-2xx runReport response', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({ ok: false, status: 403, text: async () => 'permission denied' });
    vi.stubGlobal('fetch', fetchMock);

    await expect(runReport(cfg, { dateRanges: [] })).rejects.toMatchObject({ statusCode: 502 });
  });
});
