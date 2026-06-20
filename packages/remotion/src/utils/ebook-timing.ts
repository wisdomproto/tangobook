import { EBOOK_FPS } from '../data/mosquito-ebook';

// 페이지 진입 후 자막은 즉시, 낭독은 약간 지연(어색한 즉시 재생 방지). 낭독 뒤 여백.
export const TTS_DELAY_SEC = 0.45;
export const TAIL_PAD_SEC = 1.1;
// TTS 없는 페이지(표지 등) 최소 길이.
export const MIN_PAGE_SEC = 4;

/** 페이지 길이(프레임) = 지연 + TTS 길이 + 여백. TTS 없으면 최소 길이. */
export function pageDurationFrames(ttsDurationSec: number | undefined, fps = EBOOK_FPS): number {
  const body =
    ttsDurationSec != null && ttsDurationSec > 0
      ? TTS_DELAY_SEC + ttsDurationSec + TAIL_PAD_SEC
      : MIN_PAGE_SEC;
  return Math.max(1, Math.round(body * fps));
}

/** 낭독 시작 프레임(자막보다 약간 늦게). */
export function ttsStartFrame(fps = EBOOK_FPS): number {
  return Math.round(TTS_DELAY_SEC * fps);
}

/** 자막 한 토막 = 나레이션 한 줄. TTS 진행에 맞춰 등장(글자 수 비례 추정). */
export interface EbookCaption {
  /** 0-based 줄 인덱스 (나레이션 \n 분할, 빈 줄 제외) */
  index: number;
  text: string;
  startFrame: number;
  endFrame: number;
}

/**
 * 나레이션을 \n 단위로 잘라 각 줄의 등장/퇴장 프레임을 산출한다.
 * Gemini TTS 가 단어 타임스탬프를 안 주므로, 줄별 글자 수 비례로 ttsDurationSec 에 분배한다.
 * TTS 없으면(표지 등) MIN_PAGE_SEC 를 균등 분배. ko/ja 가 같은 줄 구조면 index 가 양 언어에서 정합.
 */
export function buildCaptions(
  narration: string | undefined,
  ttsDurationSec: number | undefined,
  fps = EBOOK_FPS
): EbookCaption[] {
  const lines = (narration ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const start = ttsStartFrame(fps);
  const speechFrames =
    ttsDurationSec != null && ttsDurationSec > 0
      ? Math.round(ttsDurationSec * fps)
      : Math.round((MIN_PAGE_SEC - TTS_DELAY_SEC) * fps);
  const totalChars = lines.reduce((s, l) => s + l.length, 0) || 1;

  let acc = 0;
  return lines.map((text, index) => {
    const startFrame = start + Math.round((acc / totalChars) * speechFrames);
    acc += text.length;
    const endFrame = start + Math.round((acc / totalChars) * speechFrames);
    return { index, text, startFrame, endFrame };
  });
}

/** 현재 프레임에서 활성 자막(이미 시작된 것 중 마지막). 시작 전이면 첫 줄. */
export function activeCaption(captions: EbookCaption[], frame: number): EbookCaption | null {
  if (captions.length === 0) return null;
  let active = captions[0];
  for (const c of captions) {
    if (c.startFrame <= frame) active = c;
    else break;
  }
  return active;
}
