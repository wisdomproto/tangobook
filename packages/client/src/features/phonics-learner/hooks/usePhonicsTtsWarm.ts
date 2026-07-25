import { useEffect } from 'react';
import { resolveTtsUrl } from '@/features/tts';
import { warmAudioUrl } from '@/features/games/hooks/useGamePrefetch';

/**
 * 활동이 쓸 한글 발음을 진입 시점에 미리 만들어 둔다.
 *
 * 🔴 실측(2026-07-25): 첫 탭이 concat 왕복 804ms + mp3 620ms = ~1.4초 무음이었다.
 * 아이는 그동안 카드를 다시 누른다. 게임 쪽은 이미 프리로드 게이트로 해결한 문제라
 * 파닉스도 같은 방식으로 — 다만 여기선 진행률바 없이 백그라운드로만 데운다
 * (게이트를 세우면 오히려 진입이 느려 보인다).
 *
 * resolveTtsUrl 이 세션 캐시를 갖고 있어, 데워진 소리는 탭 시 왕복 없이 바로 난다.
 */
export function usePhonicsTtsWarm(
  unitId: string,
  texts: ReadonlyArray<string>,
  identifierPrefix: string
) {
  // 배열 아이덴티티가 아니라 내용으로 재실행을 판단한다(호출부가 useMemo 를 안 써도 안전).
  // 구분자는 개행 — 발음 텍스트에 공백이 들어가는 경우가 있다("ㄱ ㄱ 고기").
  const key = texts.join('\n');
  useEffect(() => {
    if (!unitId || !key) return;
    for (const text of key.split('\n')) {
      void resolveTtsUrl({ text, language: 'korean', storybookId: unitId, identifierPrefix })
        .then((url) => (url ? warmAudioUrl(url) : undefined))
        .catch(() => undefined);
    }
  }, [unitId, key, identifierPrefix]);
}
