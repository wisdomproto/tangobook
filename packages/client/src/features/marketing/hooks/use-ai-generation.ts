import { useCallback, useRef, useState } from 'react';
import { parseSSEStream } from '../lib/sse-stream-parser';

export interface UseAiGenerationOptions {
  onChunk?: (full: string) => void;
  onComplete: (full: string) => void;
  onError?: (message: string) => void;
}

export function useAiGeneration({ onChunk, onComplete, onError }: UseAiGenerationOptions) {
  const [isGenerating, setIsGenerating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (prompt: string, model: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsGenerating(true);
      let full = '';
      let streamError: string | null = null;
      try {
        const res = await fetch('/api/mkt/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, model }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
        }
        await parseSSEStream(res, {
          signal: controller.signal,
          onChunk: (c) => {
            if (c.error) {
              streamError = c.error;
              return;
            }
            if (c.text) {
              full += c.text;
              onChunk?.(full);
            }
          },
        });
        if (streamError) throw new Error(streamError);
        onComplete(full);
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        onError?.((e as Error).message);
      } finally {
        setIsGenerating(false);
      }
    },
    [onChunk, onComplete, onError]
  );

  const abort = useCallback(() => abortRef.current?.abort(), []);
  return { isGenerating, generate, abort };
}
