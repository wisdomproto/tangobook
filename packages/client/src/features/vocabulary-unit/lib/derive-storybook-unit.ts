import type {
  Storybook,
  StorybookSummary,
  VocabularyUnit,
  VocabularyUnitSummary,
  VocabularyUnitWord,
  VocabularyWordImage,
  KeyObject,
} from '@tangobook/shared';
import { stripStyleSuffix } from '@tangobook/shared';

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
 * - 한 단어 = 이미지 하나 (책의 keyObjectImages)
 *
 * @param preferredStyle 학습자가 고른 그림체 — isPrimary(게임/미리보기/모달이 집는 이미지)를
 *   이 그림체로 지정. 미지정/미보유 시 책 활성 그림체(book.artStyle) 폴백.
 *   책 상세에서 그림체 선택 → 단어 게임 이미지가 그 그림체로 나오게 하는 핵심 (2026-07-08).
 */
export function deriveStorybookUnit(book: Storybook, _preferredStyle?: string): VocabularyUnit {
  // 한 책 = 한 그림체(2026-09-14) — 낱말 이미지는 책의 keyObjectImages 하나.
  const keyObjects: KeyObject[] = book.key_objects ?? [];

  const words: VocabularyUnitWord[] = keyObjects.map((ko) => {
    const images: VocabularyWordImage[] = [];
    const topImg = (book.keyObjectImages ?? []).find((im) => im.objectName === ko.name);
    if (topImg?.imageUrl) {
      images.push({
        id: `${ko.name}-${book.artStyle ?? 'top'}`,
        imageUrl: topImg.imageUrl,
        isPrimary: true,
        createdAt: book.createdAt ?? new Date().toISOString(),
        // KeyObjectImage.keypoints → VocabularyWordImage.keypoints (점잇기 게임 활성화)
        ...(topImg.keypoints && topImg.keypoints.length > 0 ? { keypoints: topImg.keypoints } : {}),
      });
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
    nameKo: stripStyleSuffix(book.title),
    nameEn: undefined,
    description: book.parentGuide?.overview ?? `${stripStyleSuffix(book.title)}의 핵심 단어들`,
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
    nameKo: stripStyleSuffix(book.title),
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
