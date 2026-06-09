import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock('../../providers/r2.provider.js', () => ({
  createPresignedUploadUrl: vi.fn(),
  deleteManyFromR2: vi.fn(),
  downloadFromR2: vi.fn(),
  r2PublicUrl: 'https://pub-test.r2.dev',
}));

import {
  createPresignedUploadUrl,
  deleteManyFromR2,
  downloadFromR2,
} from '../../providers/r2.provider.js';
import { presign, deleteKeys, proxy } from './storage.controller.js';
import type { Request, Response, NextFunction } from 'express';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReqRes(body: Record<string, unknown> = {}, query: Record<string, string> = {}) {
  const jsonMock = vi.fn();
  const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
  const sendMock = vi.fn();
  const res = {
    json: jsonMock,
    status: statusMock,
    setHeader: vi.fn(),
    send: sendMock,
  } as unknown as Response;
  const req = { body, query } as unknown as Request;
  const next: NextFunction = vi.fn();
  return { req, res, next };
}

// asyncHandler returns a standard Express handler; invoke it as a function
async function invoke(
  handler: ReturnType<typeof import('../../middleware/async-handler.js').asyncHandler>,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // asyncHandler wraps: (req, res, next) => fn(req,res,next).catch(next)
  await handler(req, res, next);
}

// ── presign ───────────────────────────────────────────────────────────────────
describe('storage.presign', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns uploadUrl + publicUrl + key shape on valid input', async () => {
    vi.mocked(createPresignedUploadUrl).mockResolvedValue({
      uploadUrl: 'https://presign.example.com/upload',
      publicUrl: 'https://pub-test.r2.dev/mkt/proj1/images/1234-abc.png',
    });

    const { req, res, next } = makeReqRes({
      projectId: 'proj1',
      category: 'images',
      fileName: 'cover.png',
      contentType: 'image/png',
    });

    await invoke(presign, req, res, next);

    expect(createPresignedUploadUrl).toHaveBeenCalledWith(
      expect.stringMatching(/^mkt\/proj1\/images\/.+-[a-z0-9]+\.png$/),
      'image/png'
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          uploadUrl: expect.any(String),
          publicUrl: expect.any(String),
          key: expect.stringMatching(/^mkt\/proj1\/images\//),
        }),
      })
    );
  });

  it('returns 400 when projectId is missing', async () => {
    const { req, res, next } = makeReqRes({
      category: 'images',
      fileName: 'cover.png',
      contentType: 'image/png',
    });

    await invoke(presign, req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it('returns 400 when fileName is missing', async () => {
    const { req, res, next } = makeReqRes({
      projectId: 'proj1',
      category: 'images',
      contentType: 'image/png',
    });

    await invoke(presign, req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it('returns 400 when contentType is missing', async () => {
    const { req, res, next } = makeReqRes({
      projectId: 'proj1',
      category: 'images',
      fileName: 'cover.png',
    });

    await invoke(presign, req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });
});

// ── deleteKeys ────────────────────────────────────────────────────────────────
describe('storage.deleteKeys', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls deleteManyFromR2 and returns success', async () => {
    vi.mocked(deleteManyFromR2).mockResolvedValue(undefined);

    const { req, res, next } = makeReqRes({ keys: ['mkt/p/img/a.png', 'mkt/p/img/b.png'] });
    await invoke(deleteKeys, req, res, next);

    expect(deleteManyFromR2).toHaveBeenCalledWith(['mkt/p/img/a.png', 'mkt/p/img/b.png']);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('returns 400 when keys is empty', async () => {
    const { req, res, next } = makeReqRes({ keys: [] });
    await invoke(deleteKeys, req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it('returns 400 when keys is not an array', async () => {
    const { req, res, next } = makeReqRes({ keys: 'mkt/p/img/a.png' });
    await invoke(deleteKeys, req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });
});

// ── proxy ─────────────────────────────────────────────────────────────────────
describe('storage.proxy', () => {
  beforeEach(() => vi.clearAllMocks());

  it('downloads from R2 and sends buffer', async () => {
    const buf = Buffer.from('fake-image-data');
    vi.mocked(downloadFromR2).mockResolvedValue(buf);

    const { req, res, next } = makeReqRes(
      {},
      { url: 'https://pub-test.r2.dev/mkt/proj1/images/test.png' }
    );
    await invoke(proxy, req, res, next);

    expect(downloadFromR2).toHaveBeenCalledWith('mkt/proj1/images/test.png');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
    expect(res.send).toHaveBeenCalledWith(buf);
  });

  it('returns 400 when url param is missing', async () => {
    const { req, res, next } = makeReqRes({}, {});
    await invoke(proxy, req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });
});
