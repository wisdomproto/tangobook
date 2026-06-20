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
