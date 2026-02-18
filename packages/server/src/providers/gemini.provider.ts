import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { config } from '../config/index.js';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

export const textModel = genAI.getGenerativeModel({ model: config.gemini.textModel });
export const imageModel = genAI.getGenerativeModel({ model: config.gemini.imageModel });

export interface ImageGenerationOptions {
  prompt: string;
  referenceImages?: Array<{ base64: string; mimeType: string }>;
  retries?: number;
}

export async function generateImageWithGemini(options: ImageGenerationOptions): Promise<string> {
  const { prompt, referenceImages = [], retries = 3 } = options;

  const parts: Part[] = [];

  // 레퍼런스 이미지가 있으면 먼저 추가
  for (const ref of referenceImages) {
    parts.push({
      inlineData: {
        data: ref.base64,
        mimeType: ref.mimeType as 'image/png' | 'image/jpeg',
      },
    });
  }

  parts.push({ text: prompt });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await imageModel.generateContent({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT'],
        } as Parameters<typeof imageModel.generateContent>[0] extends { generationConfig: infer G }
          ? G
          : never,
      });

      const candidate = result.response.candidates?.[0];
      const imagePart = candidate?.content.parts.find((p) => p.inlineData);

      if (!imagePart?.inlineData) {
        throw new Error('이미지 생성 결과가 없습니다.');
      }

      return imagePart.inlineData.data;
    } catch (err) {
      if (attempt === retries) throw err;
      // 지수 백오프
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }

  throw new Error('이미지 생성에 실패했습니다.');
}

export async function generateTextWithGemini(prompt: string): Promise<string> {
  const result = await textModel.generateContent(prompt);
  return result.response.text();
}
