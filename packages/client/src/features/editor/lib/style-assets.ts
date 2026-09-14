import { ART_STYLES } from '@tangobook/shared';
import type { SavedArtStyle } from '@tangobook/shared';

/**
 * artStyle 값이 preset 의 prompt 또는 id 와 매칭되는 preset 찾기.
 * 우선 순위: R2 art-style-library (사용자 편집 라벨 우선) → ART_STYLES 정적 preset.
 */
export function findArtStylePreset(value: string, lib?: SavedArtStyle[]) {
  const v = value.toLowerCase();
  if (lib && lib.length) {
    const hit = lib.find((s) => s.prompt.toLowerCase() === v || s.id.toLowerCase() === v);
    if (hit) return { id: hit.id, label: hit.name, prompt: hit.prompt };
  }
  return ART_STYLES.find((s) => s.prompt.toLowerCase() === v || s.id.toLowerCase() === v);
}
