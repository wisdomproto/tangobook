export type Lang = 'ko' | 'en';

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
  source?: 'storybook' | 'phonics';
  storybookId?: string;
  pageNumber?: number;
  page?: number;
  durationMs?: number;
  korean?: string;
  responseMs?: number;
  attempts?: number;
  consonant?: string;
  vowel?: string;
  level?: string;
  unitId?: string;
  phoneme?: string;
  pattern?: string;
  book?: string;
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
