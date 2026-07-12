import { createHash } from 'node:crypto';
import { R2Repository } from '../repositories/r2.repository.js';
import { AppError } from '../middleware/error.middleware.js';
import { generateGeminiTts } from '../providers/gemini-tts.provider.js';
import { generateGoogleTts } from '../providers/google-tts.provider.js';
import { objectExists, r2PublicUrl } from '../providers/r2.provider.js';
import { buildR2Key } from '../utils/r2-key.js';

/** per-unit(음절/글자) TTS 지원 언어 — vi/zh/th 는 phonics concat 이 없어 Google native 로 낱유닛 발음 생성. */
const VOCAB_UNIT_LANGS = new Set(['vi', 'zh', 'th']);

type TtsProvider = 'gemini' | 'google' | 'minimax' | 'elevenlabs';

interface TtsRequest {
  text: string;
  provider: TtsProvider;
  voice?: string;
  language?: string;
  storybookId: string;
  pageNumber?: number;
  identifier?: string; // 범용 식별자 (phonics-word-bat 등)
}

interface TtsBatchRequest {
  pages: Array<{ pageNumber: number; text: string }>;
  provider: TtsProvider;
  voice?: string;
  language?: string;
  storybookId: string;
}

export const TtsService = {
  async generate(req: TtsRequest): Promise<string> {
    const { provider, text, voice, language, storybookId, pageNumber, identifier } = req;

    let audioBuffer: Buffer;
    let ext: string;
    let mimeType: string;

    switch (provider) {
      case 'gemini':
        audioBuffer = await generateGeminiTts({ text, voice, language });
        ext = 'mp3';
        mimeType = 'audio/mpeg';
        break;
      case 'google':
        audioBuffer = await generateGoogleTts({ text, voice, language });
        ext = 'mp3';
        mimeType = 'audio/mpeg';
        break;
      case 'minimax':
        audioBuffer = await generateMinimaxTts(text, voice, language);
        ext = 'mp3';
        mimeType = 'audio/mpeg';
        break;
      case 'elevenlabs':
        audioBuffer = await generateElevenLabsTts(text, voice);
        ext = 'mp3';
        mimeType = 'audio/mpeg';
        break;
      default:
        throw new AppError(400, '지원하지 않는 TTS 프로바이더입니다.');
    }

    const key = buildR2Key({
      storybookId,
      fileType: 'tts',
      identifier: identifier ?? `page${pageNumber}`,
      extension: ext,
    });
    return R2Repository.uploadBuffer(audioBuffer, key, mimeType);
  },

  /**
   * 어휘 게임 낱유닛(zh 한자·vi 어절/성조글자·th 결합단위) 발음 — lazy + 캐시 + idempotent.
   * 블록 타일 배치·따라쓰기 유닛 완성 때 재생. 결정적 R2 키(hash)라 첫 재생만 생성, 이후 캐시 hit.
   * ko/en 은 phonics concat 경로가 있어 여기 미지원(vi/zh/th 전용).
   */
  async generateVocabUnit(rawText: string, lang: string): Promise<string> {
    if (!VOCAB_UNIT_LANGS.has(lang)) {
      throw new AppError(400, `per-unit TTS 미지원 언어: ${lang} (vi/zh/th 만).`);
    }
    const text = rawText.replace(/\//g, '').trim();
    if (!text) throw new AppError(400, 'TTS 텍스트가 비었습니다.');
    if (text.length > 24) throw new AppError(400, 'per-unit TTS 텍스트가 너무 깁니다.');

    const hash = createHash('sha1').update(`${lang}:${text}`).digest('hex').slice(0, 20);
    const key = `system-tts/vocab-unit/${lang}/${hash}.mp3`;
    const publicUrl = `${r2PublicUrl}/${key}`;

    if (await objectExists(key)) return publicUrl;

    const audioBuffer = await generateGoogleTts({ text, language: lang });
    await R2Repository.uploadBuffer(audioBuffer, key, 'audio/mpeg');
    return publicUrl;
  },

  async batch(
    req: TtsBatchRequest
  ): Promise<Array<{ pageNumber: number; audioUrl: string; success: boolean }>> {
    const { pages, ...opts } = req;
    const DELAY_MS = 1500; // rate limit 방지용 딜레이
    const results: Array<{ pageNumber: number; audioUrl: string; success: boolean }> = [];

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      try {
        const audioUrl = await TtsService.generate({ ...opts, ...page });
        results.push({ pageNumber: page.pageNumber, audioUrl, success: true });
      } catch (err) {
        console.error(`[tts] batch page ${page.pageNumber} failed:`, err);
        results.push({ pageNumber: page.pageNumber, audioUrl: '', success: false });
      }
      // 마지막이 아닌 경우 딜레이
      if (i < pages.length - 1) {
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    }

    return results;
  },

  async uploadAudio(file: Express.Multer.File, body: Record<string, string>): Promise<string> {
    const identifier = body.identifier ?? `page${body.pageNumber}`;
    const key = buildR2Key({
      storybookId: body.storybookId,
      fileType: 'tts',
      identifier,
      extension: file.originalname.split('.').pop() ?? 'mp3',
    });
    return R2Repository.uploadBuffer(file.buffer, key, file.mimetype);
  },
};

// --- Minimax / ElevenLabs stubs ---

async function generateMinimaxTts(
  _text: string,
  _voice?: string,
  _language?: string
): Promise<Buffer> {
  throw new AppError(501, 'Minimax TTS는 아직 구현되지 않았습니다.');
}

async function generateElevenLabsTts(_text: string, _voice?: string): Promise<Buffer> {
  throw new AppError(501, 'ElevenLabs TTS는 아직 구현되지 않았습니다.');
}
