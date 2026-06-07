import { useCallback, useRef, useState } from 'react';
import { useImageGeneration, type GenerateImageArgs } from './use-image-generation';
import { convertToWebpBlob } from '../lib/image-utils';
import { uploadToR2 } from '../api/use-r2-upload';

export interface CardImageGenerationConfig {
  /** Return the image-gen prompt for a given cardId. */
  getPrompt: (cardId: string) => string;
  /** Return the image model id. */
  getModel: (cardId: string) => string;
  /** Return the image model's aspect-ratio string (e.g. "1:1"). */
  getAspectRatio?: (cardId: string) => string;
  /** Return true to skip this card (already has an image, etc.) */
  shouldSkip?: (cardId: string) => boolean;
  /** Reference images to pass to the generate endpoint. */
  getReferenceImages?: (cardId: string) => Array<{ base64: string; mimeType: string }>;
  /** Called after a successful upload with the public URL + prompt used. */
  onSave: (cardId: string, url: string, prompt: string) => void | Promise<void>;
  /** projectId is needed for the R2 presign call. */
  projectId: string;
  /** R2 category (defaults to "images"). */
  category?: string;
}

export interface CardImageGenerationResult {
  isGenerating: boolean;
  progress: { current: number; total: number };
  generateForCard: (cardId: string) => Promise<void>;
  generateAll: (cardIds: string[]) => Promise<void>;
  abort: () => void;
}

export function useCardImageGeneration(
  config: CardImageGenerationConfig
): CardImageGenerationResult {
  const { generateImage } = useImageGeneration();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const abortRef = useRef<AbortController | null>(null);

  const generateForCard = useCallback(
    async (cardId: string): Promise<void> => {
      const prompt = config.getPrompt(cardId);
      const model = config.getModel(cardId);
      const aspectRatio = config.getAspectRatio?.(cardId);
      const referenceImages = config.getReferenceImages?.(cardId);

      const args: GenerateImageArgs = { prompt, model };
      if (aspectRatio) args.aspectRatio = aspectRatio;
      if (referenceImages?.length) args.referenceImages = referenceImages;

      const { base64, mimeType } = await generateImage(args);
      const { blob } = await convertToWebpBlob(base64, mimeType);
      const ext = 'webp';
      const fileName = `${cardId}.${ext}`;

      let publicUrl: string;
      try {
        const result = await uploadToR2(blob, {
          projectId: config.projectId,
          category: config.category ?? 'images',
          fileName,
          contentType: 'image/webp',
          contentId: cardId,
        });
        publicUrl = result.publicUrl;
      } catch {
        // Fallback: use data URL if R2 upload fails
        const reader = new FileReader();
        publicUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      await config.onSave(cardId, publicUrl, prompt);
    },
    [config, generateImage]
  );

  const generateAll = useCallback(
    async (cardIds: string[]): Promise<void> => {
      const toProcess = cardIds.filter((id) => !config.shouldSkip?.(id));
      if (toProcess.length === 0) {
        alert('생성할 카드가 없습니다.');
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsGenerating(true);
      setProgress({ current: 0, total: toProcess.length });

      let succeeded = 0;
      let failed = 0;

      for (let i = 0; i < toProcess.length; i++) {
        if (controller.signal.aborted) break;

        const cardId = toProcess[i];
        try {
          await generateForCard(cardId);
          succeeded++;
        } catch {
          failed++;
        }
        setProgress({ current: i + 1, total: toProcess.length });

        // 3s delay between cards to avoid rate limiting
        if (i < toProcess.length - 1 && !controller.signal.aborted) {
          await new Promise<void>((res, rej) => {
            const t = setTimeout(res, 3000);
            controller.signal.addEventListener('abort', () => {
              clearTimeout(t);
              rej(new DOMException('aborted', 'AbortError'));
            });
          }).catch(() => {});
        }
      }

      setIsGenerating(false);
      setProgress({ current: 0, total: 0 });

      if (failed > 0) {
        alert(`이미지 생성 완료: ${succeeded}개 성공, ${failed}개 실패`);
      } else {
        alert(`이미지 생성 완료: ${succeeded}개 성공`);
      }
    },
    [config, generateForCard]
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setIsGenerating(false);
    setProgress({ current: 0, total: 0 });
  }, []);

  return { isGenerating, progress, generateForCard, generateAll, abort };
}
