import { phonicsApi } from '@/features/phonics/api/phonics.api';

/**
 * 단어/구절 TTS URL fallback chain 의 공용 resolver.
 *
 * 호출처 (현재):
 *  - WordDetailModal (책 상세 단어 미리보기)
 *  - KoreanBlockPlayer / EnglishBlockPlayer (블록 게임 정답 시 단어 발음)
 *  - ConnectTheDotsPlayer (점잇기 정답 시)
 *  - WordWritingPlayer (낱말쓰기 정답 시)
 *
 * 정책 (game-policies-2026-05-10 / 본 모듈로 통합 2026-05-18):
 *  - 한글: phonics 음절 합성 우선 (자모 학습 톤 일관) → 합성 실패 시 directUrl
 *  - 영어: directUrl 우선 (자연 발음) → 없으면 phonics concat 폴백
 *
 * 둘 다 없으면 `undefined` → caller 가 무음 / Web Speech 등 추가 폴백 결정.
 *
 * server 의 7종성 중화 fallback (`@tangobook/shared/utils/phonics-syllable.neutralizeKoreanFinal`)
 * 덕분에 꽃·밧줄·앞·옆 같은 ㅅ/ㅆ/ㅈ/ㅊ/ㅌ/ㅎ/ㅋ/ㅍ 받침도 한글 concat 으로 처리됨.
 */
export interface ResolveTtsOptions {
  text: string;
  language: 'korean' | 'english';
  /** phonics concat 캐시 key 의 storybook 식별자. 책 단위 캐시 분리용. concat 사용 시 필수. */
  storybookId?: string;
  /** caller 가 미리 알고 있는 직접 URL (예: word.ttsUrl, key_object.ttsUrl) */
  directUrl?: string;
  /**
   * concat 캐시 key identifier prefix. caller 별 유니크 (예: 'kblock', 'eblock', 'dot', 'wwrite', 'vocab').
   * 같은 단어라도 caller 다르면 다른 캐시 entry — 사용 분석/디버깅 용.
   */
  identifierPrefix?: string;
}

async function tryConcat(opts: ResolveTtsOptions): Promise<string | undefined> {
  const { text, language, storybookId, identifierPrefix = 'tts' } = opts;
  if (!storybookId) return undefined;
  try {
    const { audioUrl } = await phonicsApi.concatPhonicsAudio({
      text,
      storybookId,
      identifier: `${identifierPrefix}-${language === 'korean' ? 'ko' : 'en'}-${encodeURIComponent(text)}`,
      language,
    });
    return audioUrl;
  } catch {
    return undefined;
  }
}

export async function resolveTtsUrl(opts: ResolveTtsOptions): Promise<string | undefined> {
  if (opts.language === 'korean') {
    // 음절 합성 우선
    const concat = await tryConcat(opts);
    if (concat) return concat;
    return opts.directUrl;
  }
  // 영어: directUrl 우선
  if (opts.directUrl) return opts.directUrl;
  return await tryConcat(opts);
}
