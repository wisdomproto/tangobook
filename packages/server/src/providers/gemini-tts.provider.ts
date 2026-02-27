import { GoogleGenAI } from '@google/genai';
import { config } from '../config/index.js';
import { withGeminiRetry } from '../utils/gemini-retry.js';

// Lazy initialization
let _ai: GoogleGenAI | null = null;
function getAI() {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
  return _ai;
}

function pcmToWav(pcm: Buffer, sampleRate = 24000, channels = 1, bitDepth = 16): Buffer {
  const byteRate = sampleRate * channels * (bitDepth / 8);
  const blockAlign = channels * (bitDepth / 8);
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcm]);
}

export interface TtsOptions {
  text: string;
  voice?: string;
  language?: string;
  retries?: number;
}

export async function generateGeminiTts(options: TtsOptions): Promise<Buffer> {
  const { text, voice = config.gemini.ttsVoice, language = 'ko', retries = 3 } = options;

  // TTS 모델은 복잡한 지시문 대신 읽을 텍스트만 전달해야 함
  // IPA 표기(/k/, /æ/ 등)의 슬래시 제거
  const cleaned = text.replace(/\//g, '').trim();
  let prompt: string;
  if (cleaned.length <= 3 && language !== 'ko') {
    // 단일 글자/짧은 음가: 너무 짧으면 TTS가 오디오 미생성 → 반복으로 패딩
    prompt = `${cleaned}, ${cleaned}, ${cleaned}`;
  } else if (cleaned.includes('...')) {
    // 블렌딩 시퀀스 (a ... t ... at): 쉼표로 변환
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
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const audioPart = response.candidates?.[0]?.content?.parts?.[0];
      if (!audioPart?.inlineData?.data) {
        throw new Error('TTS 응답에 오디오 데이터가 없습니다.');
      }

      const pcmBuffer = Buffer.from(audioPart.inlineData.data, 'base64');
      return pcmToWav(pcmBuffer);
    },
    { retries, baseDelayMs: 2000, context: 'Gemini TTS' }
  );
}
