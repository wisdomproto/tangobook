import type { SrPoolItem, Lang, WordCategoryId, SrPoolItemWithCategory } from '@tangobook/shared';
import { VocabularyCacheService } from './vocabulary-cache.service.js';
import {
  getAllImagesForWord,
  pickImageForReview,
  getStorybookSentences,
  getTtsForWord,
} from '../utils/vocab-cross-link.js';
import { categorizeWord, poolByCategories } from '../utils/word-categorize.js';

interface MasteryRecordInput {
  word: string;
  language: Lang;
  mastery: number;
  status: SrPoolItem['status'];
  exposed: number;
  correct: number;
  wrong: number;
}

export const PlaygroundService = {
  /**
   * Supabase RPC `get_sr_word_pool` 결과를 받아 vocabulary-db 메타로 enrich.
   * - 클라이언트가 RPC 호출 후 word 리스트만 보내면 imageList/sentences/회전 이미지 첨부.
   */
  async enrichWordPool(records: MasteryRecordInput[]): Promise<SrPoolItem[]> {
    const entryMap = await VocabularyCacheService.getEntryMap();
    const out: SrPoolItem[] = [];

    for (const m of records) {
      const entry = entryMap.get(m.word);
      if (!entry) {
        // vocabulary-db 에 없는 단어 — 최소 정보만 반환
        out.push({
          word: m.word,
          language: m.language,
          korean: '',
          mastery: m.mastery,
          status: m.status,
          exposed: m.exposed,
          correct: m.correct,
          wrong: m.wrong,
          imageList: [],
          sentences: [],
        });
        continue;
      }

      const imageList = getAllImagesForWord(entry);
      out.push({
        word: m.word,
        language: m.language,
        korean: entry.korean,
        definition: entry.definition,
        mastery: m.mastery,
        status: m.status,
        exposed: m.exposed,
        correct: m.correct,
        wrong: m.wrong,
        imageUrl: pickImageForReview(entry, m.correct + m.wrong),
        imageList,
        sentences: getStorybookSentences(entry, 3),
        ttsUrl: getTtsForWord(entry),
      });
    }

    return out;
  },

  /**
   * 마스터리 record 가 부족할 때 사용 — vocabulary-db 에서 직접 단어 풀 추출.
   * (예: 신규 사용자, learning_events 가 없는 경우)
   */
  /** word-sort-cart 용 — 두 카테고리 단어 풀 */
  async samplePoolByCategories(
    language: Lang,
    cat1: WordCategoryId,
    cat2: WordCategoryId,
    countPerCat: number
  ): Promise<{ cat1Items: SrPoolItemWithCategory[]; cat2Items: SrPoolItemWithCategory[] }> {
    const db = await VocabularyCacheService.get();
    const { cat1Words, cat2Words } = poolByCategories(db.entries, cat1, cat2);

    // language 필터 + 이미지 보유 우선
    const filterLang = (e: (typeof db.entries)[number]) => {
      const isAlpha = /^[a-z]/i.test(e.word);
      if (language === 'en') return isAlpha;
      return !isAlpha || !!e.korean;
    };

    const toItem = (
      entry: (typeof db.entries)[number],
      cat: WordCategoryId
    ): SrPoolItemWithCategory => {
      const imageList = getAllImagesForWord(entry);
      return {
        word: entry.word,
        language,
        korean: entry.korean,
        definition: entry.definition,
        mastery: 0,
        status: 'unknown',
        exposed: 0,
        correct: 0,
        wrong: 0,
        imageUrl: imageList[0],
        imageList,
        sentences: getStorybookSentences(entry, 1),
        ttsUrl: getTtsForWord(entry),
        categories: categorizeWord(entry),
        // categories 배열로 cat 검증된 단어들. 게임은 의도된 cat 만 사용
        ...({} as { _cat: WordCategoryId }),
      };
    };

    const cat1Filtered = cat1Words
      .filter(filterLang)
      .sort(() => Math.random() - 0.5)
      .slice(0, countPerCat);
    const cat2Filtered = cat2Words
      .filter(filterLang)
      .sort(() => Math.random() - 0.5)
      .slice(0, countPerCat);
    return {
      cat1Items: cat1Filtered.map((e) => toItem(e, cat1)),
      cat2Items: cat2Filtered.map((e) => toItem(e, cat2)),
    };
  },

  async sampleFromVocabulary(
    language: Lang,
    count: number,
    excludeWords: string[] = []
  ): Promise<SrPoolItem[]> {
    const db = await VocabularyCacheService.get();
    const exclude = new Set(excludeWords);

    // 1차 필터: exclude + language + 이미지 보유
    const candidates = db.entries.filter((e) => {
      if (exclude.has(e.word)) return false;
      const isAlpha = /^[a-z]/i.test(e.word);
      if (language === 'en' && !isAlpha) return false;
      if (language === 'ko' && isAlpha && !e.korean) return false;
      // 이미지 1장 이상
      return getAllImagesForWord(e).length > 0;
    });

    const shuffled = candidates.sort(() => Math.random() - 0.5).slice(0, count);

    return shuffled.map<SrPoolItem>((entry) => {
      const imageList = getAllImagesForWord(entry);
      return {
        word: entry.word,
        language,
        korean: entry.korean,
        definition: entry.definition,
        mastery: 0,
        status: 'unknown',
        exposed: 0,
        correct: 0,
        wrong: 0,
        imageUrl: imageList[0],
        imageList,
        sentences: getStorybookSentences(entry, 3),
        ttsUrl: getTtsForWord(entry),
      };
    });
  },
};
