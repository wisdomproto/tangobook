import { ART_STYLES, findLibraryStyle } from '@tangobook/shared';
import type { SavedArtStyle, Storybook } from '@tangobook/shared';

/**
 * artStyle 값이 preset 의 prompt 또는 id 와 매칭되는 preset 찾기.
 * 우선 순위: R2 art-style-library (사용자 편집 라벨 우선) → ART_STYLES 정적 preset.
 */
export function findArtStylePreset(value: string, lib?: SavedArtStyle[]) {
  const v = value.toLowerCase();
  if (lib && lib.length) {
    const hit =
      lib.find((s) => s.prompt.toLowerCase() === v || s.id.toLowerCase() === v) ??
      findLibraryStyle(lib, value);
    if (hit) return { id: hit.id, label: hit.name, prompt: hit.prompt };
  }
  return ART_STYLES.find((s) => s.prompt.toLowerCase() === v || s.id.toLowerCase() === v);
}

/**
 * 책의 그림체를 바꾼다. 공개 설정은 그림체 id 를 키로 들고 있어서 새 id 로 옮겨야 비공개가 풀리지 않는다.
 * 🔴 editor2 의 그림체 고르기(그림체 줄 · 기본설정 · 책 관리)는 전부 이 함수를 쓴다.
 */
export function applyArtStyle(draft: Storybook, styleId: string): void {
  const old = draft.artStyle;
  draft.artStyle = styleId;
  if (old !== styleId && draft.publicByStyleLang?.[old]) {
    const { [old]: cell, ...rest } = draft.publicByStyleLang;
    draft.publicByStyleLang = { ...rest, [styleId]: cell };
  }
}
