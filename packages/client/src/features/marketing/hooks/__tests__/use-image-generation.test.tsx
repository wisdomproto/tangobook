import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImageGeneration } from '../use-image-generation';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useImageGeneration', () => {
  it('unwraps data.image into { base64, mimeType }', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { image: 'BASE64DATA' } }),
      })
    );
    const { result } = renderHook(() => useImageGeneration());
    let out: { base64: string; mimeType: string } | undefined;
    await act(async () => {
      out = await result.current.generateImage({
        prompt: 'a cat',
        model: 'm',
        aspectRatio: '16:9',
      });
    });
    expect(out?.base64).toBe('BASE64DATA');
    expect(out?.mimeType).toBe('image/png');
  });

  it('throws when success is false', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: false, data: null }),
      })
    );
    const { result } = renderHook(() => useImageGeneration());
    await act(async () => {
      await expect(result.current.generateImage({ prompt: 'x', model: 'm' })).rejects.toThrow();
    });
  });

  it('throws on HTTP error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'server error' }),
      })
    );
    const { result } = renderHook(() => useImageGeneration());
    await act(async () => {
      await expect(result.current.generateImage({ prompt: 'x', model: 'm' })).rejects.toThrow(
        'server error'
      );
    });
  });
});
