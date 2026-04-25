// === Book Variants V2 — Asset variation system ===
//
// 동화책의 (level × language × style) 3축 variation을 정식 데이터 모델로.
// R2 prefix 구조에 매핑: books/{bid}/{manifest|texts|audio|styles|games|audiobook|longform|marketing}.
//
// 스펙: docs/superpowers/specs/2026-04-25-book-variants-design.md

import type {
  ReadingLevel,
  ParentGuide,
  StorybookType,
  Character,
  GameTypeId,
  GameConfig,
  GameData,
  LongformScene,
} from './storybook.js';

// ────────────────────────────────────────────────────────────────────────────
// Book manifest (책 단위 메타)
// ────────────────────────────────────────────────────────────────────────────

/** 책 단위에서 사용 중인 variation 화이트리스트. 신규 책은 `{ levels: [], languages: ['ko'], styles: [] }`. */
export interface UsedVariants {
  levels: ReadingLevel[];
  languages: string[]; // 'ko', 'en', 'ja', ...
  styles: string[]; // ART_STYLES.id 값
}

/**
 * 커리큘럼 마스터 페이지용 부가 메타.
 * BookManifest에 optional로 박아두고, /curriculum-master 페이지에서 manifest list와 함께 표시.
 *
 * source/author/country/year/originalTitle은 책 정체성. priority/launchLevel은 제작 순서 가이드.
 */
export interface CurriculumMeta {
  no?: number; // 커리큘럼 표시 순서
  originalTitle?: string; // 원제 (예: 'Hänsel und Gretel')
  author?: string; // 저자 (예: '그림형제')
  country?: string; // 원전 국가
  year?: string; // 출간 연도
  source?: string; // 원전 카테고리 ('그림형제' / '안데르센' / '이솝' / '현대창작' 등)
  priority?: 1 | 2 | 3; // 제작 우선순위
  launchLevel?: ReadingLevel; // 런칭 레벨 (대부분 L3)
}

export interface BookImageModelMap {
  character?: string;
  cover?: string;
  keyObject?: string;
  illustration?: string;
  phonics?: string;
}

export interface BookAspectRatios {
  cover?: string;
  illustration?: string;
  phonics?: string;
}

/** R2: books/{bid}/manifest.json */
export interface BookManifest {
  id: string;
  /** 베이스 언어(보통 ko) 기준 제목. 언어별 제목은 BookTextSlice.title. */
  title: string;
  type: StorybookType;
  category?: string;
  folder?: string;
  isPublic?: boolean;
  parentGuide?: ParentGuide;
  /** 커리큘럼 마스터 페이지용 부가 메타 (원제/저자/우선순위 등). */
  curriculumMeta?: CurriculumMeta;
  usedVariants: UsedVariants;
  /** book-level 식별자 (그림체/언어 무관). 단어 텍스트는 텍스트 슬라이스, 이미지는 스타일 슬라이스에서. */
  keyObjectIds: string[];
  vocabIds: string[];
  bgmUrl?: string;
  imageModels?: BookImageModelMap;
  aspectRatios?: BookAspectRatios;
  createdAt: string;
  updatedAt: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Text slice ((level, language) 의존)
// ────────────────────────────────────────────────────────────────────────────

export interface BookPageText {
  pageNumber: number;
  text: string;
  /** styles/{style}/pages/{level}/{illustrationKey}.webp 와 매핑되는 페이지 식별자 */
  illustrationKey: string;
  sceneDescription?: string;
}

export interface BookKeyObjectText {
  word: string;
  korean?: string;
}

export interface BookVocabText {
  word: string;
  korean?: string;
  definition?: string;
}

/** R2: books/{bid}/texts/{level}.{lang}.json */
export interface BookTextSlice {
  level: ReadingLevel;
  language: string;
  title: string;
  intro?: string;
  pages: BookPageText[];
  keyObjectsText: Record<string, BookKeyObjectText>;
  vocabText: Record<string, BookVocabText>;
}

// ────────────────────────────────────────────────────────────────────────────
// Style slice (style 의존, 그림체 = 캐릭터+표지+페이지+핵심단어/어휘 이미지)
// ────────────────────────────────────────────────────────────────────────────

export interface BookCharacter extends Character {
  id: string;
}

/**
 * R2: books/{bid}/styles/{style}/characters.json + 이미지들.
 *
 * `pageImages[level][illustrationKey]`로 페이지 이미지 url 접근.
 * 표지는 글자 없음(스펙 §1 결정 b) — 클라이언트가 manifest.title을 텍스트 오버레이.
 */
export interface BookStyleSlice {
  style: string;
  characters: BookCharacter[];
  coverImageUrl: string;
  coverImageHistory: string[];
  pageImages: Partial<Record<ReadingLevel, Record<string, string>>>;
  keyObjectImages: Record<string, string>;
  vocabImages: Record<string, string>;
}

// ────────────────────────────────────────────────────────────────────────────
// Game instance ((level, language) 의존, 이미지는 런타임 style 매핑)
// ────────────────────────────────────────────────────────────────────────────

export type GameImageRef =
  | { kind: 'keyObj'; refId: string }
  | { kind: 'vocab'; refId: string }
  | { kind: 'page'; refId: string };

/** R2: books/{bid}/games/{id}.json */
export interface BookGameInstance {
  id: string;
  gameType: GameTypeId;
  config: GameConfig;
  data: GameData;
  level: ReadingLevel;
  language: string;
  /** 데이터 안에 박혀 있던 이미지 URL을 ref로 추출. 런타임에 활성 style의 실제 url로 머지. */
  imageRefs: GameImageRef[];
  createdAt: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Audiobook (편집 데이터 = (level, lang), 렌더 결과 = 3축)
// ────────────────────────────────────────────────────────────────────────────

export interface AudiobookVariantPair {
  level: ReadingLevel;
  language: string;
}

export interface AudiobookTransitions {
  type?: string;
  durationMs?: number;
  [key: string]: unknown;
}

export interface AudiobookSubtitleSettings {
  fontSize?: number;
  color?: string;
  position?: 'bottom' | 'top';
  [key: string]: unknown;
}

export interface AudiobookBgmSettings {
  url?: string;
  volume?: number;
  loop?: boolean;
  [key: string]: unknown;
}

/** R2: books/{bid}/audiobook/project.json — book-variants v2 (storybook.ts의 v1 AudiobookProject와 별개) */
export interface AudiobookProjectV2 {
  slideTransitions?: AudiobookTransitions;
  subtitleSettings?: AudiobookSubtitleSettings;
  bgmSettings?: AudiobookBgmSettings;
  /** 이 프로젝트 데이터로 렌더 가능한 (level, language) 쌍 */
  supportedVariants: AudiobookVariantPair[];
  renders: AudiobookRenderV2[];
}

/** R2: books/{bid}/audiobook/renders/{level}.{lang}.{style}.meta.json */
export interface AudiobookRenderV2 {
  level: ReadingLevel;
  language: string;
  style: string;
  videoUrl: string;
  thumbnailUrl?: string;
  youtubeVideoId?: string;
  channelId?: string;
  renderedAt: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Longform v2 ((level, language, style) 3축 데이터, master-variant tree)
// ────────────────────────────────────────────────────────────────────────────

/** R2: books/{bid}/longform/{projectId}.json */
export interface LongformProjectV2 {
  id: string;
  level: ReadingLevel;
  language: string;
  style: string;
  /** master-variant tree: 한 axis만 다른 자식은 master에서 derive */
  parentProjectId?: string;
  scenes: LongformScene[];
  videoUrl?: string;
  thumbnailUrl?: string;
  youtubeVideoId?: string;
  channelId?: string;
  createdAt: string;
  updatedAt: string;
  /** 기타 longform 필드(progress 등)는 마이그 시 보존 */
  [key: string]: unknown;
}

// ────────────────────────────────────────────────────────────────────────────
// Library index (라이브러리 리스트 캐시)
// ────────────────────────────────────────────────────────────────────────────

export interface BookIndexEntry {
  id: string;
  title: string;
  type: StorybookType;
  category?: string;
  folder?: string;
  isPublic?: boolean;
  usedVariants: UsedVariants;
  hasCover: boolean;
  updatedAt: string;
}

/** R2: _index/books.json */
export interface BookIndex {
  books: BookIndexEntry[];
  generatedAt: string;
}
