import type { Lang } from './learning-events.js';
import type { DotKeypoint } from './storybook.js';

export type VocabularyUnitSource = 'cambridge-starters' | 'custom' | 'storybook';

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
  id: string; // 'unit-cambridge-animals' / 'unit-custom-{ts}' / 'book-{storybookId}'
  source: VocabularyUnitSource;
  /** Cambridge 토픽 id 등 외부 식별자 */
  topicId?: string;
  /** source='storybook' 일 때 원본 책 id */
  storybookId?: string;
  nameKo: string;
  nameEn?: string;
  emoji?: string;
  description?: string;
  words: VocabularyUnitWord[];
  language: Lang;
  /** Cambridge 의 Pre-A1 = 1, A1 = 2 등 (확장용) */
  level?: number;
  isPublic?: boolean;
  /** source='storybook' = true (책 편집기에서만 수정) */
  isReadOnly?: boolean;
  /** Storybook variant 처럼 폴더로 grouping. source='storybook' 인 경우 책 카테고리 (명작/생활동화/...) */
  folder?: string;
  /** source='storybook' 인 경우 책 표지 이미지 — hub 카드에 노출 */
  coverImage?: string;
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
  /** source='storybook' 일 때 원본 책 id */
  storybookId?: string;
  nameKo: string;
  nameEn?: string;
  emoji?: string;
  language: Lang;
  wordCount: number;
  isPublic?: boolean;
  isReadOnly?: boolean;
  folder?: string;
  /** source='storybook' 인 경우 책 표지 이미지 */
  coverImage?: string;
  updatedAt: string;
}
