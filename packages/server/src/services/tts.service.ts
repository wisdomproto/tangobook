import { R2Repository } from '../repositories/r2.repository.js';
import { AppError } from '../middleware/error.middleware.js';
import { generateGeminiTts } from '../providers/gemini-tts.provider.js';

interface TtsRequest {
  text: string;
  provider: 'gemini' | 'minimax' | 'elevenlabs';
  voice?: string;
  language?: string;
  storybookId: string;
  pageNumber: number;
}

interface TtsBatchRequest {
  pages: Array<{ pageNumber: number; text: string }>;
  provider: 'gemini' | 'minimax' | 'elevenlabs';
  voice?: string;
  language?: string;
  storybookId: string;
}

export const TtsService = {
  async generate(req: TtsRequest): Promise<string> {
    const { provider, text, voice, language, storybookId, pageNumber } = req;

    let audioBuffer: Buffer;
    let ext: string;
    let mimeType: string;

    switch (provider) {
      case 'gemini':
        audioBuffer = await generateGeminiTts({ text, voice, language });
        ext = 'wav';
        mimeType = 'audio/wav';
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

    const key = `${storybookId}-tts-page${pageNumber}-${Date.now()}.${ext}`;
    return R2Repository.uploadBuffer(audioBuffer, key, mimeType);
  },

  async batch(
    req: TtsBatchRequest
  ): Promise<Array<{ pageNumber: number; audioUrl: string; success: boolean }>> {
    const { pages, ...opts } = req;

    const results = await Promise.allSettled(
      pages.map(async (page) => {
        const audioUrl = await TtsService.generate({ ...opts, ...page });
        return { pageNumber: page.pageNumber, audioUrl, success: true };
      })
    );

    return results.map((r, i) =>
      r.status === 'fulfilled'
        ? r.value
        : { pageNumber: pages[i].pageNumber, audioUrl: '', success: false }
    );
  },

  async uploadAudio(file: Express.Multer.File, body: Record<string, string>): Promise<string> {
    const key = `${body.storybookId}-tts-page${body.pageNumber}-${Date.now()}.${file.originalname.split('.').pop() ?? 'mp3'}`;
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
