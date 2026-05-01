import type { Lang } from './learning-events.js';

export type VocabularyUnitSource = 'cambridge-starters' | 'custom';

/** 단원 안의 개별 단어 — 자동 매핑(vocabulary-db) + 손수 보강 필드 */
export interface VocabularyUnitWord {
  word: string; // normalized lowercase (영어) / 한국어 (한 단어)
  korean?: string; // ko 의미
  /** 손수 작성 이미지 — 비어있으면 vocabulary-db.json 에서 자동 매핑 (server-side enrich) */
  imageUrl?: string;
  /** 손수 작성 TTS — 비어있으면 vocabulary-db 의 phonics ttsUrl fallback */
  ttsUrl?: string;
  /** 손수 작성 예문 — 비어있으면 동화 자동 추출 sentences fallback */
  exampleSentences?: string[];
  /** 난이도 (1-5) */
  difficulty?: number;
}

export interface VocabularyUnit {
  id: string; // 'unit-cambridge-animals' / 'unit-custom-{ts}'
  source: VocabularyUnitSource;
  /** Cambridge 토픽 id 등 외부 식별자 */
  topicId?: string;
  nameKo: string;
  nameEn?: string;
  emoji?: string;
  description?: string;
  words: VocabularyUnitWord[];
  language: Lang;
  /** Cambridge 의 Pre-A1 = 1, A1 = 2 등 (확장용) */
  level?: number;
  isPublic?: boolean;
  /** Storybook variant 처럼 폴더로 grouping */
  folder?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VocabularyUnitCatalog {
  version: 1;
  updatedAt: string;
  units: VocabularyUnit[];
}

export interface VocabularyUnitSummary {
  id: string;
  source: VocabularyUnitSource;
  nameKo: string;
  nameEn?: string;
  emoji?: string;
  language: Lang;
  wordCount: number;
  isPublic?: boolean;
  folder?: string;
  updatedAt: string;
}
