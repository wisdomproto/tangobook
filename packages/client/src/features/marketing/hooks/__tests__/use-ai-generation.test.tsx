import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAiGeneration } from '../use-ai-generation';

function sseResponse(lines: string[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      const enc = new TextEncoder();
      for (const l of lines) c.enqueue(enc.encode(`data: ${l}\n\n`));
      c.close();
    },
  });
  return { ok: true, body } as unknown as Response;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useAiGeneration', () => {
  it('streams chunks and calls onComplete with the full text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(sseResponse(['{"text":"Hello"}', '{"text":" world"}', '[DONE]']))
    );
    const onComplete = vi.fn();
    const { result } = renderHook(() => useAiGeneration({ onComplete }));
    await act(async () => {
      result.current.generate('prompt', 'model');
    });
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith('Hello world'));
    expect(result.current.isGenerating).toBe(false);
  });

  it('routes an error chunk to onError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(sseResponse(['{"error":"boom"}', '[DONE]'])));
    const onError = vi.fn();
    const { result } = renderHook(() => useAiGeneration({ onError, onComplete: vi.fn() }));
    await act(async () => {
      result.current.generate('p', 'm');
    });
    await waitFor(() => expect(onError).toHaveBeenCalledWith('boom'));
  });

  it('calls onChunk with accumulated text as it streams', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(sseResponse(['{"text":"A"}', '{"text":"B"}', '[DONE]']))
    );
    const onChunk = vi.fn();
    const onComplete = vi.fn();
    const { result } = renderHook(() => useAiGeneration({ onChunk, onComplete }));
    await act(async () => {
      result.current.generate('p', 'm');
    });
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith('AB'));
    // onChunk should have been called with partial accumulations
    expect(onChunk).toHaveBeenCalledWith('A');
    expect(onChunk).toHaveBeenCalledWith('AB');
  });
});
