import axios from 'axios';
import { uploadJsonToR2, r2PublicUrl } from '../providers/r2.provider.js';
import { R2Repository } from '../repositories/r2.repository.js';
import type {
  Storybook,
  VocabEntry,
  VocabSource,
  VocabSourceType,
  VocabularyDatabase,
  Page,
} from '@tangobook/shared';

const DB_KEY = 'vocabulary-db.json';

function normalizeWord(word: string): string {
  return word.toLowerCase().trim();
}

// ─── R2 read/write ───

async function getDatabase(): Promise<VocabularyDatabase> {
  try {
    const url = `${r2PublicUrl}/${DB_KEY}`;
    const res = await axios.get<VocabularyDatabase>(url, { timeout: 10000 });
    if (res.data && Array.isArray(res.data.entries)) return res.data;
    return { version: 1, updatedAt: new Date().toISOString(), entries: [] };
  } catch {
    return { version: 1, updatedAt: new Date().toISOString(), entries: [] };
  }
}

async function saveDatabase(db: VocabularyDatabase): Promise<void> {
  db.updatedAt = new Date().toISOString();
  await uploadJsonToR2(db, DB_KEY);
}

// ─── 문장 추출 ───

/** 페이지에서 사용 가능한 모든 텍스트 수집 (한국어 원문 + 영어 번역) */
function getAllTexts(page: Page): string[] {
  const texts: string[] = [];
  if (page.text) texts.push(page.text);
  if (page.translations) {
    for (const t of Object.values(page.translations)) {
      if (t.text) texts.push(t.text);
    }
  }
  return texts;
}

/** 텍스트에 단어(영어 또는 한국어)가 포함되어 있는지 검사 */
function textContainsWord(text: string, words: string[]): boolean {
  const lower = text.toLowerCase();
  return words.some((w) => {
    if (!w) return false;
    const wl = w.toLowerCase();
    // 영어 단어는 단어 경계 매칭, 한국어는 포함 여부
    const isAlpha = /^[a-z]/i.test(w);
    if (isAlpha) {
      const regex = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(text);
    }
    return lower.includes(wl);
  });
}

function findSentencesContainingWord(
  pages: Page[],
  words: string[],
  pageNumbers?: number[]
): string[] {
  const sentences: string[] = [];

  for (const page of pages) {
    if (pageNumbers && pageNumbers.length > 0 && !pageNumbers.includes(page.pageNumber)) continue;

    for (const text of getAllTexts(page)) {
      // 문장 분리: 마침표/느낌표/물음표 뒤 또는 줄바꿈
      const splits = text.split(/(?<=[.!?。])\s+|\n+/);
      for (const s of splits) {
        const trimmed = s.trim();
        if (!trimmed) continue;
        if (textContainsWord(trimmed, words)) {
          // 중복 방지
          if (!sentences.includes(trimmed)) {
            sentences.push(trimmed);
            if (sentences.length >= 3) return sentences;
          }
        }
      }
    }
  }
  return sentences;
}

function findPagesContainingWord(pages: Page[], words: string[]): number[] {
  return pages
    .filter((p) => getAllTexts(p).some((text) => textContainsWord(text, words)))
    .map((p) => p.pageNumber);
}

// ─── 단어 추출 ───

interface ExtractedWord {
  word: string;
  korean: string;
  definition?: string;
  phonemes?: string[];
  phonicPattern?: string;
  source: Omit<VocabSource, 'storybookId' | 'storybookTitle'>;
}

/**
 * 단어가 등장하는 페이지의 일러스트를 수집 — 어휘 게임 회전 이미지용.
 * 모든 그림체(styleAssets) + top-level pages[].illustrationUrl 모두 포함, dedupe.
 */
function collectPageImagesForWord(
  storybook: Storybook,
  pageNums: number[] | undefined
): { page: number; illustrationUrl: string; style?: string }[] {
  if (!pageNums || pageNums.length === 0) return [];
  const result: { page: number; illustrationUrl: string; style?: string }[] = [];
  const seen = new Set<string>();

  // 1. styleAssets 의 모든 그림체 순회 (그림체 variation 도 자동 확보)
  if (storybook.styleAssets) {
    for (const [style, assets] of Object.entries(storybook.styleAssets)) {
      if (!assets?.pageIllustrations) continue;
      for (const pageNum of pageNums) {
        const pi = assets.pageIllustrations[pageNum];
        if (!pi?.illustrationUrl) continue;
        const key = `${pageNum}-${pi.illustrationUrl}`;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push({ page: pageNum, illustrationUrl: pi.illustrationUrl, style });
      }
    }
  }

  // 2. top-level pages[].illustrationUrl (그림체 미명시 — 단일 그림체일 때 사용)
  const sbPages = storybook.pages ?? [];
  for (const pageNum of pageNums) {
    const page = sbPages.find((p) => p.pageNumber === pageNum);
    if (!page?.illustrationUrl) continue;
    const key = `${pageNum}-${page.illustrationUrl}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ page: pageNum, illustrationUrl: page.illustrationUrl });
  }

  return result;
}

function extractFromStorybook(storybook: Storybook): ExtractedWord[] {
  const results: ExtractedWord[] = [];
  const pages = storybook.pages ?? [];

  // educational_content.vocabulary
  for (const v of storybook.educational_content?.vocabulary ?? []) {
    if (!v.word) continue;
    // 영어 단어 + 한국어 번역 모두 검색
    const searchTerms = [v.word, v.korean].filter(Boolean);
    const pageNums = findPagesContainingWord(pages, searchTerms);
    const pageImages = collectPageImagesForWord(storybook, pageNums);
    results.push({
      word: v.word,
      korean: v.korean || '',
      definition: v.definition,
      source: {
        sourceType: 'storybook-vocabulary',
        pages: pageNums,
        sentences: findSentencesContainingWord(pages, searchTerms, pageNums),
        pageImages: pageImages.length > 0 ? pageImages : undefined,
      },
    });
  }

  // key_objects
  for (const ko of storybook.key_objects ?? []) {
    const name = ko.nameEn ?? ko.name;
    if (!name) continue;
    const koImage = storybook.keyObjectImages?.find((i) => i.objectName === ko.name);
    // 영어 이름 + 한국어 이름 모두 검색
    const searchTerms = [name, ko.korean, ko.name].filter((s): s is string => !!s);
    const pageNums = ko.pages?.length ? ko.pages : findPagesContainingWord(pages, searchTerms);
    const pageImages = collectPageImagesForWord(storybook, pageNums);
    results.push({
      word: name,
      korean: ko.korean ?? ko.name,
      source: {
        sourceType: 'storybook-key-object',
        pages: pageNums,
        sentences: findSentencesContainingWord(pages, searchTerms, ko.pages),
        imageUrl: koImage?.imageUrl,
        pageImages: pageImages.length > 0 ? pageImages : undefined,
      },
    });
  }

  return results;
}

function extractFromPhonics(storybook: Storybook): ExtractedWord[] {
  const results: ExtractedWord[] = [];
  const config = storybook.phonicsConfig;
  const unitId = config?.targetUnit;
  const level = config?.level;

  // flashcards
  for (const fc of storybook.flashcards ?? []) {
    if (!fc.word) continue;
    results.push({
      word: fc.word,
      korean: fc.localWord || '',
      phonemes: fc.phonemes,
      phonicPattern: fc.phonicPattern,
      source: {
        sourceType: 'phonics-flashcard',
        phonicPattern: fc.phonicPattern,
        phonicsUnit: unitId,
        phonicsLevel: level,
        imageUrl: fc.imageUrl,
        ttsUrl: fc.ttsUrl,
      },
    });
  }

  // blending exercises
  for (const b of storybook.phonicsLesson?.blending ?? []) {
    if (b.exampleWord) {
      results.push({
        word: b.exampleWord,
        korean: '',
        source: {
          sourceType: 'phonics-blending',
          phonicPattern: b.blend,
          phonicsUnit: unitId,
          phonicsLevel: level,
          imageUrl: b.exampleWordImageUrl,
          ttsUrl: b.exampleWordTtsUrl,
        },
      });
    }
    if (b.exampleWord2) {
      results.push({
        word: b.exampleWord2,
        korean: '',
        source: {
          sourceType: 'phonics-blending',
          phonicPattern: b.blend,
          phonicsUnit: unitId,
          phonicsLevel: level,
          imageUrl: b.exampleWord2ImageUrl,
          ttsUrl: b.exampleWord2TtsUrl,
        },
      });
    }
  }

  // word families
  for (const wf of storybook.phonicsLesson?.wordFamilies ?? []) {
    for (const w of wf.words) {
      if (!w.word) continue;
      results.push({
        word: w.word,
        korean: w.korean ?? '',
        source: {
          sourceType: 'phonics-word-family',
          phonicPattern: wf.pattern,
          phonicsUnit: unitId,
          phonicsLevel: level,
          imageUrl: w.imageUrl,
          ttsUrl: w.ttsUrl,
        },
      });
    }
  }

  return results;
}

// ─── 서비스 ───

export const VocabularyDbService = {
  async list(): Promise<VocabEntry[]> {
    const db = await getDatabase();
    return db.entries;
  },

  async search(params: {
    query?: string;
    storybookId?: string;
    sourceType?: VocabSourceType;
  }): Promise<VocabEntry[]> {
    const db = await getDatabase();
    let entries = db.entries;

    if (params.query) {
      const q = params.query.toLowerCase();
      entries = entries.filter(
        (e) =>
          e.word.includes(q) ||
          e.korean.includes(q) ||
          (e.definition ?? '').toLowerCase().includes(q)
      );
    }
    if (params.storybookId) {
      entries = entries.filter((e) => e.sources.some((s) => s.storybookId === params.storybookId));
    }
    if (params.sourceType) {
      entries = entries.filter((e) => e.sources.some((s) => s.sourceType === params.sourceType));
    }
    return entries;
  },

  async getByWord(word: string): Promise<VocabEntry | null> {
    const db = await getDatabase();
    const key = normalizeWord(word);
    return db.entries.find((e) => e.word === key) ?? null;
  },

  async getByStorybookId(storybookId: string): Promise<VocabEntry[]> {
    const db = await getDatabase();
    return db.entries.filter((e) => e.sources.some((s) => s.storybookId === storybookId));
  },

  async syncFromStorybook(storybook: Storybook): Promise<{ added: number; updated: number }> {
    const isPhonics = storybook.type === 'phonics';
    const extracted = isPhonics ? extractFromPhonics(storybook) : extractFromStorybook(storybook);

    if (extracted.length === 0) return { added: 0, updated: 0 };

    const db = await getDatabase();
    const entryMap = new Map(db.entries.map((e) => [e.word, e]));
    const now = new Date().toISOString();
    const sbId = storybook.id;
    const sbTitle = storybook.title;

    // 이번 동기화에서 추출된 word+sourceType 조합
    const extractedKeys = new Set(
      extracted.map((e) => `${normalizeWord(e.word)}|${e.source.sourceType}`)
    );

    let added = 0;
    let updated = 0;

    // 1. upsert 추출된 단어들
    for (const ext of extracted) {
      const key = normalizeWord(ext.word);
      const fullSource: VocabSource = {
        ...ext.source,
        storybookId: sbId,
        storybookTitle: sbTitle,
      };

      const existing = entryMap.get(key);
      if (existing) {
        // 같은 storybookId+sourceType의 source 교체
        const srcIdx = existing.sources.findIndex(
          (s) => s.storybookId === sbId && s.sourceType === ext.source.sourceType
        );
        if (srcIdx >= 0) {
          existing.sources[srcIdx] = fullSource;
        } else {
          existing.sources.push(fullSource);
        }
        // 빈 필드 보완
        if (!existing.korean && ext.korean) existing.korean = ext.korean;
        if (!existing.definition && ext.definition) existing.definition = ext.definition;
        if (!existing.phonemes?.length && ext.phonemes?.length) existing.phonemes = ext.phonemes;
        if (!existing.phonicPattern && ext.phonicPattern)
          existing.phonicPattern = ext.phonicPattern;
        existing.updatedAt = now;
        updated++;
      } else {
        const newEntry: VocabEntry = {
          word: key,
          korean: ext.korean,
          definition: ext.definition,
          phonemes: ext.phonemes,
          phonicPattern: ext.phonicPattern,
          sources: [fullSource],
          createdAt: now,
          updatedAt: now,
        };
        entryMap.set(key, newEntry);
        added++;
      }
    }

    // 2. 이 storybookId의 기존 source 중 새 추출 목록에 없는 것 제거
    for (const entry of entryMap.values()) {
      entry.sources = entry.sources.filter((s) => {
        if (s.storybookId !== sbId) return true;
        return extractedKeys.has(`${entry.word}|${s.sourceType}`);
      });
    }

    // 3. source 0개인 entry 삭제
    db.entries = Array.from(entryMap.values()).filter((e) => e.sources.length > 0);
    await saveDatabase(db);
    return { added, updated };
  },

  async removeSourcesByStorybookId(
    storybookId: string
  ): Promise<{ removed: number; orphansDeleted: number }> {
    const db = await getDatabase();
    let removed = 0;

    for (const entry of db.entries) {
      const before = entry.sources.length;
      entry.sources = entry.sources.filter((s) => s.storybookId !== storybookId);
      removed += before - entry.sources.length;
    }

    const before = db.entries.length;
    db.entries = db.entries.filter((e) => e.sources.length > 0);
    const orphansDeleted = before - db.entries.length;

    if (removed > 0 || orphansDeleted > 0) await saveDatabase(db);
    return { removed, orphansDeleted };
  },

  async bulkSyncAll(): Promise<{ total: number; added: number; updated: number }> {
    const allBooks = await R2Repository.listStorybooks();
    let totalAdded = 0;
    let totalUpdated = 0;

    for (const summary of allBooks) {
      const storybook = await R2Repository.getStorybook(summary.id);
      if (!storybook) continue;
      const { added, updated } = await this.syncFromStorybook(storybook);
      totalAdded += added;
      totalUpdated += updated;
    }

    return { total: allBooks.length, added: totalAdded, updated: totalUpdated };
  },

  async reset(): Promise<void> {
    await saveDatabase({ version: 1, updatedAt: new Date().toISOString(), entries: [] });
  },
};
