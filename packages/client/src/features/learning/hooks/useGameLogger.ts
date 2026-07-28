import { useCallback } from 'react';
import type { GameTypeId, Lang, LearningEventMetadata, LearningEventType } from '@tangobook/shared';
import { useLogEventsBatch, type LogEventBatchItem } from './useLogEvent';
import { useVocabSource } from '../context/VocabSourceContext';

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
  /** emit 시 metadata.source — 어휘 단원 학습 시 'vocabulary' (default 'storybook') */
  source?: 'storybook' | 'vocabulary';
  /** 어휘 단원 학습 시 metadata.unitId */
  unitId?: string;
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
 * 🔴 **한글 블록·낱말 쓰기·그림 짝은 플레이어가 직접 `decomposeWord` 로 음절 결과까지 만들어 넘긴다**
 *  (그 게임들은 아이가 음절을 실제로 조작하므로 정식 1점이 맞다). 그래서 `groupBySyllable` 은
 *  그 게임의 단어에는 부분점수를 안 얹는다 — 얹으면 같은 판정을 두 번 센다. 새 플레이어에서
 *  음절 결과를 넣고 뺄 때 집계 쪽은 손댈 필요 없다(이벤트에서 판단한다).
 */
export function useGameLogger() {
  const batch = useLogEventsBatch();
  const vocabCtx = useVocabSource();

  return useCallback(
    ({ gameType, storybookId, lang, results, source, unitId }: LogGameArgs) => {
      if (results.length === 0) return;
      const items: LogEventBatchItem[] = [];
      // 명시 인자 > Context > default 'storybook'
      const effectiveSource = source ?? vocabCtx?.source ?? 'storybook';
      const effectiveUnitId = unitId ?? vocabCtx?.unitId;
      const baseMeta = (extra?: Partial<LearningEventMetadata>): LearningEventMetadata => ({
        lang,
        source: effectiveSource,
        ...(effectiveSource === 'storybook' ? { storybookId } : { unitId: effectiveUnitId }),
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
    [batch, vocabCtx]
  );
}
