import { ART_STYLES } from '../constants/index.js';
import type { LearnerStyleGenre, SavedArtStyle } from '../types/storybook.js';

/**
 * 그림체 raw 문자열 (ART_STYLES.id 또는 prompt 전체) → canonical id 로 정규화.
 * 같은 그림체가 두 가지 형태로 들어와도 같은 버킷으로 합치기 위함.
 *
 * - ART_STYLES[].id 와 정확히 일치하면 그대로 반환 (이미 canonical)
 * - ART_STYLES[].prompt 와 일치하면 해당 id 반환
 * - prompt 의 prefix 30자 가 일치하면 해당 id 반환 (긴 prompt 의 일부만 들어온 경우)
 * - 매칭 실패 시 raw 그대로 반환 (custom 그림체)
 */
export function canonicalizeArtStyle(raw: string): string {
  if (!raw) return raw;
  const lower = raw.toLowerCase();

  // 1) ART_STYLES.id 일 경우
  const byId = ART_STYLES.find((s) => s.id === raw);
  if (byId) return byId.id;

  // 2) prompt 전체로 들어온 경우 (v1 artStyle 의 prompt 형태)
  const byPrompt = ART_STYLES.find((s) => s.prompt.toLowerCase() === lower);
  if (byPrompt) return byPrompt.id;

  // 3) prompt 가 길어서 일부만 들어온 경우 (예: "Paper craft, layered..." prefix 매칭)
  const byPromptPrefix = ART_STYLES.find(
    (s) => lower.startsWith(s.prompt.toLowerCase().slice(0, 30)) && s.prompt.length > 20
  );
  if (byPromptPrefix) return byPromptPrefix.id;

  // 매칭 실패 — 그대로 반환 (custom 그림체)
  return raw;
}

/**
 * 그림체 raw 문자열 → 사용자 친화 한국어 라벨.
 * - preset 매칭 시 ART_STYLES.label (예: '종이공예', '3D 픽사')
 * - 매칭 실패 (custom) 시 raw 그대로 반환
 *
 * BookDetail / BookCards / Editor 등에서 chip 노출 시 사용.
 * (raw 가 prompt 전체이면 학습자 화면에 부적합)
 */
export function getArtStyleLabel(raw: string): string {
  if (!raw) return raw;
  const id = canonicalizeArtStyle(raw);
  return ART_STYLES.find((s) => s.id === id)?.label ?? raw;
}

/** 라이브러리에서 그 그림체 항목 — id 또는 합쳐진 옛 id(`aliases`)로 찾는다. */
export function findLibraryStyle(
  library: SavedArtStyle[] | undefined,
  styleId: string | undefined
): SavedArtStyle | undefined {
  if (!library || !styleId) return undefined;
  return library.find((s) => s.id === styleId) ?? library.find((s) => s.aliases?.includes(styleId));
}

/**
 * 그림체 id(옛 id 포함) → 학습자 갈래. 🔴 따로 두던 `_index/style-genre-map.json` 표를 대신한다(2026-09-14)
 * — 갈래는 이제 라이브러리 항목의 한 칸이다.
 */
export function styleGenreMapOf(
  library: SavedArtStyle[] | undefined
): Record<string, LearnerStyleGenre> {
  const out: Record<string, LearnerStyleGenre> = {};
  for (const s of library ?? []) {
    if (!s.genre) continue;
    out[s.id] = s.genre;
    for (const a of s.aliases ?? []) out[a] = s.genre;
  }
  return out;
}

/**
 * 학습자 화면에 쓰는 갈래 이름 — 🔴 그림체 실명은 안 쓰고 이 갈래 라벨만 쓴다(저작권 예방 정책).
 * 클라 `lib/art-style-genre.ts` 의 `STYLE_GENRES` 와 같은 글자여야 한다.
 */
export const LEARNER_GENRE_LABEL: Record<LearnerStyleGenre, string> = {
  watercolor: '수채동화풍',
  paper3d: '페이퍼 3D 아트',
  collage: '콜라주',
};
