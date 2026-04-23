import type { Lang, Storybook } from '@tangobook/shared';

export interface PageWord {
  word: string;
  korean?: string;
}

/**
 * 주어진 페이지 번호(1-based)에 등장하는 key_objects를 word_exposed 용도로 추출.
 * 영어 모드는 nameEn > name, 한글 모드는 korean > name 우선.
 */
export function extractPageWords(storybook: Storybook, pageNumber: number, lang: Lang): PageWord[] {
  const objects = storybook.key_objects ?? [];
  const result: PageWord[] = [];
  const seen = new Set<string>();

  for (const ko of objects) {
    if (!ko.pages?.includes(pageNumber)) continue;
    const en = ko.nameEn ?? ko.name;
    const kr = ko.korean;
    const word = lang === 'en' ? en : (kr ?? en);
    if (!word || seen.has(word)) continue;
    seen.add(word);
    result.push({ word, korean: kr });
  }

  return result;
}
