import OpenAI, { toFile } from 'openai';

export class WhisperProvider {
  private client: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    } else {
      console.warn('[whisper] OPENAI_API_KEY not set — fallback disabled');
    }
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  async transcribe(
    blob: Buffer,
    mimeType: string,
    lang: 'ko' | 'en'
  ): Promise<{ transcription: string | null }> {
    if (!this.client) {
      throw Object.assign(new Error('Whisper not configured'), { code: 'NO_API_KEY' });
    }

    const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';

    const file = await toFile(blob, `audio.${ext}`, { type: mimeType });
    const res = await this.client.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: lang,
      response_format: 'text',
    });
    const transcription = typeof res === 'string' ? res.trim() : null;
    return { transcription: transcription || null };
  }
}

export const whisperProvider = new WhisperProvider();
