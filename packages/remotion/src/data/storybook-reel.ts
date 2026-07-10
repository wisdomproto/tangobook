import { z } from 'zod';

export const REEL_FPS = 30;
export const REEL_WIDTH = 1080;
export const REEL_HEIGHT = 1920;

export const HOOK_SEC = 4;
export const BODY_SEC = 8;
export const MORPH_SEC = 6;
export const CTA_SEC = 6;

export const MORPH_LINES = ['탱고북에선', '한 권의 이야기를', '아이의 취향대로 고를 수 있습니다'];

export const SceneSchema = z.object({
  label: z.string(),
  body: z.string(),
  imageUrls: z.array(z.string()).min(1),
});
export const MorphStyleSchema = z.object({ url: z.string(), label: z.string() });
export const StorybookReelPropsSchema = z.object({
  bookTitle: z.string(),
  scenes: z.array(SceneSchema).min(2),
  styleMorph: z
    .object({ lines: z.array(z.string()).min(1), styles: z.array(MorphStyleSchema).min(2) })
    .nullable(),
});
export type StorybookReelProps = z.infer<typeof StorybookReelPropsSchema>;

export function sceneDurations(props: StorybookReelProps): number[] {
  return props.scenes.map((_, i) => (i === 0 ? HOOK_SEC : BODY_SEC) * REEL_FPS);
}
export function computeReelFrames(props: StorybookReelProps): number {
  const scenes = sceneDurations(props).reduce((a, b) => a + b, 0);
  const morph = props.styleMorph ? MORPH_SEC * REEL_FPS : 0;
  return scenes + morph + CTA_SEC * REEL_FPS;
}
export const BGM_SRC = 'reels/bgm.mp3';
