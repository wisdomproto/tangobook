import type {
  Storybook,
  StorybookSummary,
  VocabularyUnit,
  VocabularyUnitSummary,
  VocabularyUnitWord,
  VocabularyWordImage,
  KeyObject,
  KeyObjectImage,
} from '@tangobook/shared';

/**
 * 어휘 단원 ID 가 storybook derived 임을 나타내는 prefix.
 * 예: 'book-1772510956605' → 잭과 콩나무 단원
 */
export const STORYBOOK_UNIT_PREFIX = 'book-';

export function isStorybookUnitId(id: string): boolean {
  return id.startsWith(STORYBOOK_UNIT_PREFIX);
}

export function storybookIdFromUnitId(unitId: string): string | null {
  if (!isStorybookUnitId(unitId)) return null;
  return unitId.slice(STORYBOOK_UNIT_PREFIX.length);
}

export function storybookUnitIdFromBookId(bookId: string): string {
  return `${STORYBOOK_UNIT_PREFIX}${bookId}`;
}

/**
 * Storybook → VocabularyUnit derive (전체).
 * VocabularyStudyPage 가 'book-{id}' 단원을 학습 모드로 렌더할 때 사용.
 *
 * - 한 단어 = N 이미지 (그림체별 누적, isPrimary = defaultStyle 또는 artStyle)
 * - 그림체 자산 부분 누락 시 graceful (가용 이미지만)
 * - styleAssets 가 없으면 top-level keyObjectImages 폴백
 *
 * @param preferredStyle 학습자가 고른 그림체 — isPrimary(게임/미리보기/모달이 집는 이미지)를
 *   이 그림체로 지정. 미지정/미보유 시 책 활성 그림체(book.artStyle) 폴백.
 *   책 상세에서 그림체 선택 → 단어 게임 이미지가 그 그림체로 나오게 하는 핵심 (2026-07-08).
 */
export function deriveStorybookUnit(book: Storybook, preferredStyle?: string): VocabularyUnit {
  const stylesToUse: string[] =
    book.availableStyles && book.availableStyles.length > 0
      ? book.availableStyles
      : book.styleAssets
        ? Object.keys(book.styleAssets)
        : [book.artStyle ?? 'paper-craft'];
  // isPrimary 기준 그림체 — 호출자 preferredStyle 우선(해당 그림체 자산 보유 시), 없으면 책 활성 그림체.
  const styleKey =
    preferredStyle && stylesToUse.includes(preferredStyle)
      ? preferredStyle
      : (book.artStyle ?? 'paper-craft');

  // 활성 그림체(artStyle)의 keyObj 이미지는 styleAssets 가 아니라 top-level book.keyObjectImages 에
  // 저장된 책이 있음(에디터가 활성 그림체를 top-level 에 두고 다른 그림체만 styleAssets 로 mirror).
  //   예) 백조왕자·빨간구두 — styleAssets[수채]=0 인데 top-level keyObjectImages 가 수채 이미지.
  // 이 경우 styleAssets 만 보면 수채를 못 찾아 콜라주 등으로 폴백됨 → 활성 그림체는 top-level 도 소스로 인정.
  const activeStyle = book.artStyle ?? 'paper-craft';

  const keyObjects: KeyObject[] = book.key_objects ?? [];

  const words: VocabularyUnitWord[] = keyObjects.map((ko) => {
    const images: VocabularyWordImage[] = [];
    for (const style of stylesToUse) {
      const sa = book.styleAssets?.[style];
      let styleImages: KeyObjectImage[] = sa?.keyObjectImages ?? [];
      // 활성 그림체인데 styleAssets 에 이미지가 없으면 top-level 을 그 그림체 소스로 사용
      if (styleImages.length === 0 && style === activeStyle) {
        styleImages = book.keyObjectImages ?? [];
      }
      const img = styleImages.find((im) => im.objectName === ko.name);
      if (img?.imageUrl) {
        images.push({
          id: `${ko.name}-${style}`,
          imageUrl: img.imageUrl,
          isPrimary: style === styleKey,
          createdAt: book.createdAt ?? new Date().toISOString(),
          // KeyObjectImage.keypoints → VocabularyWordImage.keypoints (점잇기 게임 활성화)
          ...(img.keypoints && img.keypoints.length > 0 ? { keypoints: img.keypoints } : {}),
        });
      }
    }
    // styleAssets 에 매칭 없으면 top-level keyObjectImages 폴백
    if (images.length === 0) {
      const topImages: KeyObjectImage[] = book.keyObjectImages ?? [];
      const topImg = topImages.find((im) => im.objectName === ko.name);
      if (topImg?.imageUrl) {
        images.push({
          id: `${ko.name}-top`,
          imageUrl: topImg.imageUrl,
          isPrimary: true,
          createdAt: book.createdAt ?? new Date().toISOString(),
          ...(topImg.keypoints && topImg.keypoints.length > 0
            ? { keypoints: topImg.keypoints }
            : {}),
        });
      }
    }

    return {
      // 학습 시 영어 단어 우선 (Cambridge 와 통일)
      word: ko.nameEn ?? ko.name,
      korean: ko.korean ?? ko.name,
      nameEn: ko.nameEn,
      nameTranslations: ko.nameTranslations,
      description: ko.description,
      images,
      ttsUrl: ko.ttsUrl,
      ttsUrls: ko.ttsUrls,
      definition: ko.definition,
      example: ko.example,
    };
  });

  return {
    id: storybookUnitIdFromBookId(book.id),
    source: 'storybook',
    storybookId: book.id,
    nameKo: book.title,
    nameEn: undefined,
    description: book.parentGuide?.overview ?? `${book.title}의 핵심 단어들`,
    words,
    language: 'ko',
    isPublic: book.isPublic,
    isReadOnly: true,
    folder: book.category,
    coverImage: book.coverImage,
    createdAt: book.createdAt ?? new Date().toISOString(),
    updatedAt: book.updatedAt ?? new Date().toISOString(),
  };
}

/**
 * StorybookSummary → VocabularyUnitSummary derive (lightweight, hub 목록용).
 * 책 list API 의 summary 만 사용 — 전체 storybook 페치 없이 cards 표시.
 */
export function deriveStorybookUnitSummary(book: StorybookSummary): VocabularyUnitSummary {
  return {
    id: storybookUnitIdFromBookId(book.id),
    source: 'storybook',
    storybookId: book.id,
    nameKo: book.title,
    language: 'ko',
    // wordCount 는 list summary 에 없으므로 0 으로 placeholder. study page 에서 실제 count 표시.
    wordCount: 0,
    isPublic: book.isPublic,
    isReadOnly: true,
    folder: book.category,
    coverImage: book.coverImage,
    updatedAt: book.createdAt,
  };
}
