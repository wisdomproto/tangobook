import 'dotenv/config';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  gemini: {
    apiKey: requireEnv('GEMINI_API_KEY'),
    textModel: process.env.GEMINI_TEXT_MODEL ?? 'gemini-2.5-flash',
    imageModel: process.env.GEMINI_IMAGE_MODEL ?? 'gemini-3-pro-image-preview',
    ttsModel: process.env.GEMINI_TTS_MODEL ?? 'gemini-2.5-flash-preview-tts',
    ttsVoice: process.env.GEMINI_TTS_VOICE ?? 'Leda',
  },

  r2: {
    accountId: requireEnv('R2_ACCOUNT_ID'),
    accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
    secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
    bucketName: requireEnv('R2_BUCKET_NAME'),
    publicUrl: requireEnv('R2_PUBLIC_URL'),
  },

  minimax: {
    apiKey: process.env.MINIMAX_API_KEY ?? '',
    groupId: process.env.MINIMAX_GROUP_ID ?? '',
  },

  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY ?? '',
  },
} as const;
