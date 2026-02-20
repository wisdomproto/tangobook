import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI, type Part as GenAIPart } from '@google/genai';
import { config } from '../config/index.js';
import { withGeminiRetry } from '../utils/gemini-retry.js';
import { AppError } from '../middleware/error.middleware.js';

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

  return withGeminiRetry(
    async () => {
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
        const finishReason = candidate?.finishReason;
        const textPart = candidate?.content?.parts?.find((p) => p.text)?.text;
        const blockReason = result.promptFeedback?.blockReason;

        console.error(
          '[Gemini Image] 이미지 없는 응답:',
          JSON.stringify(
            {
              finishReason,
              textPart,
              blockReason,
              safetyRatings: candidate?.safetyRatings,
            },
            null,
            2
          )
        );

        // SAFETY/BLOCKED → 프롬프트 수정 필요 (재시도 무의미)
        if (finishReason === 'SAFETY' || blockReason) {
          throw new AppError(
            400,
            `이미지 차단됨: ${blockReason || finishReason}. 프롬프트나 참조 이미지에 부적절한 내용이 있을 수 있습니다.`
          );
        }

        // OTHER → 저작권/상표권 필터링 가능성 높음 (재시도 1회만 시도 후 안내)
        if (finishReason === 'OTHER' || finishReason === 'IMAGE_OTHER') {
          throw new Error(
            `이미지 생성 실패 [${imageModel}]: 콘텐츠 정책 필터링 (OTHER). ` +
              `저작권/상표권 관련 캐릭터명이나 디자인이 프롬프트에 포함되어 있을 수 있습니다. ` +
              `프롬프트를 일반적인 묘사로 바꿔보세요.` +
              (textPart ? ` (응답: ${textPart})` : '')
          );
        }

        // 기타 → 일시적 문제 (재시도)
        throw new Error(
          `이미지 생성 실패 [${imageModel}]: ${finishReason || textPart || 'empty response'}`
        );
      }

      return imagePart.inlineData.data;
    },
    { retries, context: 'Gemini Image' }
  );
}

export async function generateTextWithGemini(
  prompt: string,
  retries = 3,
  model?: string
): Promise<string> {
  const textModel = model ? getGenAI().getGenerativeModel({ model }) : getTextModel();
  return withGeminiRetry(
    async () => {
      const result = await textModel.generateContent(prompt);
      return result.response.text();
    },
    { retries, context: 'Gemini Text' }
  );
}
