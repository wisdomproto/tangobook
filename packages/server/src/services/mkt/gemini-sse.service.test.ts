import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock gemini provider before importing service ────────────────────────────
vi.mock('../../providers/gemini.provider.js', () => ({
  getAI: vi.fn(),
}));
// Also mock config so it doesn't need .env
vi.mock('../../config/index.js', () => ({
  config: {
    gemini: { textModel: 'gemini-test-model' },
  },
}));

import {
  writeSSEChunk,
  writeSSEDone,
  writeSSEError,
  streamGenerate,
} from './gemini-sse.service.js';
import { getAI } from '../../providers/gemini.provider.js';
import type { Response } from 'express';

// ── Fake res ─────────────────────────────────────────────────────────────────
function makeFakeRes() {
  const writes: string[] = [];
  const res = {
    setHeader: vi.fn(),
    flushHeaders: vi.fn(),
    write: (chunk: string) => {
      writes.push(chunk);
    },
    end: vi.fn(),
    writes,
  } as unknown as Response & { writes: string[] };
  return res;
}

// ── Pure envelope helpers ─────────────────────────────────────────────────────
describe('SSE envelope helpers', () => {
  it('writeSSEChunk emits data:{text} envelope', () => {
    const res = makeFakeRes();
    writeSSEChunk(res, 'hello');
    expect(res.writes[0]).toBe('data: {"text":"hello"}\n\n');
  });

  it('writeSSEDone emits [DONE] envelope', () => {
    const res = makeFakeRes();
    writeSSEDone(res);
    expect(res.writes[0]).toBe('data: [DONE]\n\n');
  });

  it('writeSSEError emits error envelope', () => {
    const res = makeFakeRes();
    writeSSEError(res, 'something went wrong');
    expect(res.writes[0]).toBe('data: {"error":"something went wrong"}\n\n');
  });
});

// ── streamGenerate happy path ─────────────────────────────────────────────────
describe('streamGenerate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function* fakeStream(chunks: string[]) {
    for (const c of chunks) {
      yield { text: c };
    }
  }

  it('streams chunks then [DONE]', async () => {
    const res = makeFakeRes();
    const fakeAI = {
      models: {
        generateContentStream: vi.fn().mockResolvedValue(fakeStream(['Hello', ' world'])),
      },
    };
    vi.mocked(getAI).mockReturnValue(fakeAI as unknown as ReturnType<typeof getAI>);

    await streamGenerate(res, { prompt: 'hi', model: 'test-model' });

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
    expect(res.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
    expect(res.writes).toContain('data: {"text":"Hello"}\n\n');
    expect(res.writes).toContain('data: {"text":" world"}\n\n');
    expect(res.writes[res.writes.length - 1]).toBe('data: [DONE]\n\n');
    expect(res.end).toHaveBeenCalled();
  });

  it('emits error envelope on stream failure', async () => {
    const res = makeFakeRes();
    const fakeAI = {
      models: {
        generateContentStream: vi.fn().mockRejectedValue(new Error('network error')),
      },
    };
    vi.mocked(getAI).mockReturnValue(fakeAI as unknown as ReturnType<typeof getAI>);

    await streamGenerate(res, { prompt: 'hi', model: 'test-model' });

    const errorWrite = res.writes.find((w) => w.includes('"error"'));
    expect(errorWrite).toBeTruthy();
    expect(errorWrite).toContain('network error');
    expect(res.end).toHaveBeenCalled();
  });

  it('falls back to gemini-2.5-flash-lite on overload error', async () => {
    const res = makeFakeRes();
    const generateContentStream = vi
      .fn()
      .mockRejectedValueOnce(new Error('503 UNAVAILABLE overloaded'))
      .mockResolvedValueOnce(fakeStream(['fallback chunk']));

    const fakeAI = { models: { generateContentStream } };
    vi.mocked(getAI).mockReturnValue(fakeAI as unknown as ReturnType<typeof getAI>);

    await streamGenerate(res, { prompt: 'hi', model: 'primary-model' });

    // Should have been called twice: once with primary, once with fallback
    expect(generateContentStream).toHaveBeenCalledTimes(2);
    const secondCallModel = generateContentStream.mock.calls[1][0].model;
    expect(secondCallModel).toBe('gemini-2.5-flash-lite');
    expect(res.writes).toContain('data: {"text":"fallback chunk"}\n\n');
    expect(res.writes[res.writes.length - 1]).toBe('data: [DONE]\n\n');
  });

  it('skips fallback when fallback model itself is primary', async () => {
    const res = makeFakeRes();
    const generateContentStream = vi.fn().mockRejectedValue(new Error('503 UNAVAILABLE'));

    const fakeAI = { models: { generateContentStream } };
    vi.mocked(getAI).mockReturnValue(fakeAI as unknown as ReturnType<typeof getAI>);

    // Use fallback model as the primary model directly
    await streamGenerate(res, { prompt: 'hi', model: 'gemini-2.5-flash-lite' });

    // Should only be called once (no second attempt)
    expect(generateContentStream).toHaveBeenCalledTimes(1);
    const errorWrite = res.writes.find((w) => w.includes('"error"'));
    expect(errorWrite).toBeTruthy();
  });
});

// ── storage presign shape (pure unit — no R2 call) ────────────────────────────
// (Full storage controller tests with r2.provider mocked live in storage.controller.test.ts)
