import { GoogleGenAI } from '@google/genai';
import { config } from '../config/index.js';

const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });

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

  const prompt =
    language === 'ko'
      ? `다음 한국어 텍스트를 따뜻하고 부드러운 동화 낭독 톤으로 읽어주세요: ${text}`
      : `Read the following text in a warm, gentle storytelling voice: ${text}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
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
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }

  throw new Error('TTS 생성에 실패했습니다.');
}
