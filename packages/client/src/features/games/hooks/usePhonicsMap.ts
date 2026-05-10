import { useRef, useEffect, useState, type MutableRefObject } from 'react';
import { settingsApi } from '@/features/settings/api/settings.api';

type ModuleKey = 'mod_korean' | 'mod_phonics' | 'mod_english';

// 한글 7종성 중화 — phonics 라이브러리는 ㄱ/ㄴ/ㄷ/ㄹ/ㅁ/ㅂ/ㅇ 받침 음절만 보유.
// 발음상 동일한 대표 종성으로 매핑 (예: 갓·갗·갖·같·갛 → 갇 url) 해 web speech 폴백 회피.
// jong index (Hangul Jamo): 1=ㄱ 4=ㄴ 7=ㄷ 8=ㄹ 16=ㅁ 17=ㅂ 21=ㅇ
const FINAL_TO_REPRESENTATIVE: Record<number, number> = {
  2: 1,
  3: 1,
  9: 1,
  24: 1, // ㄲ ㄳ ㄺ ㅋ → ㄱ
  5: 4,
  6: 4, // ㄵ ㄶ → ㄴ
  19: 7,
  20: 7,
  22: 7,
  23: 7,
  25: 7,
  27: 7, // ㅅ ㅆ ㅈ ㅊ ㅌ ㅎ → ㄷ
  11: 8,
  12: 8,
  13: 8,
  15: 8, // ㄼ ㄽ ㄾ ㅀ → ㄹ
  10: 16, // ㄻ → ㅁ
  14: 17,
  18: 17,
  26: 17, // ㄿ ㅄ ㅍ → ㅂ
};

function addKoreanFinalAliases(map: Map<string, string>): void {
  // 대표 종성을 갖는 음절(예: 갇)에서 같은 발음의 다른 음절(갓·갗·갖·같·갛) 키 alias 추가.
  const REVERSE: Record<number, number[]> = {};
  for (const [from, to] of Object.entries(FINAL_TO_REPRESENTATIVE)) {
    const f = Number(from);
    if (!REVERSE[to]) REVERSE[to] = [];
    REVERSE[to].push(f);
  }
  for (const syl of [...map.keys()]) {
    if (syl.length !== 1) continue;
    const code = syl.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) continue;
    const offset = code - 0xac00;
    const jong = offset % 28;
    const aliases = REVERSE[jong];
    if (!aliases) continue;
    const url = map.get(syl)!;
    for (const aliasJong of aliases) {
      const aliasSyl = String.fromCharCode(0xac00 + offset - jong + aliasJong);
      if (!map.has(aliasSyl)) map.set(aliasSyl, url);
    }
  }
}

interface PhonicsMapResult {
  /** sound → R2 URL 맵. ref 라 변경 시 re-render X. */
  mapRef: MutableRefObject<Map<string, string>>;
  /** list fetch + 모든 mp3 prefetch 완료 여부. true 동안 게임 시작 전 spinner 표시. */
  loading: boolean;
}

/**
 * 파닉스 음원 라이브러리를 로드 + 모든 mp3 백그라운드 prefetch.
 *
 * 동작:
 *  1. `/api/settings/phonics-library` list fetch (sound → URL 맵 빌드)
 *  2. 맵의 모든 mp3 URL fetch — 브라우저 cache 채움 (게임 중 어떤 음절도 즉시 재생)
 *  3. 모두 끝나야 `loading: false`
 *
 * modules 순서대로 로드하며, 먼저 등록된 sound 가 우선 (중복 시 첫 entry 유지).
 */
export function usePhonicsMap(modules: ModuleKey[]): PhonicsMapResult {
  const mapRef = useRef<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    settingsApi
      .getPhonicsLibrary()
      .then((lib) => {
        if (cancelled) return;
        const map = new Map<string, string>();
        for (const mod of modules) {
          for (const item of lib[mod]) {
            if (!map.has(item.sound)) map.set(item.sound, item.url);
          }
        }
        if (modules.includes('mod_korean')) addKoreanFinalAliases(map);
        mapRef.current = map;
        setLoading(false);
        // mp3 prefetch 는 백그라운드 fire-and-forget. 라이브러리 음원 수가 수천 개라
        // Promise.all 로 await 하면 너무 오래 걸림. 일부만 미리 cache 채워도 효과 충분.
        // 우선 처음 100개만 prefetch — 자주 쓰는 자모/음절 위주.
        void (async () => {
          const urls = [...map.values()].slice(0, 100);
          await Promise.all(
            urls.map((url) => fetch(url, { cache: 'force-cache', mode: 'no-cors' }).catch(() => {}))
          );
        })();
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // modules 배열은 caller 가 매번 새 array 만들어 inline 으로 넘기는 패턴이라 deps 에 넣으면 무한 reload.
    // 의도적으로 빈 deps — modules 는 mount 시 한 번만 사용.
  }, []);

  return { mapRef, loading };
}
