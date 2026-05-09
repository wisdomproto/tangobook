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
  CurriculumMeta,
} from './storybook.js';

// CurriculumMeta 는 v2 에서 storybook.ts 로 옮겨졌음 (v1 단일화).
// 하위 호환을 위해 여기서도 re-export.
export type { CurriculumMeta };

// ────────────────────────────────────────────────────────────────────────────
// Book manifest (책 단위 메타)
// ────────────────────────────────────────────────────────────────────────────

/** 책 단위에서 사용 중인 variation 화이트리스트. 신규 책은 `{ levels: [], languages: ['ko'], styles: [] }`. */
export interface UsedVariants {
  levels: ReadingLevel[];
  languages: string[]; // 'ko', 'en', 'ja', ...
  styles: string[]; // ART_STYLES.id 값
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
// Marketing v2 (language 의존, 블로그·카드뉴스)
// ────────────────────────────────────────────────────────────────────────────

export interface BlogSectionV2 {
  id: string;
  header: string;
  text: string;
  imageUrl?: string;
  imageCaption?: string;
}

/** R2: books/{bid}/marketing/blog/{postId}.json */
export interface BlogPostV2 {
  id: string;
  language: string;
  title: string;
  summary: string;
  tags: string[];
  sections: BlogSectionV2[];
  seoScore?: number;
  createdAt: string;
  updatedAt: string;
}

export type CardNewsSlideTypeV2 = 'cover' | 'body' | 'outro';

export interface CardNewsSlideV2 {
  id: string;
  slideType: CardNewsSlideTypeV2;
  headline: string;
  subtext: string;
  imageUrl?: string;
  backgroundColor: string;
  textColor: string;
}

/** R2: books/{bid}/marketing/card-news/{projectId}.json */
export interface CardNewsProjectV2 {
  id: string;
  language: string;
  title: string;
  colorTheme: string;
  slides: CardNewsSlideV2[];
  createdAt: string;
  updatedAt: string;
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
  /** 라이브러리 카드 표지 URL — 첫 style의 cover.webp */
  coverImageUrl?: string;
  /**
   * 그림체별 대표 표지 URL 맵 — 라이브러리 카드 배너 (default 외 다른 그림체 썸네일) 노출용.
   * 키 = artStyle prompt/id, 값 = imageUrl. v1 어댑터에서 storybook.styleAssets 에서 추출한 값 전달.
   */
  coversByStyle?: Record<string, string>;
  /** phonics 책 분리용 (라이브러리 탭). bid 패턴(kr-h..., en-b...)으로 derive */
  phonicsLanguage?: 'korean' | 'english';
  /** 커리큘럼 마스터 페이지에서 정렬·표시용 (no/originalTitle/author/source/priority/launchLevel) */
  curriculumMeta?: CurriculumMeta;
  updatedAt: string;
}

/** R2: _index/books.json */
export interface BookIndex {
  books: BookIndexEntry[];
  generatedAt: string;
}
