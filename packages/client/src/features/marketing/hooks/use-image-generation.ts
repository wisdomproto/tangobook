import { useCallback } from 'react';

export interface GenerateImageArgs {
  prompt: string;
  model: string;
  aspectRatio?: string;
  referenceImages?: Array<{ base64: string; mimeType: string }>;
  signal?: AbortSignal;
}

export function useImageGeneration() {
  const generateImage = useCallback(
    async ({ prompt, model, aspectRatio, referenceImages, signal }: GenerateImageArgs) => {
      const res = await fetch('/api/mkt/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model, aspectRatio, referenceImages }),
        signal,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as { success?: boolean; data?: { image?: string } };
      if (!json.success || !json.data?.image) throw new Error('이미지 생성 응답이 비어 있습니다.');
      // Our server returns a base64 PNG (no data-URL prefix).
      return { base64: json.data.image, mimeType: 'image/png' as const };
    },
    []
  );
  return { generateImage };
}
