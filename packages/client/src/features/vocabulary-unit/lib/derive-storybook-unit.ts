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
 */
export function deriveStorybookUnit(book: Storybook): VocabularyUnit {
  const styleKey = book.artStyle ?? 'paper-craft';
  const stylesToUse: string[] =
    book.availableStyles && book.availableStyles.length > 0
      ? book.availableStyles
      : book.styleAssets
        ? Object.keys(book.styleAssets)
        : [styleKey];

  const keyObjects: KeyObject[] = book.key_objects ?? [];

  const words: VocabularyUnitWord[] = keyObjects.map((ko) => {
    const images: VocabularyWordImage[] = [];
    for (const style of stylesToUse) {
      const sa = book.styleAssets?.[style];
      const styleImages: KeyObjectImage[] = sa?.keyObjectImages ?? [];
      const img = styleImages.find((im) => im.objectName === ko.name);
      if (img?.imageUrl) {
        images.push({
          id: `${ko.name}-${style}`,
          imageUrl: img.imageUrl,
          isPrimary: style === styleKey,
          createdAt: book.createdAt ?? new Date().toISOString(),
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
