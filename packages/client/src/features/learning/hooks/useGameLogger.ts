import { useCallback } from 'react';
import type { GameTypeId, Lang, LearningEventMetadata, LearningEventType } from '@tangobook/shared';
import { useLogEventsBatch, type LogEventBatchItem } from './useLogEvent';

export interface GameWordResult {
  /** 단어(영어/한글 라벨). 생략 시 word_* 이벤트 skip — syllable/phoneme만 쏠 때 용도 */
  word?: string;
  correct: boolean;
  /** 한글 파닉스 음절 이벤트(consonant+vowel 분해)를 추가로 쏠 때 세트 */
  consonant?: string;
  vowel?: string;
  /** 영어 파닉스 음소 이벤트를 추가로 쏠 때 */
  phoneme?: string;
  attempts?: number;
  responseMs?: number;
}

export interface LogGameArgs {
  gameType: GameTypeId;
  storybookId?: string;
  lang: Lang;
  results: GameWordResult[];
}

/**
 * 게임 종료 시 결과를 batch로 emit.
 *
 * 기본: `word_correct`/`word_wrong` 이벤트.
 * `consonant`+`vowel` 세트 시: 추가로 `syllable_correct`/`syllable_wrong` 도 쏨.
 * `phoneme` 있을 시: 추가로 `phoneme_correct`/`phoneme_wrong` 도 쏨.
 *
 * 게스트 모드(활성 프로필 없음)에선 자동 no-op (useLogEventsBatch 내부).
 *
 * TODO(follow-up): korean-block·english-block·word-writing 등 나머지 게임 플레이어에
 *  점진적으로 연동. 지금은 connect-the-dots 시범 연동만 완료.
 */
export function useGameLogger() {
  const batch = useLogEventsBatch();

  return useCallback(
    ({ gameType, storybookId, lang, results }: LogGameArgs) => {
      if (results.length === 0) return;
      const items: LogEventBatchItem[] = [];
      const baseMeta = (extra?: Partial<LearningEventMetadata>): LearningEventMetadata => ({
        lang,
        source: 'storybook',
        storybookId,
        ...extra,
      });

      for (const r of results) {
        if (r.word) {
          const wordType: LearningEventType = r.correct ? 'word_correct' : 'word_wrong';
          items.push({
            event_type: wordType,
            storybook_id: storybookId ?? null,
            game_type: gameType,
            word: r.word,
            metadata: baseMeta({ attempts: r.attempts, responseMs: r.responseMs }),
          });
        }

        if (r.consonant && r.vowel) {
          const sylType: LearningEventType = r.correct ? 'syllable_correct' : 'syllable_wrong';
          items.push({
            event_type: sylType,
            storybook_id: storybookId ?? null,
            game_type: gameType,
            word: `${r.consonant}${r.vowel}`,
            metadata: baseMeta({ consonant: r.consonant, vowel: r.vowel }),
          });
        }

        if (r.phoneme) {
          const phType: LearningEventType = r.correct ? 'phoneme_correct' : 'phoneme_wrong';
          items.push({
            event_type: phType,
            storybook_id: storybookId ?? null,
            game_type: gameType,
            word: r.phoneme,
            metadata: baseMeta({ phoneme: r.phoneme }),
          });
        }
      }

      batch(items);
    },
    [batch]
  );
}
