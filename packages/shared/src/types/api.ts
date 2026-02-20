export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: string;
  code?: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// 이미지 생성 요청/응답 공통
export interface ImageGenerationResult {
  imageUrl: string;
}

// TTS 생성 결과
export interface TtsResult {
  audioUrl: string;
}

// 페이지 번역 결과
export interface TranslationResult {
  language: string;
  text: string;
}

// 스토리 텍스트만 생성 요청 (Step 1)
export interface GenerateStoryRequest {
  title: string;
  targetAge: '4-5' | '5-7' | '7-8';
  referenceContent?: string;
  model?: string;
}

export interface StoryDraftPage {
  pageNumber: number;
  text: string;
  scene_description?: string;
}

// 스토리북 생성 요청 (Step 2 - 전체 생성)
export interface GenerateStorybookRequest {
  title: string;
  targetAge: '4-5' | '5-7' | '7-8';
  artStyle: string;
  referenceContent?: string;
  draftPages?: StoryDraftPage[];
  model?: string;
}

// 오디오북 생성 요청/응답
export interface AudiobookGenerateRequest {
  storybookId: string;
  projectId: string;
}

export interface AudiobookResult {
  outputUrl: string;
}
