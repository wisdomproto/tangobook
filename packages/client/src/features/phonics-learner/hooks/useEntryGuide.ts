import { useEffect, useRef, useState } from 'react';

/** 활동 진입 안내 음성 — 자산은 `public/sounds/voice/`, 생성기는 `generate-activity-voice-prompts.mjs`. */
export const ENTRY_GUIDE = {
  /** 듣고 고르기 — "잘 듣고 맞춰봐!" */
  quiz: '/sounds/voice/quiz-start-ko.mp3',
  /** 순서대로 누르는 화면 — "반짝이는 곳을 눌러봐!" */
  tap: '/sounds/voice/tap-sparkle-ko.mp3',
  /** 글자 사냥 — "같은 글자를 모두 찾아봐!" */
  hunt: '/sounds/voice/hunt-start-ko.mp3',
  /** 쓰기(반짝이는 칸 있음 — 한글 자음 쓰기) — "반짝이는 칸에 써 봐!" */
  write: '/sounds/voice/write-start-ko.mp3',
  /** 쓰기(낱말/글자 전체를 한꺼번에 — ABC·영어 CVC·모음 쓰기, 반짝이는 칸 없음) — "글자를 따라 써 봐!" */
  writeTrace: '/sounds/voice/write-trace-ko.mp3',
} as const;

/**
 * 활동에 들어오면 **무엇을 하라는 말**을 소리로 한 번 들려준다.
 *
 * 🔴 **글을 못 읽는 4~7세라 화면의 지시문은 안 읽힌다.** 안내 없이 시작하는 화면이 오늘 하루에만
 *    세 번 나왔고(글자 사냥·복습 듣기 2종), 쓰기 6종은 통째로 무음이었다 — 지시가 전부 텍스트였다.
 * 🔴 **훅으로 묶는 이유**: 매번 컴포넌트에 손으로 배선하다 보니 「듣고 고르기」는 *퀴즈 버튼 경로에만*
 *    안내가 붙어서, 같은 컴포넌트인데 복습으로 들어오면 안내가 없었다. 새 활동은 이걸 부르면 된다.
 *
 * @returns `guiding` — 안내가 나오는 중. 진입하자마자 문제를 내는 화면은 이 값이 `false` 가 될 때까지
 *          기다린다(쓰기처럼 아이가 먼저 할 일이 있는 화면은 굳이 막지 않아도 된다).
 */
export function useEntryGuide(
  src: string,
  playAudio: (url?: string, onEnded?: () => void) => void,
  opts: { skip?: boolean } = {}
): boolean {
  const skip = opts.skip ?? false;
  const [guiding, setGuiding] = useState(!skip);
  const tokenRef = useRef(0);

  useEffect(() => {
    if (skip) return;
    /**
     * 🔴 **뒤늦게 오는 콜백은 무시한다**(토큰). `playAudio` 는 새 소리를 틀 때 앞 소리의 `src` 를
     *    비우고, 그러면 앞 소리에 `error` 가 떠서 **끝나지도 않았는데 콜백이 즉시** 돈다.
     *    개발 모드(StrictMode)는 effect 를 두 번 실행하므로 첫 안내가 그렇게 죽고, 그 죽은 콜백이
     *    잠금을 풀어 **안내와 첫 과제 소리가 겹쳤다**(실측 +21ms 안내 · +119ms 글자).
     *    토큰이 맞을 때만 풀면 살아 있는 재생만 잠금을 푼다 — 개발에서도 실제 순서가 보인다.
     * 🔴 **해제를 타이머로 하지 않는다** — 언마운트 때 지워지는 타이머에 걸면 `guiding` 이 영영
     *    true 로 남아 판이 통째로 안 눌린다(글자 사냥에서 실제로 그랬다). 쉼은 호출부가 첫 소리
     *    앞에 준다.
     */
    const my = ++tokenRef.current;
    playAudio(src, () => {
      if (tokenRef.current === my) setGuiding(false);
    });
  }, [skip, src, playAudio]);

  return guiding;
}
