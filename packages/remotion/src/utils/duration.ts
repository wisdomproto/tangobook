import type { AudiobookRenderProps } from '../types';

const CROSSFADE_FRAMES = 30;
const TTS_DELAY_FRAMES = 20;
const DEFAULT_SLIDE_FRAMES = 90;
const ENDING_FRAMES = 90;

export function calculateTotalFrames(props: AudiobookRenderProps): number {
  const fps = props.fps ?? 30;
  const coverFrames = props.cover ? Math.ceil(props.cover.duration * fps) : 0;

  let total = coverFrames;
  for (const slide of props.slides) {
    total += slide.ttsDuration
      ? TTS_DELAY_FRAMES + Math.ceil((slide.ttsDuration + 1.5) * fps)
      : DEFAULT_SLIDE_FRAMES;
  }
  total += ENDING_FRAMES;

  const transitionCount = (props.cover ? 1 : 0) + Math.max(0, props.slides.length - 1) + 1;
  total -= transitionCount * CROSSFADE_FRAMES;

  return Math.max(total, fps);
}
