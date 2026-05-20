import type { Lang, VocabEntry, VocabularyUnit, VocabularyUnitWord } from '@tangobook/shared';

/**
 * vocabulary-db 의 VocabEntry[] 를 가상 VocabularyUnit 으로 변환.
 * 블록 게임 등 단원 단위 헬퍼 (`unitToKoreanBlockData` / `unitToEnglishBlockData`) 재사용 위함.
 *
 * 이미지 우선순위 (단어 학습 톤 일관):
 *   1. `source.imageUrl` — 단어 자체 일러스트 (keyObject 의 word-level 이미지)
 *   2. `source.pageImages[0].illustrationUrl` — 페이지 장면 폴백 (단어 일러 없을 때)
 * 둘 다 없으면 image 없는 단어로 (블록 게임 헬퍼가 imageUrl 없는 단어도 표시 가능).
 */
export function vocabEntriesToVirtualUnit(
  entries: VocabEntry[],
  language: Lang = 'ko'
): VocabularyUnit {
  const words: VocabularyUnitWord[] = entries.map((e) => {
    const imageUrl =
      e.sources?.find((s) => s.imageUrl)?.imageUrl ??
      e.sources?.find((s) => s.pageImages?.[0]?.illustrationUrl)?.pageImages?.[0]?.illustrationUrl;
    return {
      word: e.word,
      korean: e.korean,
      ...(imageUrl
        ? {
            images: [
              {
                id: `random-img-${e.word}`,
                imageUrl,
                isPrimary: true,
                createdAt: e.updatedAt,
              },
            ],
          }
        : {}),
    };
  });
  const now = new Date().toISOString();
  return {
    id: '__random_pool__',
    source: 'custom',
    nameKo: '전체 어휘',
    nameEn: 'All vocabulary',
    words,
    language,
    createdAt: now,
    updatedAt: now,
  };
}
