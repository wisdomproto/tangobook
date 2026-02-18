export interface Character {
  name: string;
  description: string;
  age?: number;
  role: string;
  height: number;
  referenceImage?: string;
  imageHistory?: string[];
  customPrompt?: string;
}

export interface SceneStructure {
  characters: string;
  background: string;
  atmosphere: string;
}

export interface Page {
  pageNumber: number;
  text: string;
  scene_description: string;
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
  description: string;
  pages: number[];
  sizeCm?: number;
  sizeCategory?: 'small' | 'medium' | 'large';
}

export interface KeyObjectImage {
  objectName: string;
  imageUrl: string;
  success: boolean;
}

export interface Storybook {
  id: string;
  title: string;
  targetAge: '4-5' | '5-7' | '7-8';
  artStyle: string;
  referenceContent?: string;
  createdAt: string;
  updatedAt?: string;

  // 표지
  coverPrompt?: string;
  coverImage?: string;
  coverImageHistory?: string[];
  coverCharacterRefs?: number[];

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
}

export type StorybookSummary = Pick<
  Storybook,
  'id' | 'title' | 'targetAge' | 'artStyle' | 'createdAt' | 'coverImage'
>;
