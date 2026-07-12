import { config } from '../config/index.js';
import { AppError } from '../middleware/error.middleware.js';

/**
 * Google Cloud Text-to-Speech (REST, API 키 인증).
 * 다국어 어휘 게임 단어 발음용 — native 보이스라 성조/발음 정확(학습앱 적합).
 * Gemini TTS 의 짧은 CJK/타이 단어 무응답 이슈가 없어 낱단어에 안정적.
 *
 * 🔴 키에 Cloud Text-to-Speech API 접근 허용 필요 (기본 GEMINI 키는 SERVICE_BLOCKED 날 수 있음).
 */
interface GoogleVoice {
  languageCode: string;
  name: string;
}

// 언어 코드(우리 Lang) → Google 보이스. zh=간체=Mandarin(cmn-CN).
// 보이스는 STT 되받아쓰기(speech.googleapis.com)로 발음 정확도 검증해 선정(2026-07-12):
//  - zh/th Chirp3-HD Leda = 낱단어 전사 0.83~0.98(정확·자연). ⚠️ 구형 Wavenet/Neural2 는 로봇 톤.
//  - vi Chirp3-HD Achernar = 낱단어 최고 인식(mèo 0.97, bướm 0.74). 🔴 vi 는 원래 분류사와 함께
//    말해야 자연(con mèo/quả táo) — 맨 낱단어는 성조 오인 여지 있어 추후 분류사 프레이밍으로 개선 예정.
const VOICE_BY_LANG: Record<string, GoogleVoice> = {
  ko: { languageCode: 'ko-KR', name: 'ko-KR-Neural2-A' },
  en: { languageCode: 'en-US', name: 'en-US-Neural2-F' },
  vi: { languageCode: 'vi-VN', name: 'vi-VN-Chirp3-HD-Achernar' },
  zh: { languageCode: 'cmn-CN', name: 'cmn-CN-Chirp3-HD-Leda' },
  th: { languageCode: 'th-TH', name: 'th-TH-Chirp3-HD-Leda' },
};

export interface GoogleTtsOptions {
  text: string;
  language?: string;
  /** 보이스 이름 override (VOICE_BY_LANG 기본 대신). languageCode 는 lang 에서 결정. */
  voice?: string;
  /** 발화 속도 (0.25~4.0). 4-5세용 살짝 느리게 기본. */
  speakingRate?: number;
}

export async function generateGoogleTts(options: GoogleTtsOptions): Promise<Buffer> {
  const key = config.googleTts.apiKey;
  if (!key) {
    throw new AppError(
      500,
      'Google TTS 키가 없습니다. GOOGLE_TTS_API_KEY (또는 Cloud TTS 허용된 GEMINI_API_KEY) 를 설정하세요.'
    );
  }
  const lang = options.language ?? 'en';
  const base = VOICE_BY_LANG[lang] ?? VOICE_BY_LANG.en;
  const voiceName = options.voice ?? base.name;
  const text = options.text.replace(/\//g, '').trim();
  if (!text) throw new AppError(400, 'TTS 텍스트가 비었습니다.');

  const body = {
    input: { text },
    voice: { languageCode: base.languageCode, name: voiceName },
    audioConfig: { audioEncoding: 'MP3', speakingRate: options.speakingRate ?? 0.95 },
  };

  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(key)}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  if (!res.ok) {
    const t = await res.text();
    throw new AppError(res.status, `Google TTS ${res.status}: ${t.slice(0, 240)}`);
  }
  const json = (await res.json()) as { audioContent?: string };
  if (!json.audioContent) throw new AppError(500, 'Google TTS 응답에 audioContent 가 없습니다.');
  return Buffer.from(json.audioContent, 'base64');
}
