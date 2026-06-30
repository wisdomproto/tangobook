import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? '',
    textModel: process.env.GEMINI_TEXT_MODEL ?? 'gemini-3.1-pro-preview',
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

  // Marketing Phase 0+ — all optional; server boots without these
  ga4: {
    propertyId: process.env.GA4_PROPERTY_ID ?? '',
    clientEmail: process.env.GA4_CLIENT_EMAIL ?? '',
    privateKey: (process.env.GA4_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
  },

  meta: {
    appId: process.env.META_APP_ID ?? '',
    appSecret: process.env.META_APP_SECRET ?? '',
  },

  youtubeApiKey: process.env.YOUTUBE_DATA_API_KEY ?? '',

  dataforseo: {
    login: process.env.DATAFORSEO_LOGIN ?? '',
    password: process.env.DATAFORSEO_PASSWORD ?? '',
  },

  naverDatalab: {
    clientId: process.env.NAVER_DATALAB_CLIENT_ID ?? '',
    secret: process.env.NAVER_DATALAB_SECRET ?? '',
  },

  supabase: {
    url: process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    anonKey: process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '',
  },

  // 마케팅 게이트 로그인: 8054 입력 시 ownerEmail 계정 세션을 service-role로 발급
  mkt: {
    gateCode: process.env.MKT_GATE_CODE ?? '',
    ownerEmail: process.env.MKT_OWNER_EMAIL ?? '',
  },

  cron: { secret: process.env.CRON_SECRET ?? '' }, // optional manual-tick guard (spec §4.5)

  toss: {
    secretKey: process.env.TOSS_SECRET_KEY ?? '',
  },
} as const;
