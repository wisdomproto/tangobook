import type { VocabEntry } from '@tangobook/shared';

/**
 * 한 단어의 모든 이미지를 우선순위 정렬로 반환 (dedupe).
 * 우선순위: storybook pageImages > storybook key-object > storybook vocabulary > phonics
 */
export function getAllImagesForWord(entry: VocabEntry): string[] {
  const ordered: string[] = [];

  for (const src of entry.sources) {
    if (!src.sourceType.startsWith('storybook')) continue;
    for (const pi of src.pageImages ?? []) {
      if (pi.illustrationUrl) ordered.push(pi.illustrationUrl);
    }
  }

  for (const src of entry.sources) {
    if (src.sourceType === 'storybook-key-object' && src.imageUrl) ordered.push(src.imageUrl);
  }

  for (const src of entry.sources) {
    if (src.sourceType === 'storybook-vocabulary' && src.imageUrl) ordered.push(src.imageUrl);
  }

  for (const src of entry.sources) {
    if (src.sourceType.startsWith('phonics') && src.imageUrl) ordered.push(src.imageUrl);
  }

  return Array.from(new Set(ordered));
}

/** 마스터리 review 횟수에 따라 회전 이미지 선택 */
export function pickImageForReview(entry: VocabEntry, reviewCount: number): string | undefined {
  const list = getAllImagesForWord(entry);
  if (list.length === 0) return undefined;
  return list[reviewCount % list.length];
}

/** 동화에서 자동 추출된 예문 (최대 N개, 다양한 책에서 균등 추출) */
export function getStorybookSentences(entry: VocabEntry, max = 3): string[] {
  const result: string[] = [];
  for (const src of entry.sources) {
    if (!src.sourceType.startsWith('storybook')) continue;
    for (const s of src.sentences ?? []) {
      if (!result.includes(s)) {
        result.push(s);
        if (result.length >= max) return result;
      }
    }
  }
  return result;
}

/** 단어의 첫 ttsUrl (있으면) — phonics 우선 */
export function getTtsForWord(entry: VocabEntry): string | undefined {
  const phonicsTts = entry.sources.find(
    (s) => s.sourceType.startsWith('phonics') && s.ttsUrl
  )?.ttsUrl;
  if (phonicsTts) return phonicsTts;
  return entry.sources.find((s) => s.ttsUrl)?.ttsUrl;
}
