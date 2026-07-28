import { useCallback } from 'react';
import { decomposeWord } from '@tangobook/shared';
import { useLogEvent } from '@/features/learning/hooks/useLogEvent';

/**
 * 아이가 **직접 만들거나 쓴 음절 한 글자**를 부모 리포트 칸에 남긴다.
 *
 * 🔴 활동이 들고 있는 자모(`pair.first`)가 아니라 **완성된 글자를 쪼개서** 넘긴다 — 받침 모드에선
 *    `pair.first` 가 자음이 아니라 음절(`가`)이라 그대로 넘기면 칸이 안 맞는다. `강` 하나에서
 *    초성·중성·받침이 다 나오므로 두 모드가 같은 코드를 쓴다.
 * 🔴 이건 **1점짜리 증거**다(글자를 직접 조작했다). 단어를 맞힌 건 `groupBySyllable` 이 1/4 로 얹는다.
 */
export function useLogSyllable(unitId: string) {
  const logEvent = useLogEvent();
  return useCallback(
    (syllable: string) => {
      const [s] = decomposeWord(syllable);
      if (!s) return;
      logEvent({
        type: 'syllable_correct',
        storybookId: unitId,
        metadata: {
          source: 'phonics',
          unitId,
          consonant: s.cho,
          vowel: s.jung,
          ...(s.jong ? { coda: s.jong } : {}),
        },
      });
    },
    [logEvent, unitId]
  );
}
