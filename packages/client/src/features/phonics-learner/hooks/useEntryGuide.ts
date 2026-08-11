import { useEffect, useRef, useState } from 'react';
import i18n from '@/i18n';
import { usePhonicsEmbedded } from '../components/ActivityShell';

/**
 * 🔴 **자산 이름만 갖는다 — 언어는 재생할 때 붙인다**(`voiceUrl`). 예전엔 `-ko` 가 URL 에 박혀
 *    있어서 UI 언어와 무관하게 늘 한국어 안내가 나갔다(`quiz-start-en.mp3` 는 이미 구워 뒀는데도
 *    코드가 쓰지 않았다). 지시는 *배우는 내용*이 아니라 **아이가 알아듣는 말**이어야 한다.
 *
 * 자산은 `public/sounds/voice/{이름}-{언어}.mp3`, 생성기는 `generate-activity-voice-prompts.mjs`.
 */
export const ENTRY_GUIDE = {
  /** 듣고 고르기 — "잘 듣고 맞춰봐!" */
  quiz: 'quiz-start',
  /** 순서대로 누르는 화면 — "반짝이는 곳을 눌러봐!" */
  tap: 'tap-sparkle',
  /** 글자 사냥 — "같은 글자를 모두 찾아봐!" */
  hunt: 'hunt-start',
  /** 쓰기(반짝이는 칸 있음 — 한글 자음 쓰기) — "반짝이는 칸에 써 봐!" */
  write: 'write-start',
  /** 쓰기(낱말/글자 전체를 한꺼번에 — ABC·영어 CVC·모음 쓰기, 반짝이는 칸 없음) — "글자를 따라 써 봐!" */
  writeTrace: 'write-trace',
  /** 눌러서 들어보는 탐색 — "눌러서 들어봐!" (듣고 고르기 탐색·낱말가족 배우기). */
  listenExplore: 'listen-explore',
  /** 순서대로 눌러 듣기 — "순서대로 눌러봐!" (모음 듣기 순서 단계). */
  orderListen: 'order-listen',
  /** 자음 배우기 — "세 번씩 눌러봐!" */
  consonantTap: 'consonant-tap',
  /** 모음 고르기 — "어떤 모음을 골라봐?" */
  vowelPick: 'vowel-pick',
  /** 뒤집기 짝 맞추기 — "같은 짝을 찾아봐!" */
  flipMatch: 'flip-match',
} as const;

/**
 * 🔴 **그 언어로 구워 둔 음성만** 적는다 — 없는 언어를 URL 로 만들면 404 라 **안내가 통째로
 *    무음**이 되고, 글을 못 읽는 아이에겐 화면이 아무 말도 안 하는 것과 같다. 목록에 없으면 ko.
 *    자산을 구울 때 여기에 언어를 추가하는 게 배선의 전부다(칭찬 음성도 같은 규칙으로 확장한다).
 */
const VOICE_LANGS: Record<string, readonly string[]> = {
  'quiz-start': ['en'],
};

/**
 * 안내·칭찬 음성 URL — `{이름}-{UI 언어}.mp3`, 그 언어 자산이 없으면 `-ko` 폴백.
 * 🔴 모듈 상수로 굳히지 말 것 — 언어는 재생 시점에 정해진다.
 */
export function voiceUrl(name: string, lang: string = i18n.language): string {
  const base = lang.slice(0, 2);
  return `/sounds/voice/${name}-${VOICE_LANGS[name]?.includes(base) ? base : 'ko'}.mp3`;
}

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
  /** `ENTRY_GUIDE` 의 자산 이름 — URL 은 `voiceUrl` 이 UI 언어로 조립한다. */
  name: string,
  playAudio: (url?: string, onEnded?: () => void) => void,
  opts: { skip?: boolean } = {}
): boolean {
  /**
   * 🔴 **광고 랜딩 상자 안에서는 안내를 재생하지 않는다**(2026-08-10 사용자: "페이지 열자마자
   *    한글 게임 소리가 나는데?"). 학습 화면에선 글을 못 읽는 아이에게 지시를 전하는 유일한
   *    수단이지만, 랜딩은 **아무것도 안 눌렀는데 소리가 나는 것** 자체가 사고다 — 상자가 여럿이라
   *    스크롤만 해도 안내가 겹쳐 울린다. `guiding` 은 false 로 시작하므로 화면 잠금도 안 걸린다.
   */
  const embedded = usePhonicsEmbedded();
  const skip = embedded || (opts.skip ?? false);
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
    playAudio(voiceUrl(name), () => {
      if (tokenRef.current === my) setGuiding(false);
    });
  }, [skip, name, playAudio]);

  return guiding;
}
