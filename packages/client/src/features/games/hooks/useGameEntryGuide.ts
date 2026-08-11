import { useEffect, useRef } from 'react';
import { usePhonicsEmbedded } from '../../phonics-learner/components/ActivityShell';

/**
 * 게임에 들어오면 **무엇을 하라는 말**을 소리로 한 번 들려준다(“블록으로 단어를 만들어봐!”).
 *
 * 🔴 **복사본 다섯을 하나로**(2026-08-10). 플레이어 다섯이 각자 `guidedRef` + `useEffect` 를
 *    들고 있어서, 「임베드에선 소리 내지 않는다」 같은 규칙을 넣을 자리가 다섯 군데였다
 *    (파닉스 활동은 `useEntryGuide` 로 진작 묶여 있었고 게임만 안 묶여 있었다).
 * 🔴 **광고 랜딩 상자(`embedded`)에서는 재생하지 않는다**(사용자 반복 지적: "페이지에서
 *    게임 시작 멘트는 안 나오게"). 학습 화면에선 글 못 읽는 아이에게 지시를 전하는 유일한
 *    수단이지만, 랜딩은 상자가 여럿이라 **아무것도 안 눌렀는데** 안내가 겹쳐 울린다.
 *
 * @param src  안내 음성 URL. `null` 이면 안 낸다(안내음이 한국어라 vi/zh/th 어휘 게임은 null).
 * @param onDone 안내가 끝나면 부른다. 🔴 **안 낸 경우엔 즉시** 부른다 — 이걸로 첫 문제 재생을
 *               막는 화면(영어 블록 알파벳 판)이 있어서, 안 부르면 낱말이 영영 안 나온다.
 */
export function useGameEntryGuide(
  src: string | null,
  playAudio: (url?: string, onEnded?: () => void) => void,
  onDone?: () => void
) {
  const embedded = usePhonicsEmbedded();
  const started = useRef(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (embedded || !src) {
      doneRef.current?.();
      return;
    }
    playAudio(src, () => doneRef.current?.());
  }, [embedded, src, playAudio]);
}
