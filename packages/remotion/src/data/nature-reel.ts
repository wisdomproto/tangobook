import { z } from 'zod';
import { REEL_FPS, REEL_WIDTH, REEL_HEIGHT, SceneSchema, BGM_SRC, pickBgm } from './storybook-reel';

export { REEL_FPS, REEL_WIDTH, REEL_HEIGHT, BGM_SRC, pickBgm };
export const NATURE_SERIES_SEC = 5;
export const NATURE_CTA_SEC = 6;
export const NATURE_HOOK_SEC = 4;
export const NATURE_BODY_SEC = 8;

export const NatureSeriesSchema = z.object({
  covers: z.array(z.string()).min(1),
  labels: z.array(z.string()).min(1),
  headline: z.string(),
});
export const NatureReelPropsSchema = z.object({
  bookTitle: z.string(),
  category: z.string(),
  scenes: z.array(SceneSchema).min(2),
  series: NatureSeriesSchema,
});
export type NatureReelProps = z.infer<typeof NatureReelPropsSchema>;

export function natureSceneDurations(props: NatureReelProps): number[] {
  return props.scenes.map(
    (s, i) => (s.durSec ?? (i === 0 ? NATURE_HOOK_SEC : NATURE_BODY_SEC)) * REEL_FPS
  );
}
export function computeNatureReelFrames(props: NatureReelProps): number {
  const scenes = natureSceneDurations(props).reduce((a, b) => a + b, 0);
  return scenes + (NATURE_SERIES_SEC + NATURE_CTA_SEC) * REEL_FPS;
}
