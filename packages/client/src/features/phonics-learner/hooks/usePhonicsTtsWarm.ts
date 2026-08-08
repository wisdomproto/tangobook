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
  identifierPrefix: string,
  language: 'korean' | 'english' | 'zh' = 'korean'
) {
  // 배열 아이덴티티가 아니라 내용으로 재실행을 판단한다(호출부가 useMemo 를 안 써도 안전).
  // 구분자는 개행 — 발음 텍스트에 공백이 들어가는 경우가 있다("ㄱ ㄱ 고기").
  const key = texts.join('\n');
  useEffect(() => {
    if (!unitId || !key) return;
    let alive = true;
    /**
     * 🔴 **순서대로 하나씩** 데운다 — 예전엔 전부 한 번에 쐈다.
     *
     * 받침 익히기는 14짝 × 3텍스트 = 중복 제거해도 29건이다. 병렬로 쏘면 서버가 그 무리를
     * 한꺼번에 처리하느라, 아이가 가장 먼저 누르는 **첫 글자**가 스물몇 건 뒤에 줄을 선다.
     * 순차로 돌리면 목록 앞쪽(=먼저 쓰는 것)이 가장 먼저 준비된다 — 전체가 다 데워지는 시간은
     * 길어지지만, 그건 아이가 기다리는 시간이 아니다.
     *
     * 호출부는 `[첫글자, 둘째글자, 이어읽기]` 순으로 넘기므로 이 순서가 곧 우선순위다.
     */
    void (async () => {
      for (const text of key.split('\n')) {
        if (!alive) return;
        try {
          const url = await resolveTtsUrl({
            text,
            language,
            storybookId: unitId,
            identifierPrefix,
          });
          if (url) await warmAudioUrl(url);
        } catch {
          /* 한 건 실패가 나머지를 막지 않는다 */
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [unitId, key, identifierPrefix, language]);
}
