import { ART_STYLES } from '@tangobook/shared';
import type { Storybook, StyleAssets, SavedArtStyle } from '@tangobook/shared';

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

/** 활성 그림체 외 다른 그림체들의 자산 (참고용 표시 데이터). */
export interface OtherStyleEntry {
  style: string;
  label: string;
  assets: StyleAssets;
}

/**
 * styleAssets 에 저장된 그림체들 중 현재 활성 그림체를 제외한 목록.
 * 새 그림체로 작업할 때 기존 그림체의 자산을 참고용으로 보여주기 위해 사용.
 */
export function getOtherStyleAssets(storybook: Storybook): OtherStyleEntry[] {
  const current = storybook.artStyle;
  return Object.entries(storybook.styleAssets ?? {})
    .filter(([style]) => style !== current)
    .map(([style, assets]) => ({
      style,
      label: findArtStylePreset(style)?.label ?? '커스텀',
      assets,
    }));
}

/**
 * 현재 storybook 의 top-level per-style 필드를 StyleAssets 로 추출.
 * 그림체 전환 직전에 호출해서 styleAssets[currentStyle] 에 보관.
 */
function snapshotCurrentStyleAssets(sb: Storybook): StyleAssets {
  const characterImages = (sb.characters ?? []).map((c) => ({
    referenceImage: c.referenceImage,
    imageHistory: c.imageHistory,
    prompt: c.prompt,
  }));

  const pageIllustrations: Record<number, NonNullable<StyleAssets['pageIllustrations']>[number]> =
    {};
  for (const p of sb.pages ?? []) {
    if (p.illustrationUrl || (p.illustrationHistory && p.illustrationHistory.length > 0)) {
      pageIllustrations[p.pageNumber] = {
        illustrationUrl: p.illustrationUrl,
        illustrationHistory: p.illustrationHistory,
        customModifications: p.customModifications,
      };
    }
  }

  return {
    coverImages: sb.coverImages,
    coverImage: sb.coverImage,
    coverPrompt: sb.coverPrompt,
    coverImageHistory: sb.coverImageHistory,
    coverCharacterRefs: sb.coverCharacterRefs,
    primaryCoverByLang: sb.primaryCoverByLang,
    characterImages,
    pageIllustrations,
    keyObjectImages: sb.keyObjectImages,
    vocabularyImages: sb.vocabularyImages,
  };
}

/**
 * StyleAssets 를 storybook 의 top-level 필드에 머지 (현재 활성 그림체의 데이터로 사용).
 * 빈 자산 (= 새 그림체) 면 top-level per-style 필드를 모두 비움.
 */
function applyStyleAssets(sb: Storybook, assets: StyleAssets | undefined): void {
  // 표지
  sb.coverImages = assets?.coverImages;
  sb.coverImage = assets?.coverImage;
  sb.coverPrompt = assets?.coverPrompt;
  sb.coverImageHistory = assets?.coverImageHistory;
  sb.coverCharacterRefs = assets?.coverCharacterRefs;
  sb.primaryCoverByLang = assets?.primaryCoverByLang;

  // 캐릭터 이미지 (텍스트 필드는 그대로, 이미지/프롬프트만 교체)
  sb.characters = (sb.characters ?? []).map((c, i) => {
    const ci = assets?.characterImages?.[i];
    return {
      ...c,
      referenceImage: ci?.referenceImage,
      imageHistory: ci?.imageHistory,
      prompt: ci?.prompt ?? c.prompt, // prompt 는 텍스트성이라 fallback
    };
  });

  // 페이지 일러스트 (텍스트/scene_description 등은 그대로, 이미지만 교체)
  sb.pages = (sb.pages ?? []).map((p) => {
    const pa = assets?.pageIllustrations?.[p.pageNumber];
    return {
      ...p,
      illustrationUrl: pa?.illustrationUrl,
      illustrationHistory: pa?.illustrationHistory,
      customModifications: pa?.customModifications ?? p.customModifications,
    };
  });

  // 핵심사물 / 어휘 이미지
  sb.keyObjectImages = assets?.keyObjectImages;
  sb.vocabularyImages = assets?.vocabularyImages;
}

/**
 * Mutates draft — 그림체 전환:
 *   1. 현재 top-level per-style 자산을 styleAssets[oldStyle] 에 스냅샷
 *   2. artStyle = newStyle
 *   3. styleAssets[newStyle] 의 자산을 top-level 에 머지 (없으면 비움)
 *
 * "추가" 동작은 newStyle 이 styleAssets 에 아직 없는 경우 — 자동으로 빈 자산으로 시작됨.
 * "삭제" 는 helper 의 책임 아님 (caller 가 storybook.availableStyles 에서 빼면 됨).
 */
export function switchStyleAssets(draft: Storybook, newStyle: string): void {
  const oldStyle = draft.artStyle;
  if (oldStyle === newStyle) return;

  if (!draft.styleAssets) draft.styleAssets = {};
  // 1. snapshot old
  draft.styleAssets[oldStyle] = snapshotCurrentStyleAssets(draft);

  // 2. switch field
  draft.artStyle = newStyle;

  // 3. apply new (or clear if missing)
  applyStyleAssets(draft, draft.styleAssets[newStyle]);
}
