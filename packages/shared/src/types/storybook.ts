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
  hotspot?: WordHotspot;
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
  | 'vocabulary-matching'
  | 'word-writing'
  | 'connect-the-dots'
  | 'word-quiz'
  | 'picture-sequence'
  | 'odd-one-out'
  | 'word-image-matching'
  | 'blending-listening'
  | 'letter-sound'
  | 'word-listening'
  | 'korean-block'
  | 'english-block'
  | 'storybook-quiz'
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
  | VocabularyMatchingConfig
  | WordWritingConfig
  | ConnectTheDotsConfig
  | WordQuizConfig
  | PictureSequenceConfig
  | OddOneOutConfig
  | WordImageMatchingConfig
  | BlendingListeningConfig
  | LetterSoundConfig
  | WordListeningConfig
  | KoreanBlockConfig
  | EnglishBlockConfig
  | StorybookQuizConfig
  | KoreanSpeakingConfig
  | EnglishSpeakingConfig
  | KoreanLineMatchingConfig
  | EnglishLineMatchingConfig
  | KoreanStoryImageConfig
  | EnglishStoryImageConfig;

/** 게임별 데이터 (discriminated union) */
export type GameData =
  | VocabularyMatchingData
  | WordWritingData
  | ConnectTheDotsData
  | WordQuizData
  | PictureSequenceData
  | OddOneOutData
  | WordImageMatchingData
  | BlendingListeningData
  | LetterSoundData
  | WordListeningData
  | KoreanBlockData
  | EnglishBlockData
  | StorybookQuizData
  | KoreanSpeakingData
  | EnglishSpeakingData
  | KoreanLineMatchingData
  | EnglishLineMatchingData
  | KoreanStoryImageData
  | EnglishStoryImageData;

// --- 단어 매칭 ---
export interface VocabularyMatchingConfig {
  type: 'vocabulary-matching';
  itemCount: number;
  includeKeyObjects: boolean;
  includeCharacters: boolean;
}
export interface VocabularyMatchingItem {
  word: string;
  korean: string;
  imageUrl: string;
  ttsUrl?: string;
}
export interface VocabularyMatchingData {
  type: 'vocabulary-matching';
  items: VocabularyMatchingItem[];
}

// --- 낱말 쓰기 ---
export interface WordWritingConfig {
  type: 'word-writing' | 'korean-word-writing' | 'english-word-writing';
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
  type: 'word-writing' | 'korean-word-writing' | 'english-word-writing';
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

// --- 단어 퀴즈 ---
export interface WordQuizConfig {
  type: 'word-quiz';
  questionCount: number;
  questionTypes: Array<'meaning' | 'spelling' | 'picture'>;
}
export interface WordQuizQuestion {
  question: string;
  imageUrl?: string;
  options: string[];
  correctAnswer: number;
  ttsUrl?: string;
}
export interface WordQuizData {
  type: 'word-quiz';
  questions: WordQuizQuestion[];
}

// --- 그림 순서 맞추기 ---
export interface PictureSequenceConfig {
  type: 'picture-sequence';
  imageCount: number;
}
export interface PictureSequenceImage {
  imageUrl: string;
  correctOrder: number;
  caption?: string;
}
export interface PictureSequenceData {
  type: 'picture-sequence';
  images: PictureSequenceImage[];
}

// --- 다른 것 찾기 ---
export interface OddOneOutConfig {
  type: 'odd-one-out';
  roundCount: number;
  optionsPerRound: number;
}
export interface OddOneOutOption {
  word: string;
  korean: string;
  imageUrl: string;
  isOddOneOut: boolean;
}
export interface OddOneOutRound {
  category: string;
  options: OddOneOutOption[];
  explanation: string;
}
export interface OddOneOutData {
  type: 'odd-one-out';
  rounds: OddOneOutRound[];
}

// --- 단어-그림 선긋기 (파닉스 전용) ---
export interface WordImageMatchingConfig {
  type: 'word-image-matching';
}
export interface WordImageMatchingGroupItem {
  word: string;
  imageUrl: string;
  ttsUrl?: string;
}
export interface WordImageMatchingGroup {
  blend: string;
  items: WordImageMatchingGroupItem[];
}
export interface WordImageMatchingData {
  type: 'word-image-matching';
  groups: WordImageMatchingGroup[];
}

// --- 블렌딩 듣기 맞추기 (파닉스 전용) ---
export interface BlendingListeningConfig {
  type: 'blending-listening';
}
export interface BlendingListeningRound {
  targetWord: string;
  targetImageUrl: string;
  targetTtsUrl: string;
  distractorWord: string;
  distractorImageUrl: string;
  blend: string;
}
export interface BlendingListeningData {
  type: 'blending-listening';
  rounds: BlendingListeningRound[];
}

// --- 음가 듣기 (파닉스 Level 1 전용) ---
export interface LetterSoundConfig {
  type: 'letter-sound';
}
export interface LetterSoundRound {
  targetLetter: string;
  ttsUrl: string;
  options: string[];
}
export interface LetterSoundData {
  type: 'letter-sound';
  rounds: LetterSoundRound[];
}

// --- 듣고 단어 맞추기 ---
export interface WordListeningConfig {
  type: 'word-listening';
}
export interface WordListeningOption {
  word: string;
  imageUrl: string;
}
export interface WordListeningRound {
  targetWord: string;
  targetTtsUrl: string;
  options: WordListeningOption[];
}
export interface WordListeningData {
  type: 'word-listening';
  rounds: WordListeningRound[];
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

// --- 동화책 퀴즈 ---
export interface StorybookQuizConfig {
  type: 'storybook-quiz';
  questionCount: number;
}
export interface StorybookQuizData {
  type: 'storybook-quiz';
  questions: QuizItem[];
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
  description: string;
  pages: number[];
  sizeCm?: number;
  sizeCategory?: 'small' | 'medium' | 'large';
  customPrompt?: string;
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
 * 탱고북 자체 4단계 독서 레벨. ORT·F&P·Lexile 공식 체계를 한국 유아 교육용으로 압축.
 * - L1 (씨앗, 3~4세): ORT Stage 1, F&P A-B, 1문장/쪽, 총 ≤50단어, 반복 구문
 * - L2 (새싹, 4~5세): ORT Stage 2~3, F&P C-D, 1~2문장/쪽, 총 80~150단어
 * - L3 (나무, 5~6세): ORT Stage 4~5, F&P E-G, 2~4문장/쪽, 총 200~350단어
 * - L4 (숲, 6~7세): ORT Stage 6+, F&P H-J, 3~5문장/쪽, 총 400~700단어
 */
export type ReadingLevel = 'L1' | 'L2' | 'L3' | 'L4';

export interface Storybook {
  id: string;
  title: string;
  type?: StorybookType; // undefined = 'storybook' (하위호환)
  targetAge: '4-5' | '5-7' | '7-8';
  /** 실측 기반 4단계 레벨. 신규 생성 책에 우선 사용 (targetAge는 레거시 호환) */
  readingLevel?: ReadingLevel;
  artStyle: string;
  category?: string;
  folder?: string;
  isPublic?: boolean;
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
};

// ===== Longform Video =====
export interface LongformProject {
  id: string;
  name: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  language: string;
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
