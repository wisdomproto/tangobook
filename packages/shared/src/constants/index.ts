export const TARGET_AGES = ['4-5', '5-7', '7-8'] as const;
export type TargetAge = (typeof TARGET_AGES)[number];

export const ART_STYLES = [
  { id: 'modern-illustration', label: '현대 일러스트', prompt: 'Modern Illustration' },
  { id: 'watercolor', label: '수채화', prompt: 'Watercolor' },
  { id: 'cartoon', label: '카툰', prompt: 'Cartoon' },
  { id: 'traditional', label: '전통 동화책', prompt: 'Traditional Storybook' },
  { id: 'animation', label: '애니메이션', prompt: 'Animation' },
  { id: 'oil-painting', label: '유화', prompt: 'Oil Painting' },
  { id: 'pencil-sketch', label: '연필 스케치', prompt: 'Pencil Sketch' },
] as const;

export const ASPECT_RATIOS = ['1:1', '4:3', '16:9', '3:4', '9:16'] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: '영어' },
  { code: 'ja', label: '일본어' },
  { code: 'zh', label: '중국어' },
  { code: 'es', label: '스페인어' },
  { code: 'fr', label: '프랑스어' },
  { code: 'de', label: '독일어' },
] as const;

export const TTS_PROVIDERS = ['gemini', 'minimax', 'elevenlabs'] as const;
export type TtsProvider = (typeof TTS_PROVIDERS)[number];

export const TTS_VOICES = [
  { id: 'Leda', label: '레다', description: 'Youthful' },
  { id: 'Sulafat', label: '술라파트', description: 'Warm' },
  { id: 'Vindemiatrix', label: '빈데미아트릭스', description: 'Gentle' },
  { id: 'Achird', label: '아키르드', description: 'Friendly' },
  { id: 'Sadachbia', label: '사다크비아', description: 'Lively' },
  { id: 'Puck', label: '퍽', description: 'Upbeat' },
  { id: 'Kore', label: '코레', description: 'Firm' },
  { id: 'Achernar', label: '아케르나르', description: 'Soft' },
  { id: 'Zephyr', label: '제피르', description: 'Bright' },
  { id: 'Aoede', label: '아오에데', description: 'Breezy' },
] as const;

export const MAX_IMAGE_HISTORY = 10;
export const MAX_FILE_SIZE_MB = 5;
