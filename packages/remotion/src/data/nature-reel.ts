import { z } from 'zod';
import { REEL_FPS, REEL_WIDTH, REEL_HEIGHT, SceneSchema, BGM_SRC, pickBgm } from './storybook-reel';

export { REEL_FPS, REEL_WIDTH, REEL_HEIGHT, BGM_SRC, pickBgm };
// 리뷰 반영(2026-07-17): 홍보 꼬리(시리즈+클로징)가 11s = 전체의 1/3이라 "마지막 두 장이 거의
// 똑같다"·"광고 티" 피드백 → 8s 로 축소. 본문 8→6s = 제목이 더 자주 바뀌어 "멈춘 줄 알았다" 완화.
export const NATURE_SERIES_SEC = 4;
export const NATURE_CTA_SEC = 4;
export const NATURE_HOOK_SEC = 4;
export const NATURE_BODY_SEC = 6;

export const NatureSeriesSchema = z.object({
  covers: z.array(z.string()).min(1),
  // 라벨 없음 = 전권 스크롤 모드(생활동화 45편). 8칸 요약 모드(자연도감)일 때만 라벨을 준다.
  labels: z.array(z.string()).min(1).optional(),
  headline: z.string(),
  // 시리즈 씬 길이. 미지정이면 NATURE_SERIES_SEC — 45편 스크롤은 4s 로는 다 못 흘러 6s 를 쓴다.
  durSec: z.number().optional(),
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
export function natureSeriesFrames(props: NatureReelProps): number {
  return (props.series.durSec ?? NATURE_SERIES_SEC) * REEL_FPS;
}
export function computeNatureReelFrames(props: NatureReelProps): number {
  const scenes = natureSceneDurations(props).reduce((a, b) => a + b, 0);
  return scenes + natureSeriesFrames(props) + NATURE_CTA_SEC * REEL_FPS;
}
