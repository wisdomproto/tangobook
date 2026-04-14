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

export async function generateGeminiTts(options: TtsOptions): Promise<Buffer> {
  const { text, voice = config.gemini.ttsVoice, language = 'ko', retries = 3 } = options;
  const cleaned = text.replace(/\//g, '').trim();
  let prompt: string;
  if (cleaned.length <= 3 && language !== 'ko') {
    prompt = `${cleaned}, ${cleaned}, ${cleaned}`;
  } else if (cleaned.includes('...')) {
    prompt = cleaned.replace(/\.\.\./g, ',');
  } else {
    prompt = cleaned;
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
