import { useRef, useEffect, useState, type MutableRefObject } from 'react';
import { settingsApi } from '@/features/settings/api/settings.api';
import { expandKoreanFinalAliases, type PhonicsAudioItem } from '@tangobook/shared';

type ModuleKey = 'mod_korean' | 'mod_phonics' | 'mod_english';

// ─────────────────────────────────────────────────────────────────
// localStorage 캐싱 — 매 게임 진입 시 spinner 안 뜨도록
// TTL 없음 (무한). 캐시 hit 이면 spinner 스킵 + 백그라운드 silent refresh 로 항상 fresh.
// 라이브러리 schema 변경 시 CACHE_KEY 뒤 v 숫자 bump → 옛 캐시 자동 무효.
// ─────────────────────────────────────────────────────────────────
const CACHE_KEY = 'tangobook-phonics-library-v1';
// 캐시가 이만큼 신선하면 백그라운드 refresh 스킵 — 게임 재진입마다 ~8s list fetch 반복 방지.
const CACHE_FRESH_MS = 10 * 60 * 1000; // 10분

interface PhonicsLibrary {
  mod_phonics: PhonicsAudioItem[];
  mod_english: PhonicsAudioItem[];
  mod_korean: PhonicsAudioItem[];
}

function isValidLib(lib: unknown): lib is PhonicsLibrary {
  const l = lib as PhonicsLibrary | undefined;
  return (
    !!l &&
    Array.isArray(l.mod_phonics) &&
    Array.isArray(l.mod_english) &&
    Array.isArray(l.mod_korean)
  );
}

/** 캐시 entry (lib + 저장시각). 옛 형식({lib}만)은 at=0 으로 stale 취급. */
function loadCachedEntry(): { lib: PhonicsLibrary; at: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { lib?: PhonicsLibrary; at?: number };
    if (!isValidLib(parsed?.lib)) return null;
    return { lib: parsed.lib!, at: typeof parsed.at === 'number' ? parsed.at : 0 };
  } catch {
    return null;
  }
}

function loadCachedLibrary(): PhonicsLibrary | null {
  return loadCachedEntry()?.lib ?? null;
}

function saveCachedLibrary(lib: PhonicsLibrary): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ lib, at: Date.now() }));
  } catch {
    /* quota exceeded / disabled — silently ignore */
  }
}

/**
 * 한글 7종성 중화 alias — phonics 라이브러리는 ㄱ/ㄴ/ㄷ/ㄹ/ㅁ/ㅂ/ㅇ 받침 음절만 보유.
 * 대표 종성 음절(예: 갇) url 을 같은 발음의 다른 음절(갓·갗·갖·같·갛) key 에도 매핑 →
 * web speech 폴백 회피. 매핑 정책은 `@tangobook/shared/utils/phonics-syllable` 에 단일화.
 */
function addKoreanFinalAliases(map: Map<string, string>): void {
  for (const syl of [...map.keys()]) {
    const aliases = expandKoreanFinalAliases(syl);
    if (aliases.length === 0) continue;
    const url = map.get(syl)!;
    for (const aliasSyl of aliases) {
      if (!map.has(aliasSyl)) map.set(aliasSyl, url);
    }
  }
}

function buildPhonicsMap(lib: PhonicsLibrary, modules: ModuleKey[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const mod of modules) {
    const items = lib[mod];
    if (!Array.isArray(items)) continue; // 방어 — 부분 shape 시 skip
    for (const item of items) {
      if (!map.has(item.sound)) map.set(item.sound, item.url);
    }
  }
  if (modules.includes('mod_korean')) addKoreanFinalAliases(map);
  return map;
}

interface PhonicsMapResult {
  /** sound → R2 URL 맵. ref 라 변경 시 re-render X. */
  mapRef: MutableRefObject<Map<string, string>>;
  /** list fetch + 모든 mp3 prefetch 완료 여부. true 동안 게임 시작 전 spinner 표시. */
  loading: boolean;
}

// ── 세션 전역 가드 (중복 fetch/prefetch 홍수 방지) ─────────────────────────
// 🔴 문제: usePhonicsMap 이 GameOverlay + 플레이어에서 각각 마운트되고 dev StrictMode 로 2배 →
//    진입마다 목록 fetch 4회(~8s) + prefetchTop100 4회(mp3 400개)가 게이트의 이번 판 음절 워밍을 굶김
//    (그림짝 게이트가 33% 에서 멈추던 원인). 아래 가드로 목록 fetch 는 in-flight 공유, prefetch 는 세션 1회.
let inflightLib: Promise<PhonicsLibrary> | null = null;
function fetchLibShared(): Promise<PhonicsLibrary> {
  if (!inflightLib) {
    inflightLib = settingsApi.getPhonicsLibrary().finally(() => {
      inflightLib = null;
    });
  }
  return inflightLib;
}

let top100Prefetched = false;
function prefetchTop100Once(map: Map<string, string>): void {
  if (top100Prefetched) return;
  top100Prefetched = true;
  // 게이트의 이번 판 음절 워밍이 먼저 가도록 살짝 지연 후, 자주 쓰는 100개만 세션 1회 프리페치.
  setTimeout(() => {
    const urls = [...map.values()].slice(0, 100);
    void Promise.all(
      urls.map((url) => fetch(url, { cache: 'force-cache', mode: 'no-cors' }).catch(() => {}))
    );
  }, 1500);
}

/**
 * 파닉스 음원 라이브러리를 로드 + 자주 쓰는 mp3 세션 1회 prefetch.
 *
 * 동작:
 *  1. localStorage 캐시 확인 — hit 이면 즉시 map 빌드 + `loading: false`.
 *  2. 캐시가 신선(<10분)하면 백그라운드 refresh 스킵(재진입마다 ~8s fetch 반복 방지). stale/miss 면 공유 fetch.
 *  3. prefetchTop100 은 세션 1회 + 1.5s 지연(게이트 워밍 우선).
 *
 * modules 순서대로 로드하며, 먼저 등록된 sound 가 우선 (중복 시 첫 entry 유지).
 */
export function usePhonicsMap(modules: ModuleKey[], enabled = true): PhonicsMapResult {
  // 최초 렌더에서 캐시를 동기 로드 — 캐시 hit 이면 loading=false 로 시작해 첫 프레임 로딩 플래시 제거.
  // (modules 는 caller 가 매번 새 array 를 넘기지만 내용은 고정이라 첫 값으로 캡처)
  // enabled=false → 음절맵 안 쓰는 게임(따라쓰기·점잇기·영어): list fetch/prefetch 스킵, 즉시 ready.
  const modulesRef = useRef(modules);
  const mapRef = useRef<Map<string, string>>(new Map());
  const [loading, setLoading] = useState<boolean>(() => {
    if (!enabled) return false;
    const cached = loadCachedLibrary();
    if (cached) {
      mapRef.current = buildPhonicsMap(cached, modulesRef.current);
      return false;
    }
    return true;
  });

  useEffect(() => {
    if (!enabled) return; // 비활성 게임은 파닉스 라이브러리 로드 안 함(~8s fetch + mp3 prefetch 절약)
    let cancelled = false;

    const buildMap = (lib: PhonicsLibrary): Map<string, string> =>
      buildPhonicsMap(lib, modulesRef.current);

    // 1. localStorage cache hit → 즉시 사용 + prefetch(세션 1회)
    const entry = loadCachedEntry();
    if (entry) {
      mapRef.current = buildMap(entry.lib);
      setLoading(false);
      prefetchTop100Once(mapRef.current);
      // 캐시가 신선하면 백그라운드 refresh 스킵 — 재진입마다 반복되던 ~8s fetch 제거.
      if (Date.now() - entry.at < CACHE_FRESH_MS) {
        return () => {
          cancelled = true;
        };
      }
    }

    // 2. stale/miss → 공유 fetch (동시 마운트/StrictMode 는 in-flight 하나로 합쳐짐)
    fetchLibShared()
      .then((lib) => {
        if (cancelled) return;
        saveCachedLibrary(lib);
        mapRef.current = buildMap(lib);
        if (!entry) {
          setLoading(false);
          prefetchTop100Once(mapRef.current);
        }
      })
      .catch(() => {
        if (!cancelled && !entry) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // modules 배열은 caller 가 매번 새 array 만들어 inline 으로 넘기는 패턴이라 deps 에 넣으면 무한 reload.
    // 의도적으로 modules 제외 — mount 시 한 번만 사용. enabled 전이 시엔 재실행 필요.
  }, [enabled]);

  return { mapRef, loading };
}
