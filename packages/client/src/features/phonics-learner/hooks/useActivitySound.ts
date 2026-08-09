import { useCallback, useMemo } from 'react';
import { resolveTtsUrl } from '@/features/tts';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';

/**
 * 소리와 소리 **사이의 쉼**(ms).
 *
 * 🔴 콜백 체인은 앞 소리가 끝나는 **즉시** 다음 소리를 낸다 — 실측 간격이 1~3ms 였다.
 *    글자가 끝나자마자 띵동이 붙어 한 덩어리로 들린다. 말과 말 사이엔 숨 쉴 자리가 있어야
 *    아이가 각각을 따로 알아듣는다.
 */
export const REST_MS = 430;

interface Options {
  unitId: string;
  /** 콘텐츠 소리의 언어. 안내·칭찬은 별개(칭찬은 `en` 만 가르고 `zh`·`korean` 은 `ko`). */
  language?: 'korean' | 'english' | 'zh';
  /** concat 캐시 키 접두사 — 활동마다 다르게(`consonant-tap`·`review-write`…). */
  prefix: string;
}

/**
 * 파닉스 활동의 **소리 순서**를 한 곳에 모은 훅.
 *
 * 🔴 왜 있나: 활동 14개가 각자 `resolveTtsUrl` + `playAudio` 체인을 **손으로 복사**해 갖고 있었고,
 *    그래서 「소리 사이엔 쉼 400~450ms」 규칙이 **8개에만 들어 있었다**. 나머지에선 글자와 띵동이
 *    1~3ms 로 붙어 들렸다(사용자가 여러 번 지적한 그 증상). 규칙을 문서에 적는 것으로는 안 되고
 *    **부를 수 있는 함수**로 만들어야 다음 활동이 자동으로 지킨다.
 *
 * 🔴 `setTimeout` 으로 소리 길이를 **가정하지 않는다** — 항상 `onEnded` 로 잇고, 쉼은 끝난 걸
 *    확인한 **뒤에** 넣는다. 이 둘은 충돌하는 규칙이 아니다.
 */
export function useActivitySound({ unitId, language = 'korean', prefix }: Options) {
  const audio = useGameAudio();
  const { playAudio, playCorrectSequence, scheduleTimer } = audio;

  /** 소리가 **끝난 뒤** 잠깐 쉬고 다음으로. 언마운트 시 자동 정리된다. */
  const rest = useCallback(
    (fn: () => void) => {
      scheduleTimer(fn, REST_MS);
    },
    [scheduleTimer]
  );

  /** 텍스트 한 조각 읽기. `directUrl` 이 있으면 그걸 우선(단어 카드 녹음 등). */
  const say = useCallback(
    async (text: string, onEnded?: () => void, directUrl?: string) => {
      const url =
        directUrl ||
        (await resolveTtsUrl({ text, language, storybookId: unitId, identifierPrefix: prefix }));
      // 🔴 URL 이 없어도 `onEnded` 는 부른다 — 안 그러면 음원 하나 없는 것 때문에 활동이 멈춘다.
      playAudio(url, onEnded);
    },
    [language, unitId, prefix, playAudio]
  );

  const chime = useCallback(
    (onEnded?: () => void) => playAudio('/sounds/game/correct.mp3', onEnded),
    [playAudio]
  );

  /**
   * 한 판 맞혔을 때의 **표준 순서**: 소리 → 쉼 → (띵동 → 쉼 → onDone) 또는 (칭찬 → onDone).
   *
   * `praise: true` 는 활동 전체가 끝났을 때 — 칭찬 음원이 띵동을 겸하므로 띵동을 또 내지 않는다
   * (한 이벤트에 두 발이 겹쳐 앞소리가 잘리던 버그).
   */
  const sayThenChime = useCallback(
    (
      text: string,
      opts?: { onDone?: () => void; praise?: boolean; directUrl?: string }
    ): Promise<void> =>
      say(
        text,
        () =>
          rest(() => {
            if (opts?.praise) {
              playCorrectSequence({
                language: language === 'english' ? 'en' : 'ko',
                onDone: opts.onDone,
              });
              return;
            }
            chime(() => rest(() => opts?.onDone?.()));
          }),
        opts?.directUrl
      ),
    [say, rest, chime, playCorrectSequence, language]
  );

  return useMemo(
    () => ({ ...audio, say, chime, rest, sayThenChime }),
    [audio, say, chime, rest, sayThenChime]
  );
}
