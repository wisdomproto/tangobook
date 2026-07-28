// 학습·게임·어휘 레이어에서 쓰는 언어 코드. 콘텐츠·UI 완비 5개(런칭 타겟).
// 대부분의 코드는 `lang === 'ko' ? ... : ...` 이진 분기라 ko 외는 라틴/영어 흐름을 탄다;
// 언어별 특수 처리는 splitUnits(문자 분해)·폰트·라벨 배선에서 명시적으로 한다.
export type Lang = 'ko' | 'en' | 'vi' | 'zh' | 'th';

export type LearningEventType =
  | 'page_read'
  | 'word_exposed'
  | 'word_correct'
  | 'word_wrong'
  | 'word_spoken'
  | 'syllable_correct'
  | 'syllable_wrong'
  | 'phoneme_correct'
  | 'phoneme_wrong';

export interface LearningEventMetadata {
  lang?: Lang;
  source?: 'storybook' | 'phonics' | 'vocabulary';
  storybookId?: string;
  pageNumber?: number;
  page?: number;
  totalPages?: number;
  lastPage?: boolean;
  durationMs?: number;
  korean?: string;
  responseMs?: number;
  attempts?: number;
  consonant?: string;
  vowel?: string;
  /** 받침. 있으면 그 음절은 `강`(ㄱㅏㅇ)이지 `가`(ㄱㅏ)가 아니다 — 집계 칸이 갈린다. */
  coda?: string;
  level?: string;
  unitId?: string;
  phoneme?: string;
  pattern?: string;
  book?: string;
  /** 동화책 viewer 에서 page_read 시 로깅 — ART_STYLES.id (예: 'paper-craft', 'pixar-3d') */
  style?: string;
  migratedFrom?: string;
}

export interface LearningEvent {
  id: string;
  profile_id: string;
  event_type: LearningEventType;
  storybook_id: string | null;
  game_type: string | null;
  word: string | null;
  metadata: LearningEventMetadata | null;
  created_at: string;
}

export type LearningEventInsert = {
  profile_id: string;
  event_type: LearningEventType;
  storybook_id?: string | null;
  game_type?: string | null;
  word?: string | null;
  metadata?: LearningEventMetadata | null;
  created_at?: string;
};
