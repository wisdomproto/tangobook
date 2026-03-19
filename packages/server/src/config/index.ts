import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? '',
    textModel: process.env.GEMINI_TEXT_MODEL ?? 'gemini-2.5-flash',
    imageModel: process.env.GEMINI_IMAGE_MODEL ?? 'gemini-3.1-flash-image-preview',
    ttsModel: process.env.GEMINI_TTS_MODEL ?? 'gemini-2.5-flash-preview-tts',
    ttsVoice: process.env.GEMINI_TTS_VOICE ?? 'Leda',
  },

  r2: {
    accountId: process.env.R2_ACCOUNT_ID ?? '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    bucketName: process.env.R2_BUCKET_NAME ?? '',
    publicUrl: process.env.R2_PUBLIC_URL ?? '',
  },

  minimax: {
    apiKey: process.env.MINIMAX_API_KEY ?? '',
    groupId: process.env.MINIMAX_GROUP_ID ?? '',
  },

  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY ?? '',
  },

  naverAd: {
    apiKey: process.env.NAVER_AD_API_KEY ?? '',
    secretKey: process.env.NAVER_AD_SECRET_KEY ?? '',
    customerId: process.env.NAVER_AD_CUSTOMER_ID ?? '',
  },

  // Optional: required only when generating videos via Grok
  xai: {
    apiKey: process.env.XAI_API_KEY ?? '',
  },

  // Optional: required only for YouTube auto-upload
  youtube: {
    clientId: process.env.YOUTUBE_CLIENT_ID ?? '',
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET ?? '',
    redirectUri:
      process.env.YOUTUBE_REDIRECT_URI ??
      'http://localhost:3000/api/longform/youtube/oauth/callback',
  },
} as const;
