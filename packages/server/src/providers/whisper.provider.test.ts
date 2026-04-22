import { describe, it, expect, vi, beforeEach } from 'vitest';

// openai module mock — must be defined before importing the provider
vi.mock('openai', () => {
  const transcriptionsCreate = vi.fn().mockResolvedValue('안녕');
  class OpenAIMock {
    audio = { transcriptions: { create: transcriptionsCreate } };
    static __mock = { transcriptionsCreate };
  }
  return {
    default: OpenAIMock,
    toFile: vi.fn((blob, filename, opts) => Promise.resolve({ filename, opts })),
  };
});

import { WhisperProvider } from './whisper.provider.js';

describe('WhisperProvider', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key';
  });

  it('mimeType → 확장자 매핑: audio/mp4 → m4a, audio/ogg → ogg, else webm', async () => {
    const provider = new WhisperProvider();
    const { toFile } = await import('openai');
    const toFileMock = toFile as any;

    await provider.transcribe(Buffer.from('x'), 'audio/mp4', 'ko');
    expect(toFileMock).toHaveBeenCalledWith(expect.anything(), 'audio.m4a', {
      type: 'audio/mp4',
    });

    await provider.transcribe(Buffer.from('x'), 'audio/ogg', 'en');
    expect(toFileMock).toHaveBeenCalledWith(expect.anything(), 'audio.ogg', {
      type: 'audio/ogg',
    });

    await provider.transcribe(Buffer.from('x'), 'audio/webm;codecs=opus', 'ko');
    expect(toFileMock).toHaveBeenCalledWith(expect.anything(), 'audio.webm', {
      type: 'audio/webm;codecs=opus',
    });
  });
});
