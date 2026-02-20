import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI, type Part as GenAIPart } from '@google/genai';
import { config } from '../config/index.js';

// Lazy initialization - API 키가 없어도 서버 시작 가능
let _genAI: GoogleGenerativeAI | null = null;
let _ai: GoogleGenAI | null = null;

function getGenAI() {
  if (!_genAI) _genAI = new GoogleGenerativeAI(config.gemini.apiKey);
  return _genAI;
}

function getAI() {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
  return _ai;
}

export function getTextModel() {
  return getGenAI().getGenerativeModel({ model: config.gemini.textModel });
}

export interface ImageGenerationOptions {
  prompt: string;
  referenceImages?: Array<{ base64: string; mimeType: string }>;
  systemInstruction?: string;
  aspectRatio?: string;
  retries?: number;
  model?: string;
}

export async function generateImageWithGemini(options: ImageGenerationOptions): Promise<string> {
  const {
    prompt,
    referenceImages = [],
    systemInstruction,
    aspectRatio,
    retries = 3,
    model,
  } = options;
  const imageModel = model || config.gemini.imageModel;

  const parts: GenAIPart[] = [];

  for (const ref of referenceImages) {
    parts.push({
      inlineData: {
        data: ref.base64,
        mimeType: ref.mimeType,
      },
    });
  }

  parts.push({ text: prompt });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await getAI().models.generateContent({
        model: imageModel,
        contents: [{ role: 'user', parts }],
        config: {
          responseModalities: ['IMAGE', 'TEXT'],
          ...(systemInstruction ? { systemInstruction } : {}),
          ...(aspectRatio ? { imageConfig: { aspectRatio } } : {}),
        },
      });

      const candidate = result.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find((p) => p.inlineData);

      if (!imagePart?.inlineData?.data) {
        throw new Error('이미지 생성 결과가 없습니다.');
      }

      return imagePart.inlineData.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable =
        msg.includes('503') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('429') ||
        msg.includes('RESOURCE_EXHAUSTED');
      if (!isRetryable || attempt === retries) throw err;
      const delay = attempt * 3000; // 3s, 6s
      console.warn(
        `[Gemini] 일시적 오류 (attempt ${attempt}/${retries}), ${delay / 1000}초 후 재시도: ${msg.slice(0, 100)}`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('이미지 생성에 실패했습니다.');
}

export async function generateTextWithGemini(prompt: string, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await getTextModel().generateContent(prompt);
      return result.response.text();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable =
        msg.includes('503') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('429') ||
        msg.includes('RESOURCE_EXHAUSTED');
      if (!isRetryable || attempt === retries) throw err;
      const delay = attempt * 3000;
      console.warn(
        `[Gemini Text] 일시적 오류 (attempt ${attempt}/${retries}), ${delay / 1000}초 후 재시도: ${msg.slice(0, 100)}`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('텍스트 생성에 실패했습니다.');
}
