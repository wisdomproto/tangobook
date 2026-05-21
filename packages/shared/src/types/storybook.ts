// === StorybookType 구분 ===
export type StorybookType = 'storybook' | 'phonics';

// === 파닉스 음원 라이브러리 (글로벌) ===
export type PhonicsAudioCategory = 'mod_phonics' | 'mod_english' | 'mod_korean';

export interface PhonicsAudioItem {
  sound: string;
  url: string;
  category: PhonicsAudioCategory;
}

// === 시스템 사운드 라이브러리 (글로벌) ===
export type SystemSoundLanguage = 'korean' | 'english';
export type SystemSoundType = 'correct' | 'wrong';

export interface SystemSoundItem {
  name: string;
  url: string;
  language: SystemSoundLanguage;
  type: SystemSoundType;
}

// === PhonicsBook 전용 타입 ===

export type PhonicsBookType =
  | 'letter-sounds'
  | 'short-vowels'
  | 'long-vowels'
  | 'blends-digraphs'
  | 'vowel-teams-r-controlled';

export interface PhonicsConfig {
  language: 'korean' | 'english';
  level: string; // 'book1' ~ 'book5' (EN) / 'hangul1' ~ 'hangul4' (KR)
  targetUnit: string; // 유닛 제목
  targetPhonemes: string[]; // 타겟 음소
  targetWords: string[]; // 타겟 단어
  targetPatterns: string[]; // 타겟 패턴 (CVC, _at 등)
  bookType?: PhonicsBookType; // 권 유형 (영어 전용)
}

export interface ChantLine {
  text: string;
  highlightWords?: string[];
  timing?: number; // ms
}

export interface PhonicsChant {
  title: string;
  lyrics: ChantLine[];
  bpm?: number;
  tone?: 'cheerful' | 'calm' | 'hiphop' | 'lullaby';
  ttsUrl?: string;
  bgmUrl?: string;
  bgmPreset?: string;
}

export interface PhonicsFlashcard {
  id?: string;
  word: string;
  localWord: string;
  phonemes: string[];
  phonicPattern?: string;
  sentence: string;
  imageDescription?: string;
  imageUrl?: string;
  imageHistory?: string[];
  ttsUrl?: string;
  sentenceTtsUrl?: string;
  outlineUrl?: string;
  tracingPoints?: TracingPoint[];
}

export type WorksheetType = 'matching' | 'fill-blank' | 'tracing' | 'circle-sound';

export interface WorksheetItem {
  prompt: string;
  answer: string;
  options?: string[];
  imageUrl?: string;
}

export interface PhonicsWorksheet {
  id?: string;
  type: WorksheetType;
  title: string;
  instructions: string;
  items: WorksheetItem[];
  pdfUrl?: string;
}

export interface PhonicsQuizItem {
  id?: string;
  question: string;
  questionType: 'sound-match' | 'word-recognition' | 'rhyme' | 'phoneme-count';
  options: string[];
  correctAnswer: number;
  audioUrl?: string;
  targetPhoneme?: string;
  targetWord?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

// 음가 블렌딩 연습 (a + t = at → bat)
export interface BlendingExercise {
  vowel: string;
  vowelImageUrl?: string;
  vowelImageHistory?: string[];
  vowelTtsUrl?: string;
  consonant: string;
  consonantImageUrl?: string;
  consonantImageHistory?: string[];
  consonantTtsUrl?: string;
  blend: string;
  blendTtsUrl?: string;
  blendingSequenceTtsUrl?: string;
  exampleWord: string;
  exampleWordImageDescription?: string;
  exampleWordImageUrl?: string;
  exampleWordImageHistory?: string[];
  exampleWordTtsUrl?: string;
  exampleWordOnsetTtsUrl?: string;

  // 두 번째 예시단어 (Level 2-5)
  exampleWord2?: string;
  exampleWord2ImageDescription?: string;
  exampleWord2ImageUrl?: string;
  exampleWord2ImageHistory?: string[];
  exampleWord2TtsUrl?: string;
  exampleWord2OnsetTtsUrl?: string;

  // 윤곽선 따라그리기 이미지 (레거시)
  exampleWordOutlineUrl?: string;
  exampleWord2OutlineUrl?: string;

  // 점선 따라그리기 포인트
  exampleWordTracingPoints?: TracingPoint[];
  exampleWord2TracingPoints?: TracingPoint[];

  // Level 1 전체 장면 삽화 (글자별 1장)
  illustrationUrl?: string;
  illustrationHistory?: string[];
  illustrationDescription?: string;
}

// 점선 따라그리기 포인트 (정규화 좌표 0~1)
export interface TracingPoint {
  x: number;
  y: number;
}

// 삽화 내 단어 터치 영역 (정규화 좌표 0~1)
export interface WordHotspot {
  x: number; // 좌상단 x
  y: number; // 좌상단 y
  w: number; // 너비
  h: number; // 높이
}

// 단어 패밀리 내 단어
export interface WordFamilyWord {
  word: string;
  onset: string;
  korean?: string;
  imageUrl?: string;
  imageHistory?: string[];
  ttsUrl?: string;
  /**
   * (deprecated) legacy 단일 hotspot. 새 데이터는 `hotspots` 사용.
   * reader 는 `getWordHotspots(w)` 헬퍼로 통일 — `hotspots` 우선, 없으면 `hotspot` fallback.
   */
  hotspot?: WordHotspot;
  /** 한 단어에 여러 hotspot — 한 이미지에 같은 단어 인스턴스가 여러 개 있을 때 (예: 사과나무에 사과 5개) */
  hotspots?: WordHotspot[];
}

// 단어 패밀리 그룹
export interface WordFamily {
  pattern: string;
  words: WordFamilyWord[];
}

// 파닉스 학습 콘텐츠 (Learn + Learn More)
export interface PhonicsLesson {
  title: string;
  blending: BlendingExercise[];
  wordFamilies: WordFamily[];
  sightWords?: string[]; // Level 1 Read & Do용 사이트 워드
}

// === 학습 게임 시스템 ===

/** 게임 타입 ID — 새 게임 추가 시 여기에 1줄 추가 */
export type GameTypeId =
  | 'connect-the-dots'
  | 'korean-block'
  | 'english-block'
  | 'korean-word-writing'
  | 'english-word-writing'
  | 'korean-speaking'
  | 'english-speaking'
  | 'korean-line-matching'
  | 'english-line-matching'
  | 'korean-story-image'
  | 'english-story-image';

export type GameDifficulty = 'easy' | 'medium' | 'hard';

/** 게임 카테고리 — 공통/동화책전용/파닉스공통/영어파닉스전용/한글파닉스전용 */
export type GameCategory =
  | 'common'
  | 'storybook'
  | 'phonics'
  | 'english-phonics'
  | 'korean-phonics';

/** 게임 인스턴스 (Storybook.games[] 배열의 요소) */
export interface GameInstance {
  id: string;
  gameType: GameTypeId;
  title: string;
  difficulty: GameDifficulty;
  createdAt: string;
  config: GameConfig;
  data: GameData;
}

/** 게임별 설정 (discriminated union — type 필드로 구분) */
export type GameConfig =
  | WordWritingConfig
  | ConnectTheDotsConfig
  | KoreanBlockConfig
  | EnglishBlockConfig
  | KoreanSpeakingConfig
  | EnglishSpeakingConfig
  | KoreanLineMatchingConfig
  | EnglishLineMatchingConfig
  | KoreanStoryImageConfig
  | EnglishStoryImageConfig;

/** 게임별 데이터 (discriminated union) */
export type GameData =
  | WordWritingData
  | ConnectTheDotsData
  | KoreanBlockData
  | EnglishBlockData
  | KoreanSpeakingData
  | EnglishSpeakingData
  | KoreanLineMatchingData
  | EnglishLineMatchingData
  | KoreanStoryImageData
  | EnglishStoryImageData;

// --- 낱말 쓰기 ---
export interface WordWritingConfig {
  type: 'korean-word-writing' | 'english-word-writing';
  language: 'korean' | 'english';
  wordSource: 'vocabulary' | 'phonics' | 'custom';
  customWords?: string[];
  selectedWords?: string[]; // vocabulary/phonics 소스에서 선택된 단어 (영어 word 기준)
  showGuide: boolean;
  accuracyThreshold: number;
}
export interface WordWritingItem {
  word: string;
  displayWord: string;
  imageUrl?: string;
  referenceImageUrl: string;
  ttsUrl?: string;
}
export interface WordWritingData {
  type: 'korean-word-writing' | 'english-word-writing';
  items: WordWritingItem[];
}

// --- 점잇기 ---
export interface ConnectTheDotsConfig {
  type: 'connect-the-dots';
  sourcePages: number[];
  sourceObjects?: string[];
  sourceMode?: 'objects' | 'pages';
  pointCount: number;
  showNumbers: boolean;
  showFaintOutline: boolean;
}
export interface DotKeypoint {
  x: number;
  y: number;
  order: number;
}
export interface ConnectTheDotsItem {
  pageNumber: number;
  originalImageUrl: string;
  keypoints: DotKeypoint[];
  objectName?: string;
}
export interface ConnectTheDotsData {
  type: 'connect-the-dots';
  items: ConnectTheDotsItem[];
}

// --- 한글 블록 맞추기 ---
export interface KoreanBlockConfig {
  type: 'korean-block';
  itemCount: number;
  includeKeyObjects: boolean;
  includeCharacters: boolean;
}
export interface KoreanBlockSyllable {
  char: string;
  cho: string;
  jung: string;
  jong: string | null;
}
export interface KoreanBlockItem {
  word: string;
  imageUrl: string;
  ttsUrl?: string;
  syllables: KoreanBlockSyllable[];
}
export interface KoreanBlockData {
  type: 'korean-block';
  items: KoreanBlockItem[];
}

// --- 영어 블록 맞추기 ---
export interface EnglishBlockConfig {
  type: 'english-block';
  itemCount: number;
  includeKeyObjects: boolean;
  includeCharacters: boolean;
}
export interface EnglishBlockLetter {
  char: string;
  isVowel: boolean;
}
export interface EnglishBlockItem {
  word: string;
  korean: string;
  imageUrl: string;
  ttsUrl?: string;
  letters: EnglishBlockLetter[];
}
export interface EnglishBlockData {
  type: 'english-block';
  items: EnglishBlockItem[];
}

// --- 말하기 (ko/en 공통) ---
export type SpeakingDifficulty = 'easy' | 'medium' | 'hard';

export interface SpeakingDifficultyPreset {
  showWord: boolean;
  autoPlayTts: boolean;
  showPromptLine: boolean;
  repeatCycles: 1 | 2;
}

export interface SpeakingItem {
  word: string; // ko 게임: 한국어, en 게임: 영어
  displayWord: string; // 화면 표시용
  koreanMeaning?: string; // en 게임에서만 — 의미 보조
  imageUrl: string;
  ttsUrl: string;
}

export interface KoreanSpeakingConfig {
  type: 'korean-speaking';
}
export interface KoreanSpeakingData {
  type: 'korean-speaking';
  items: SpeakingItem[];
}

export interface EnglishSpeakingConfig {
  type: 'english-speaking';
}
export interface EnglishSpeakingData {
  type: 'english-speaking';
  items: SpeakingItem[];
}

// --- 선긋기 매칭 (단어-그림 연결) ---
export interface LineMatchingItem {
  word: string; // 우측 단어 (ko 게임: 한국어, en 게임: 영어)
  imageUrl: string; // 좌측 그림
  ttsUrl?: string; // 정답 시 읽어주기 (phonics-library concat로도 대체 가능)
  /** 메인 단어 아래 작은 글씨로 표시할 보조 라벨 (ko 게임 → 영어, en 게임 → 한글). 없으면 미표시. */
  subLabel?: string;
}

export interface KoreanLineMatchingConfig {
  type: 'korean-line-matching';
  itemCount: number; // 한 라운드에 짝지을 개수 (기본 4)
}
export interface KoreanLineMatchingData {
  type: 'korean-line-matching';
  items: LineMatchingItem[];
}

export interface EnglishLineMatchingConfig {
  type: 'english-line-matching';
  itemCount: number;
}
export interface EnglishLineMatchingData {
  type: 'english-line-matching';
  items: LineMatchingItem[];
}

// --- 스토리 듣고 이미지 맞추기 ---
export interface StoryImageRound {
  text: string; // 화면 하단 자막 (참고용, 정답 힌트 아님)
  ttsUrl: string; // 재생 나레이션
  correctImageUrl: string; // 정답 페이지 일러스트
  distractorImageUrls: string[]; // 2~3개 다른 페이지 일러스트
}

export interface KoreanStoryImageConfig {
  type: 'korean-story-image';
  roundCount: number; // 기본 5
  optionsPerRound: number; // 기본 3 (정답 1 + 오답 2)
}
export interface KoreanStoryImageData {
  type: 'korean-story-image';
  rounds: StoryImageRound[];
}

export interface EnglishStoryImageConfig {
  type: 'english-story-image';
  roundCount: number;
  optionsPerRound: number;
}
export interface EnglishStoryImageData {
  type: 'english-story-image';
  rounds: StoryImageRound[];
}

// === 기존 타입 ===

export interface Character {
  name: string;
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  age?: number;
  role: string;
  height: number;
  heightCm?: number;
  referenceImage?: string;
  imageHistory?: string[];
  customPrompt?: string;
  /** 그림체별 이미지 생성 prompt (styleAssets snapshot 에 사용). 레거시 R2 데이터 호환. */
  prompt?: string;
}

export interface SavedCharacter extends Character {
  id: string;
  createdAt: string;
}

export interface SavedArtStyle {
  id: string;
  createdAt: string;
  name: string;
  prompt: string;
  referenceImageUrl?: string;
}

export interface SceneStructure {
  characters: string;
  background: string;
  atmosphere: string;
  characters_en?: string;
  background_en?: string;
  atmosphere_en?: string;
}

export interface Page {
  pageNumber: number;
  text: string;
  scene_description: string;
  scene_description_en?: string;
  scene_structure: SceneStructure;
  key_objects?: string;
  illustrationUrl?: string;
  illustrationHistory?: string[];
  customModifications?: string;
  ttsUrl?: string;
  translations?: Record<string, PageTranslation>;
}

export interface PageTranslation {
  text: string;
  ttsUrl?: string;
}

/**
 * @deprecated 2026-04-30 — `KeyObject` 로 통합 마이그레이션됨.
 * 신규 책은 `key_objects[]` 에 `definition`/`example` 까지 모두 포함.
 * 기존 책 read 호환을 위해 타입은 유지 (educational_content.vocabulary 필드).
 * 신규 코드에서 직접 참조하지 말 것 — `KeyObject` 우선 사용.
 */
export interface VocabularyItem {
  word: string;
  korean: string;
  definition: string;
  example: string;
}

export interface VocabularyImage {
  word: string;
  korean: string;
  imageUrl: string;
  success: boolean;
  isCharacter: boolean;
  isKeyObject: boolean;
}

export interface QuizItem {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface EducationalContent {
  vocabulary: VocabularyItem[];
  quiz: QuizItem[];
  learning_objectives: string[];
  moral_lesson: string;
}

export interface KeyObject {
  name: string;
  korean?: string;
  nameEn?: string;
  /** ko/en 외 언어별 이름. 예: { ja: 'にんじん', zh: '胡萝卜' } */
  nameTranslations?: Record<string, string>;
  /**
   * 한국어 묘사 (일러스트 prompt 용 + 페이지 시각 정보).
   * 영어 학습용 정의는 `definition` 사용.
   */
  description: string;
  pages: number[];
  sizeCm?: number;
  sizeCategory?: 'small' | 'medium' | 'large';
  customPrompt?: string;
  /** 한글 이름 발음 TTS URL (default 언어용). 학습게임/뷰어에서 음성 재생용. */
  ttsUrl?: string;
  /** 다국어 이름 TTS URL. 키 = lang code (en/ja/...), 값 = 해당 언어 이름의 발음 음성 URL. */
  ttsUrls?: Record<string, string>;
  /**
   * 영어 학습용 정의 (CEFR 단어 카드용). 2026-04-30 educational_content.vocabulary 에서 통합 이전.
   * 예: 'Cow' → 'A large farm animal that gives milk.'
   */
  definition?: string;
  /** 영어 예문 (학습 카드용). 예: 'The cow eats grass in the field.' */
  example?: string;
}

export interface KeyObjectImage {
  objectName: string;
  imageUrl: string;
  success: boolean;
  keypoints?: DotKeypoint[];
}

export interface CoverImageItem {
  id: string;
  imageUrl: string;
  prompt?: string;
  characterRefs?: number[];
  history?: string[];
}

/**
 * 탱고북 자체 3단계 독서 레벨. ORT·F&P·Lexile 공식 체계를 한국 유아 교육용으로 압축.
 * - L1 (씨앗, 3~4세): ORT Stage 1, F&P A-B, 1문장/쪽, 총 ≤50단어, 반복 구문
 * - L2 (새싹, 4~6세): ORT Stage 2~5, F&P C-G, 1~4문장/쪽, 총 80~350단어 — 대부분의 책이 여기
 * - L3 (나무, 6~7세): ORT Stage 6+, F&P H-J, 3~5문장/쪽, 총 400~700단어 — 졸업판
 *
 * NOTE: 2026-04-30 4단계(L1-L4) → 3단계(L1-L3) 통합. 기존 L3 → L2, 기존 L4 → L3 매핑.
 * R2 storybook variant id `__L4` suffix 는 호환을 위해 그대로 유지 (readingLevel 필드만 update).
 */
export type ReadingLevel = 'L1' | 'L2' | 'L3';

/**
 * 커리큘럼 마스터 페이지용 부가 메타.
 * /curriculum-master 페이지에서 storybook list 와 함께 표시.
 *
 * source/author/country/year/originalTitle 은 책 정체성. priority/launchLevel 은 제작 순서 가이드.
 *
 * NOTE: 2026-04-25~27 v2 분리 시도 때 BookManifest 에 정의되었으나 v2 폐기 후
 * v1 Storybook 으로 일원화. 기존 v2 manifest 의 curriculumMeta 는
 * scripts/migrate-curriculum-meta-to-v1.mjs 로 v1 으로 마이그됨.
 */
export interface CurriculumMeta {
  no?: number; // 커리큘럼 표시 순서
  originalTitle?: string; // 원제 (예: 'Hänsel und Gretel')
  author?: string; // 저자 (예: '그림형제')
  country?: string; // 원전 국가
  year?: string; // 출간 연도
  source?: string; // 원전 카테고리 ('그림형제' / '안데르센' / '이솝' / '현대창작' 등)
  priority?: 1 | 2 | 3; // 제작 우선순위
  launchLevel?: ReadingLevel; // 런칭 레벨 (대부분 L2)
}

/**
 * 부모님께 전달할 책 가이드.
 * - overview: 원전·저자·배경 요약
 * - lessons: 아이에게 전달할 교훈 (보통 2개)
 * - readingTips: 읽어주는 법 / 목소리 연기 / 대화거리 (보통 3개)
 * 책 상세 페이지(BookDetailPage)에서 "부모님 가이드" 섹션으로 노출.
 */
export interface ParentGuide {
  overview: string;
  lessons: string[];
  readingTips: string[];
  /** 부모 향 자주 묻는 질문 — SEO 페이지 + JSON-LD FAQPage schema 용. 2026-05-18 추가. */
  faq?: { q: string; a: string }[];
}

/**
 * 그림체별 분리 보관 자산 (Storybook.styleAssets[style]).
 * 텍스트·TTS·게임 데이터 등 그림체 무관 항목은 Storybook 의 top-level 에 그대로 둠.
 * 그림체별로 다른 항목만 여기 보관 (전환 시 swap).
 */
export interface StyleAssets {
  // 표지 (전체 셋)
  coverImages?: CoverImageItem[];
  coverImage?: string;
  coverPrompt?: string;
  coverImageHistory?: string[];
  coverCharacterRefs?: number[];
  /**
   * 이 그림체에서의 (lang → 대표 표지 imageUrl) 매핑.
   * 같은 (그림체, 언어) 조합당 한 표지를 대표로 표시. swap 시 top-level `primaryCoverByLang` 와 교체.
   */
  primaryCoverByLang?: Record<string, string>;
  /** 캐릭터별 이미지 (Storybook.characters 인덱스 매칭). 텍스트 정보(name 등)는 그림체와 무관 */
  characterImages?: Array<
    | {
        referenceImage?: string;
        imageHistory?: string[];
        prompt?: string;
      }
    | undefined
  >;
  /** 페이지별 일러스트 (Storybook.pages.pageNumber 매칭) */
  pageIllustrations?: Record<
    number,
    {
      illustrationUrl?: string;
      illustrationHistory?: string[];
      customModifications?: string;
    }
  >;
  /** 핵심사물 이미지 (전체 셋, 그림체별로 다른 그림) */
  keyObjectImages?: KeyObjectImage[];
  /** 어휘 이미지 */
  vocabularyImages?: VocabularyImage[];
}

export interface Storybook {
  id: string;
  title: string;
  /**
   * 다국어 제목 — 표지/카드뉴스 등 책 단위 제목 표시용.
   * `title` 은 default(ko) 로 사용. 다른 언어는 `titleTranslations[lang]` 으로 fallback.
   */
  titleTranslations?: Record<string, string>;
  /**
   * 언어별 대표 표지 URL.
   * 키 = lang code (ko/en/ja/...), 값 = coverImages[i].imageUrl 중 하나.
   * `ko` 는 비어 있으면 `coverImage` (legacy 필드) 로 fallback.
   * 표지에 한국어 제목과 영어 제목이 따로 박힌 다른 그림이 있을 때 언어별 대표를 분리 보관.
   */
  primaryCoverByLang?: Record<string, string>;
  type?: StorybookType; // undefined = 'storybook' (하위호환)
  targetAge: '4-5' | '5-7' | '7-8';
  /** 실측 기반 4단계 레벨. 신규 생성 책에 우선 사용 (targetAge는 레거시 호환) */
  readingLevel?: ReadingLevel;
  /** 부모용 책 가이드 (특징·교훈·읽어주는 법). 라이브러리 상세 페이지에서 표시. */
  parentGuide?: ParentGuide;
  /**
   * 책이 지원하는 언어 코드 배열 (`SUPPORTED_LANGUAGES.code`).
   * 기본 한국어 — 없으면 ['ko'] 로 취급.
   * 페이지/표지/핵심단어/오디오북/롱폼/게임 등 텍스트·음성·영상 데이터가 언어별 inline으로 저장됨.
   * 이미지/그림체는 언어와 무관 (visual content 는 모든 언어가 공유).
   */
  languages?: string[];
  /** 기본 언어 — 위 languages 가 비어 있을 때의 fallback. 보통 'ko'. */
  defaultLanguage?: string;
  artStyle: string;
  /**
   * 대표 그림체 (도감/라이브러리 표지/검색 결과 등 외부 노출 시 사용).
   * `artStyle` 은 마지막 편집 그림체 (자동 갱신). `defaultStyle` 은 사용자가 명시적으로 지정.
   * 미설정 → `artStyle` fallback. 2026-05-03 추가.
   */
  defaultStyle?: string;
  /**
   * 책이 지원하는 그림체 prompt 배열 (`ART_STYLES.prompt` 또는 커스텀).
   * 비어 있으면 [artStyle] 로 취급. 사용자가 + 그림체 추가 로 늘릴 수 있음.
   */
  availableStyles?: string[];
  /**
   * 그림체별 자산 보관 (Phase 2 — 그림체 전환 시 표지/캐릭터/페이지 일러스트 등 swap).
   * Key = artStyle prompt. 값 = 해당 그림체용 자산 셋.
   * top-level 의 coverImage·characters[].referenceImage·pages[].illustrationUrl 등은
   * "현재 활성 그림체의 자산" 으로 쓰이고, 전환 시 styleAssets 와 swap.
   * 빈 그림체로 전환 시 top-level 자산은 비워짐 (재생성 필요).
   */
  styleAssets?: Record<string, StyleAssets>;
  category?: string;
  folder?: string;
  isPublic?: boolean;
  /**
   * 커리큘럼 마스터 페이지용 부가 메타 (원제·저자·우선순위 등).
   * 4-25~27 v2 시도 시 BookManifest 에 정의되었으나 v2 폐기 후 v1 으로 옮겨옴.
   */
  curriculumMeta?: CurriculumMeta;
  referenceContent?: string;
  createdAt: string;
  updatedAt?: string;

  // 이미지 비율 설정
  coverAspectRatio?: string;
  illustrationAspectRatio?: string;
  phonicsAspectRatio?: string;

  // 이미지 생성 모델 (타입별)
  imageModels?: {
    character?: string;
    cover?: string;
    keyObject?: string;
    illustration?: string;
    phonics?: string;
  };

  // 표지
  coverPrompt?: string;
  coverImage?: string;
  coverImageHistory?: string[];
  coverCharacterRefs?: number[];
  coverImages?: CoverImageItem[];
  coverTitleTemplates?: Array<{ id: string; imageUrl: string }>;

  // 캐릭터
  characters: Character[];

  // 페이지
  pages: Page[];

  // 교육 콘텐츠
  educational_content: EducationalContent;

  // 핵심 사물
  key_objects?: KeyObject[];
  keyObjectImages?: KeyObjectImage[];

  // 학습 단어 이미지
  vocabularyImages?: VocabularyImage[];
  vocabularyPrompt?: string;

  // 배경음악
  backgroundMusicUrl?: string;

  // 오디오북 프로젝트
  audiobookProjects?: AudiobookProject[];

  // 블로그 글
  blogPosts?: BlogPost[];

  // 카드뉴스 프로젝트
  cardNewsProjects?: CardNewsProject[];

  // 롱폼 영상 프로젝트
  longformProjects?: LongformProject[];

  // 학습 게임
  games?: GameInstance[];

  // 시스템 사운드 (정답/오답/클리어 효과음)
  systemSounds?: {
    correctUrl?: string;
    incorrectUrl?: string;
    clearUrl?: string; // 게임 클리어 fanfare
  };

  // === PhonicsBook 전용 필드 (type === 'phonics'일 때만 사용) ===
  phonicsConfig?: PhonicsConfig;
  phonicsLesson?: PhonicsLesson;
  chant?: PhonicsChant;
  flashcards?: PhonicsFlashcard[];
  worksheets?: PhonicsWorksheet[];
  phonicsQuiz?: PhonicsQuizItem[];
}

export interface AudiobookProject {
  id: string;
  name: string;
  format: 'youtube' | 'instagram-reel' | 'instagram-post' | 'custom';
  aspectRatio: string;
  language: string;
  layout: 'fullscreen' | 'split';
  startPage: number;
  endPage: number;
  includeCover: boolean;
  coverDuration: number;
  coverImageUrl?: string; // 선택된 표지 이미지 (미선택 시 storybook.coverImage 사용)
  showCoverTitle?: boolean; // 표지에 제목 표시 여부 (기본 true)
  includeTts: boolean;
  includeBgm: boolean;
  bgmUrl?: string;
  bgmVolume: number;
  includeSubtitles: boolean;
  subtitleColor: string;
  subtitleSize: 'sm' | 'md' | 'lg';
  subtitlePosition: 'top' | 'center' | 'bottom';
  subtitleBg: string;
  subtitleWordsPerGroup?: number; // 자막 단어 그룹 수 (기본 2)
  outputUrl?: string;
  createdAt?: string;
  enableParticles?: boolean;
  captionLanguages?: string[]; // YouTube 자막 업로드할 언어 목록
  generatedCaptions?: Record<string, GeneratedCaption>; // 생성된 SRT 캐시
  youtubeUpload?: YouTubeUploadResult;
}

export interface GeneratedCaption {
  srt: string;
  generatedAt: string;
}

// === 블로그 ===

export interface BlogGenerateConfig {
  storybookId: string;
  title?: string;
  topic?: string;
  keywords?: string[];
  model?: string;
}

export interface NaverKeywordResult {
  keyword: string;
  monthlyPcSearch: number;
  monthlyMobileSearch: number;
  totalSearch: number;
  competition: string;
}

/** @deprecated Use NaverKeywordResult instead */
export type NaverBlogSearchResult = NaverKeywordResult;

export interface BlogAutoConfig {
  title: string;
  topic: string;
  keywords: NaverKeywordResult[];
}

export interface BlogSection {
  id: string;
  header: string;
  text: string;
  imageUrl?: string;
  imageCaption?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  sections: BlogSection[];
  createdAt: string;
  config?: BlogGenerateConfig;
  seoScore?: number;
}

// === 카드뉴스 ===

export type CardNewsSlideType = 'cover' | 'body' | 'outro';

export interface CardNewsSlide {
  id: string;
  slideType: CardNewsSlideType;
  headline: string;
  subtext: string;
  imageUrl?: string;
  backgroundColor: string;
  textColor: string;
}

export interface CardNewsProject {
  id: string;
  title: string;
  colorTheme: string;
  slides: CardNewsSlide[];
  createdAt: string;
}

// === 글로벌 어휘 DB ===

export type VocabSourceType =
  | 'storybook-vocabulary'
  | 'storybook-key-object'
  | 'phonics-flashcard'
  | 'phonics-blending'
  | 'phonics-word-family';

export interface VocabSource {
  storybookId: string;
  storybookTitle: string;
  sourceType: VocabSourceType;
  pages?: number[];
  sentences?: string[];
  phonicPattern?: string;
  phonicsUnit?: string;
  phonicsLevel?: string;
  imageUrl?: string;
  ttsUrl?: string;
  /** 페이지별 삽화 — 어휘 회전용 다중 이미지 (Phase 2 sync 보강 후 자동 채움) */
  pageImages?: { page: number; illustrationUrl: string; style?: string }[];
}

export interface VocabEntry {
  word: string;
  korean: string;
  definition?: string;
  phonemes?: string[];
  phonicPattern?: string;
  sources: VocabSource[];
  createdAt: string;
  updatedAt: string;
}

export interface VocabularyDatabase {
  version: 1;
  updatedAt: string;
  entries: VocabEntry[];
}

export type StorybookSummary = Pick<
  Storybook,
  | 'id'
  | 'title'
  | 'type'
  | 'targetAge'
  | 'artStyle'
  | 'createdAt'
  | 'coverImage'
  | 'category'
  | 'folder'
  | 'isPublic'
> & {
  pageCount?: number;
  phonicsLanguage?: 'korean' | 'english';
  hasVideo?: boolean;
  /**
   * 그림체별 대표 표지 URL 맵 — `styleAssets` 의 각 그림체 자산에서 추출.
   * 라이브러리 카드 배너 (default 외 다른 그림체 썸네일) 노출에 사용.
   * 키 = artStyle prompt/id, 값 = imageUrl.
   */
  coversByStyle?: Record<string, string>;
  /**
   * defaultStyle 기준 언어별 대표 표지 URL 맵 (ko/en 등).
   * `/library-master` 의 언어 토글로 카드 표지 swap 에 사용.
   * 키에 해당 언어 표지가 없으면 그 언어 표지가 "없음" 으로 처리.
   */
  coversByLang?: Record<string, string>;
  /**
   * 한글 기본 콘텐츠 완성도 — 커리큘럼 마스터 페이지에서 ✅ 완성 여부 판단에 사용.
   * 모든 필드가 true 이면 `complete: true`. 부분 완성은 wip 으로 분류.
   */
  koCompletion?: {
    /** 표지 이미지 1장 이상 */
    cover: boolean;
    /** 모든 페이지에 일러스트 있음 */
    pagesImage: boolean;
    /** 모든 페이지에 한글 TTS 있음 */
    pagesTts: boolean;
    /** 핵심단어 (key_objects) 1개 이상 */
    vocabulary: boolean;
    /** 위 4개 모두 true */
    complete: boolean;
  };
};

// ===== Longform Video =====
export interface LongformProject {
  id: string;
  name: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  language: string;
  /** 이 영상이 어느 그림체로 만들어졌는지 (그룹핑 키). 미지정 시 legacy 그룹. */
  artStyle?: string;
  promptPresetId?: string;
  scenes: LongformScene[];
  bgmUrl?: string;
  bgmVolume: number;
  subtitleStyle: LongformSubtitleStyle;
  outputUrl?: string;
  shortformOutputUrl?: string;
  createdAt?: string;
  captionLanguages?: string[]; // YouTube 자막 업로드할 언어 목록
  generatedCaptions?: Record<string, GeneratedCaption>; // 생성된 SRT 캐시
  youtubeUpload?: YouTubeUploadResult;
  /** If set, this is a "version" (timeline edit) of the master project */
  parentProjectId?: string;
}

export interface YouTubeUploadMeta {
  title: string;
  description: string;
  privacy: 'public' | 'private' | 'unlisted' | 'scheduled';
  categoryId: string;
  tags: string[];
  language?: string;
  thumbnailUrl?: string;
  publishAt?: string; // ISO 8601 — scheduled publish time
}

export interface YouTubeUploadResult {
  videoId: string;
  videoUrl: string;
  uploadedAt: string;
  privacy: string;
  publishAt?: string; // scheduled publish time
  channelId?: string; // 업로드한 내부 채널 ID (자막 재업로드 시 동일 채널 사용)
  captionsUploaded?: string[]; // 업로드 완료된 자막 언어 목록
  captionsFailed?: { lang: string; error: string }[]; // 실패한 자막 언어 목록
}

export interface YouTubeChannel {
  id: string;
  name: string; // 사용자가 지정한 이름 (예: "메인 채널", "영어 채널")
  channelId?: string; // YouTube 채널 ID
  channelTitle?: string; // YouTube 채널 이름
  connectedAt: string;
}

export interface YouTubePreset {
  id: string;
  name: string;
  prompt: string; // AI 프롬프트 텍스트 (Gemini에 보낼 프롬프트)
  createdAt: string;
}

/** Gemini가 생성한 YouTube 메타데이터 */
export interface YouTubeGeneratedMeta {
  title: string;
  description: string;
  tags: string[];
  privacy: 'public' | 'private' | 'unlisted';
  categoryId: string;
  language: string;
}

export interface LongformScene {
  id: string;
  pageNumber: number;
  videoPrompt: string;
  clipUrl?: string;
  clipHistory?: string[];
  clipDuration: number;
  trimStart?: number;
  trimEnd?: number;
  sfxUrl?: string;
  sfxVolume: number;
  sfxOffset?: number;
  ttsUrl?: string;
  ttsVolume: number;
  ttsDuration?: number;
  ttsOffset?: number;
  subtitles: LongformSubtitleEntry[];
  order: number;
}

export interface LongformSubtitleEntry {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
}

export interface LongformSubtitleStyle {
  fontSize: number;
  position: 'top' | 'center' | 'bottom';
  textColor: string;
  outlineColor: string;
  bgColor: string;
}

export interface PromptPreset {
  id: string;
  name: string;
  systemPrompt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 라이브러리 마스터 설정 — `/library` 카테고리/책 노출 순서 + 책별 메인 표지 override.
 *
 * 저장 위치: R2 `_index/library-config.json`. `/library-master` 페이지에서 편집.
 * 없거나 일부 항목이 비어 있어도 라이브러리는 fallback 으로 정상 동작.
 */
export interface LibraryConfig {
  /** 카테고리 노출 순서 (한글 카테고리명 배열). 비어있으면 LibraryPage 의 default priority 사용. */
  categoryOrder?: string[];
  /**
   * 카테고리별 책 노출 우선순위 (storybook id 배열, 앞쪽이 먼저 노출).
   * 카테고리에 속한 책 중 list 에 없는 책은 createdAt desc 로 fallback append.
   */
  bookPriority?: Record<string, string[]>;
  /**
   * 존재 카테고리 set (빈 카테고리도 포함).
   * 있으면 /library-master 좌측 패널의 source of truth — 책 0권인 카테고리도 표시.
   * 없으면 책의 category 필드에서 derive (하위 호환).
   * 학습자 /library 는 책 0권인 카테고리 자동 hide (기존 로직 그대로).
   */
  categoryList?: string[];
  updatedAt?: string;
}
