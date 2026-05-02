import type { Lang } from './learning-events.js';
import type { DotKeypoint } from './storybook.js';

export type VocabularyUnitSource = 'cambridge-starters' | 'custom';

/** 단어별 이미지 — KeyObject 의 imageHistory 를 정식 array 로 확장. 1단어 = N장 */
export interface VocabularyWordImage {
  id: string;
  imageUrl: string;
  prompt?: string;
  /** 대표 이미지 (학습 화면 default) */
  isPrimary?: boolean;
  /** 글자 따라쓰기 점편집 (KeyObject 와 동일 패턴) */
  keypoints?: DotKeypoint[];
  createdAt: string;
}

/** 단원 안의 개별 단어 — KeyObject 모듈 패턴 + 이미지 array */
export interface VocabularyUnitWord {
  word: string;
  korean?: string;
  nameEn?: string;
  nameTranslations?: Record<string, string>;
  /** 이미지 prompt 베이스 (KeyObject.description 동일) */
  description?: string;
  /** prompt override */
  customPrompt?: string;
  /** ★ 다중 이미지 — 1 단어 = N 장 (KeyObject 와의 핵심 차이) */
  images?: VocabularyWordImage[];
  /** ko 기본 TTS */
  ttsUrl?: string;
  /** 다국어 TTS (en/ja/zh 등) */
  ttsUrls?: Record<string, string>;
  /** 학습용 정의 (KeyObject 와 동일) */
  definition?: string;
  /** 손수 예문 (단일 — KeyObject 와 동일) */
  example?: string;
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
  /** Cambridge 토픽 id 등 외부 식별자 — 아이콘 매핑에 사용 */
  topicId?: string;
  nameKo: string;
  nameEn?: string;
  emoji?: string;
  language: Lang;
  wordCount: number;
  isPublic?: boolean;
  folder?: string;
  updatedAt: string;
}
