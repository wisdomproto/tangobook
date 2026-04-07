import type { AudiobookRenderData, LongformScene } from '@tangobook/shared';

const CROSSFADE_SEC = 0.5;
const DEFAULT_SLIDE_SEC = 3.0;
const SLIDE_PADDING_SEC = 1.5; // extra time added to ttsDuration

/**
 * Format seconds to SRT timestamp: HH:MM:SS,mmm
 */
function formatSrtTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const ms = Math.round((totalSeconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

/**
 * Get slide duration in seconds (mirrors Remotion's duration.ts logic).
 */
function getSlideDuration(ttsDuration?: number): number {
  return ttsDuration ? ttsDuration + SLIDE_PADDING_SEC : DEFAULT_SLIDE_SEC;
}

/**
 * Generate SRT subtitle string from audiobook render data.
 * Timing mirrors Remotion's TransitionSeries with crossfade overlaps.
 */
export function generateSrt(renderData: AudiobookRenderData): string {
  const entries: string[] = [];
  let cursor = 0; // current time in seconds
  let index = 1;

  // Cover slide: adds duration but no subtitle
  if (renderData.cover) {
    cursor += renderData.cover.duration;
    cursor -= CROSSFADE_SEC; // crossfade overlap with first slide
  }

  for (let i = 0; i < renderData.slides.length; i++) {
    const slide = renderData.slides[i];
    const duration = getSlideDuration(slide.ttsDuration);

    if (slide.subtitleText) {
      const startTime = Math.max(0, cursor);
      const endTime = cursor + duration - SLIDE_PADDING_SEC; // subtitle ends before slide padding
      entries.push(
        `${index}\n${formatSrtTime(startTime)} --> ${formatSrtTime(endTime)}\n${slide.subtitleText}\n`
      );
      index++;
    }

    cursor += duration;

    // Crossfade overlap with next slide (not after last slide)
    if (i < renderData.slides.length - 1) {
      cursor -= CROSSFADE_SEC;
    }
  }

  return entries.join('\n');
}

/**
 * Generate SRT from longform scenes.
 * Each scene has subtitles[] with absolute startTime/endTime already calculated.
 * We need to offset by each scene's start time in the final video.
 */
export function generateLongformSrt(scenes: LongformScene[], crossfadeDuration = 0.5): string {
  const entries: string[] = [];
  let index = 1;
  let sceneStart = 0;

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const clipDuration = scene.clipDuration ?? 5;
    const trimStart = scene.trimStart ?? 0;
    const trimEnd = scene.trimEnd ?? clipDuration;
    const effectiveDuration = trimEnd - trimStart;

    if (scene.subtitles) {
      for (const sub of scene.subtitles) {
        const start = sceneStart + sub.startTime;
        const end = sceneStart + sub.endTime;
        if (sub.text.trim()) {
          entries.push(
            `${index}\n${formatSrtTime(start)} --> ${formatSrtTime(end)}\n${sub.text}\n`
          );
          index++;
        }
      }
    }

    sceneStart += effectiveDuration;
    // Crossfade overlap with next scene
    if (i < scenes.length - 1) {
      sceneStart -= crossfadeDuration;
    }
  }

  return entries.join('\n');
}
