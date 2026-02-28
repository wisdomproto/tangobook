import type { Storybook } from '@tangobook/shared';

/** 한글/영어 감지 — phonicsConfig.language 기준 */
export function isKoreanPhonics(storybook: Storybook): boolean {
  return storybook.phonicsConfig?.language === 'korean';
}

export interface ImagePoolItem {
  word: string;
  korean: string;
  imageUrl: string;
  ttsUrl?: string;
}

/** vocabImages + keyObjectImages + flashcards 이미지 풀 수집 (동화책 게임용) */
export function collectStorybookImagePool(
  storybook: Storybook,
  opts: {
    includeCharacters?: boolean;
    includeKeyObjects?: boolean;
    includeFlashcards?: boolean;
  } = {}
): ImagePoolItem[] {
  const pool: ImagePoolItem[] = [];

  const vocabImages = storybook.vocabularyImages ?? [];
  for (const vi of vocabImages) {
    if (!vi.success || !vi.imageUrl) continue;
    if (!opts.includeCharacters && vi.isCharacter) continue;
    pool.push({ word: vi.word, korean: vi.korean, imageUrl: vi.imageUrl });
  }

  if (opts.includeKeyObjects) {
    const koImages = storybook.keyObjectImages ?? [];
    const koObjects = storybook.key_objects ?? [];
    for (const ki of koImages) {
      if (!ki.success || !ki.imageUrl) continue;
      const obj = koObjects.find((o) => o.name === ki.objectName);
      pool.push({
        word: ki.objectName,
        korean: obj?.korean ?? ki.objectName,
        imageUrl: ki.imageUrl,
      });
    }
  }

  if (opts.includeFlashcards) {
    const flashcards = storybook.flashcards ?? [];
    for (const fc of flashcards) {
      if (!fc.imageUrl) continue;
      pool.push({
        word: fc.word,
        korean: fc.localWord,
        imageUrl: fc.imageUrl,
        ttsUrl: fc.ttsUrl,
      });
    }
  }

  return pool;
}

export interface PhonicsWordItem {
  word: string;
  imageUrl: string;
  ttsUrl: string;
}

/** 블렌딩 + 워드패밀리 + 플래시카드에서 이미지+TTS 있는 단어 수집 (파닉스 게임용) */
export function collectPhonicsWordPool(storybook: Storybook): PhonicsWordItem[] {
  const blending = storybook.phonicsLesson?.blending ?? [];
  const wordFamilies = storybook.phonicsLesson?.wordFamilies ?? [];
  const flashcards = storybook.flashcards ?? [];
  const isKorean = isKoreanPhonics(storybook);

  const pool: PhonicsWordItem[] = [];
  const seen = new Set<string>();

  const add = (word: string, imageUrl: string | undefined, ttsUrl: string | undefined) => {
    if (!word || !imageUrl || !ttsUrl || seen.has(word)) return;
    seen.add(word);
    pool.push({ word, imageUrl, ttsUrl });
  };

  for (let i = 0; i < blending.length; i++) {
    const ex = blending[i];
    // Level 1 삽화 fallback
    add(
      isKorean ? ex.exampleWord || ex.blend : ex.exampleWord,
      ex.illustrationUrl || ex.exampleWordImageUrl,
      ex.exampleWordTtsUrl || ex.blendTtsUrl
    );
    add(ex.exampleWord, ex.exampleWordImageUrl, ex.exampleWordTtsUrl);
    if (ex.exampleWord2) {
      add(ex.exampleWord2, ex.exampleWord2ImageUrl, ex.exampleWord2TtsUrl);
    }
    const wf = wordFamilies[i];
    if (wf) {
      for (const w of wf.words) {
        add(w.word, w.imageUrl, w.ttsUrl);
      }
    }
  }

  for (const fc of flashcards) {
    const word = isKorean ? fc.localWord || fc.word : fc.word;
    add(word, fc.imageUrl, fc.ttsUrl);
  }

  return pool;
}
