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

function isImagenModel(model: string): boolean {
  return model.startsWith('imagen-');
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

  // Imagen 4 모델은 별도 API 사용
  if (isImagenModel(imageModel)) {
    return withGeminiRetry(
      async () => {
        const result = await getAI().models.generateImages({
          model: imageModel,
          prompt,
          config: {
            numberOfImages: 1,
            ...(aspectRatio ? { aspectRatio } : {}),
          },
        });

        const imageData = result.generatedImages?.[0]?.image?.imageBytes;
        if (!imageData) {
          const reason = result.generatedImages?.[0]?.raiFilteredReason;
          if (reason) {
            throw new AppError(400, `이미지 차단됨 [${imageModel}]: ${reason}`);
          }
          throw new Error(`이미지 생성 실패 [${imageModel}]: empty response`);
        }

        return imageData;
      },
      { retries, context: 'Imagen' }
    );
  }

  // Gemini 멀티모달 이미지 모델 (Nano Banana / Nano Banana Pro)
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
            `이미지 생성 실패 [${imageModel}]: 콘텐츠 정책 필터링. ` +
              `원인: 1) 아트 스타일에 "픽사", "디즈니", "지브리" 등 저작권 키워드 포함 ` +
              `2) 캐릭터 묘사가 특정 IP와 유사 ` +
              `3) 프롬프트에 상표명 포함. ` +
              `해결: 아트 스타일을 "밝고 따뜻한 수채화", "귀여운 동화풍" 등 일반적인 표현으로 변경해보세요.` +
              (textPart ? ` (AI 응답: ${textPart})` : '')
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
