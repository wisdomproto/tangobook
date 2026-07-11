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
  durSec: z.number().optional(), // 씬별 길이(초). 없으면 훅=4·나머지=8.
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
  return props.scenes.map((s, i) => (s.durSec ?? (i === 0 ? HOOK_SEC : BODY_SEC)) * REEL_FPS);
}
export function computeReelFrames(props: StorybookReelProps): number {
  const scenes = sceneDurations(props).reduce((a, b) => a + b, 0);
  const morph = props.styleMorph ? MORPH_SEC * REEL_FPS : 0;
  return scenes + morph + CTA_SEC * REEL_FPS;
}
export const BGM_SRC = 'reels/bgm.mp3';

// 릴스 BGM 풀 — 책마다 다양하게(책 제목 해시로 고정 선택 → 재렌더 시 동일).
export const BGM_TRACKS = [
  'reels/bgm-1.mp3',
  'reels/bgm-2.mp3',
  'reels/bgm-3.mp3',
  'reels/bgm-4.mp3',
  'reels/bgm-5.mp3',
  'reels/bgm-6.mp3',
  'reels/bgm-7.mp3',
  'reels/bgm-8.mp3',
  'reels/bgm-9.mp3',
];
export function pickBgm(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return BGM_TRACKS[h % BGM_TRACKS.length];
}
