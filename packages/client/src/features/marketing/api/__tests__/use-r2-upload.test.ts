import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { uploadToR2 } from '../use-r2-upload';

// ---------------------------------------------------------------------------
// Setup fetch mock
// ---------------------------------------------------------------------------

const originalFetch = globalThis.fetch;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function makeFetch(responses: Array<{ ok: boolean; data?: unknown; text?: string }>) {
  let callIdx = 0;
  return vi.fn(async (_url: string | URL | Request, _init?: Parameters<typeof fetch>[1]) => {
    const resp = responses[callIdx++] ?? responses[responses.length - 1];
    return {
      ok: resp.ok,
      status: resp.ok ? 200 : 500,
      json: async () => resp.data ?? {},
      text: async () => resp.text ?? '',
    } as Response;
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('uploadToR2', () => {
  const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
  const options = { projectId: 'proj-1', category: 'references', fileName: 'test.txt' };

  const PRESIGN_RESPONSE = {
    uploadUrl: 'https://r2.example.com/upload',
    publicUrl: 'https://pub.example.com/test.txt',
    key: 'projects/proj-1/test.txt',
  };

  it('returns publicUrl and key on success', async () => {
    globalThis.fetch = makeFetch([
      { ok: true, data: PRESIGN_RESPONSE }, // presign
      { ok: true }, // PUT
    ]);

    const result = await uploadToR2(file, options);
    expect(result.publicUrl).toBe('https://pub.example.com/test.txt');
    expect(result.key).toBe('projects/proj-1/test.txt');
  });

  it('calls presign with correct body', async () => {
    const fetchMock = makeFetch([{ ok: true, data: PRESIGN_RESPONSE }, { ok: true }]);
    globalThis.fetch = fetchMock;

    await uploadToR2(file, options);

    const [presignUrl, presignInit] = fetchMock.mock.calls[0];
    expect(presignUrl).toBe('/api/mkt/storage/presign');
    const body = JSON.parse(presignInit?.body as string);
    expect(body.projectId).toBe('proj-1');
    expect(body.category).toBe('references');
    expect(body.fileName).toBe('test.txt');
  });

  it('PUTs the file to the uploadUrl from presign response', async () => {
    const fetchMock = makeFetch([{ ok: true, data: PRESIGN_RESPONSE }, { ok: true }]);
    globalThis.fetch = fetchMock;

    await uploadToR2(file, options);

    const [putUrl, putInit] = fetchMock.mock.calls[1];
    expect(putUrl).toBe('https://r2.example.com/upload');
    expect(putInit?.method).toBe('PUT');
    expect(putInit?.body).toBe(file);
  });

  it('retries PUT once on failure and succeeds on retry', async () => {
    const fetchMock = makeFetch([
      { ok: true, data: PRESIGN_RESPONSE }, // presign ok
      { ok: false, text: 'server error' }, // PUT fails
      { ok: true }, // retry PUT succeeds
    ]);
    globalThis.fetch = fetchMock;

    const result = await uploadToR2(file, options);
    expect(result.publicUrl).toBe('https://pub.example.com/test.txt');
    // presign (1) + PUT fail (2) + PUT retry (3)
    expect(fetchMock.mock.calls).toHaveLength(3);
  });

  it('throws if presign fails', async () => {
    globalThis.fetch = makeFetch([{ ok: false, text: 'unauthorized' }]);
    await expect(uploadToR2(file, options)).rejects.toThrow('presign failed');
  });

  it('throws if both PUT attempts fail', async () => {
    globalThis.fetch = makeFetch([
      { ok: true, data: PRESIGN_RESPONSE },
      { ok: false, text: 'fail' },
      { ok: false, text: 'fail again' },
    ]);
    await expect(uploadToR2(file, options)).rejects.toThrow('R2 PUT failed');
  });

  it('uses file.name as fileName when not provided in options', async () => {
    const fetchMock = makeFetch([{ ok: true, data: PRESIGN_RESPONSE }, { ok: true }]);
    globalThis.fetch = fetchMock;

    await uploadToR2(file, { projectId: 'proj-1', category: 'bgm' });

    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    expect(body.fileName).toBe('test.txt');
  });
});
