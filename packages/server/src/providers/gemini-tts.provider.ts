import { GoogleGenAI } from '@google/genai';
import { config } from '../config/index.js';
import { withGeminiRetry } from '../utils/gemini-retry.js';
import { pcmToMp3 } from '../utils/transcode.js';

let _ai: GoogleGenAI | null = null;
function getAI() {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
  return _ai;
}

export interface TtsOptions {
  text: string;
  voice?: string;
  language?: string;
  retries?: number;
}

// 앱 2글자 언어코드 → Gemini TTS 억양 고정용 BCP-47 로케일.
// languageCode 를 안 넘기면 모델이 텍스트만 보고 억양을 자동 결정 → 같은 voice 여도
// 영어가 en-US/en-GB 를 오간다. 명시하면 발음이 결정적으로 고정된다.
// zh·ms 는 Gemini 2.5 TTS 미지원(어휘 발음은 Google TTS 경로 사용)이라 매핑 제외 → 자동감지 유지.
const TTS_LOCALE: Record<string, string> = {
  ko: 'ko-KR',
  en: 'en-US',
  ja: 'ja-JP',
  es: 'es-US',
  fr: 'fr-FR',
  de: 'de-DE',
  vi: 'vi-VN',
  th: 'th-TH',
  id: 'id-ID',
};

export function resolveTtsLocale(language?: string): string | undefined {
  return language ? TTS_LOCALE[language] : undefined;
}

export async function generateGeminiTts(options: TtsOptions): Promise<Buffer> {
  const { text, voice = config.gemini.ttsVoice, language = 'ko', retries = 3 } = options;
  const cleaned = text.replace(/\//g, '').trim();
  let prompt: string;
  if (cleaned.length <= 3 && language !== 'ko') {
    // 파닉스 단일 음가/글자 — 또렷하게 반복
    prompt = `${cleaned}, ${cleaned}, ${cleaned}`;
  } else {
    // '...' 는 부자연스러운 긴 침묵이 되므로 쉼표로 치환
    const body = cleaned.includes('...') ? cleaned.replace(/\.\.\./g, ',') : cleaned;
    // Gemini 2.5 TTS 는 '서술문. "대사"' 구조에서 앞 서술문을 '연기 지시'로 오해해 음성에서 통째로
    // 빼먹는다 (예: '무서운 교장 선생님이 버럭 화를 냈어요. "이제 넌..."' → 첫 문장이 안 읽힘).
    // ':' 앞 지시문은 음성으로 출력되지 않는 특성을 이용해, 명시적 낭독 지시를 붙여 본문 전체를
    // 처음부터 끝까지 읽게 강제한다. 단어/짧은 구(파닉스·어휘 단일 단어)는 오해 소지가 없어 제외.
    const isNarration = /[.!?…。！？]/.test(body) || body.length > 15;
    if (isNarration) {
      prompt =
        language === 'ko'
          ? `다음 글을 한 글자도 빠짐없이 처음부터 끝까지 또박또박 읽어 주세요. 설명이나 지시는 하지 말고 글 내용 전체를 그대로 소리 내어 읽으세요:\n${body}`
          : `Read the following text aloud from the very beginning to the very end, word for word. Do not add any narration or commentary — read the entire text exactly as written:\n${body}`;
    } else {
      prompt = body;
    }
  }

  return withGeminiRetry(
    async () => {
      const response = await getAI().models.generateContent({
        model: config.gemini.ttsModel,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
            ...(resolveTtsLocale(language) ? { languageCode: resolveTtsLocale(language) } : {}),
          },
        },
      });

      const audioPart = response.candidates?.[0]?.content?.parts?.[0];
      if (!audioPart?.inlineData?.data) {
        throw new Error('TTS 응답에 오디오 데이터가 없습니다.');
      }
      const pcmBuffer = Buffer.from(audioPart.inlineData.data, 'base64');
      return pcmToMp3(pcmBuffer);
    },
    { retries, baseDelayMs: 2000, context: 'Gemini TTS' }
  );
}
