import { useRef, useEffect, useState, type MutableRefObject } from 'react';
import { settingsApi } from '@/features/settings/api/settings.api';
import { expandKoreanFinalAliases, type PhonicsAudioItem } from '@tangobook/shared';

type ModuleKey = 'mod_korean' | 'mod_phonics' | 'mod_english' | 'mod_chinese';

// ─────────────────────────────────────────────────────────────────
// localStorage 캐싱 — 매 게임 진입 시 spinner 안 뜨도록
// TTL 없음 (무한). 캐시 hit 이면 spinner 스킵 + 백그라운드 silent refresh 로 항상 fresh.
// 라이브러리 schema 변경 시 CACHE_KEY 뒤 v 숫자 bump → 옛 캐시 자동 무효.
// ─────────────────────────────────────────────────────────────────
// v2: mod_chinese(병음) 카테고리 추가 — v1 캐시엔 없어 병음이 무음이므로 키를 올려 1회 재fetch.
const CACHE_KEY = 'tangobook-phonics-library-v3';
// 캐시가 이만큼 신선하면 백그라운드 refresh 스킵 — 게임 재진입마다 ~8s list fetch 반복 방지.
const CACHE_FRESH_MS = 10 * 60 * 1000; // 10분

interface PhonicsLibrary {
  mod_phonics: PhonicsAudioItem[];
  mod_english: PhonicsAudioItem[];
  mod_korean: PhonicsAudioItem[];
  // 병음(拼音) — 나중에 추가. 옛 응답/캐시엔 없을 수 있어 optional(buildPhonicsMap 가 방어).
  mod_chinese?: PhonicsAudioItem[];
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

// ── 훅 밖에서 쓰는 낱 음절 조회 ──────────────────────────────────────────────
let sharedKoMap: Map<string, string> | null = null;
let sharedKoMapPromise: Promise<Map<string, string>> | null = null;

/**
 * 한글 낱 음절/자모 → R2 mp3 URL. **React 훅 밖에서도** 쓴다.
 *
 * 🔴 `가`·`강`·`으`·`ㄱ` 은 라이브러리에 **이미 mp3 가 있다**(mod_korean 3232 음절 + 자모 40).
 *    그런데 파닉스 학습 활동은 그걸 안 보고 매번 서버 concat(`POST /api/phonics-library/concat`,
 *    ffmpeg 왕복)을 불러 한 글자를 "합쳐" 달라고 했다 — 첫 탭이 늦는 이유가 여기였다.
 *    동화책 게임이 `usePhonicsMap` 으로 이미 푼 문제인데 학습 활동만 빠져 있었다.
 *    여러 토막을 잇는 이어읽기(`가 으 강`)만 concat 이 필요하다.
 *
 * 캐시·in-flight 가드는 위 훅과 **같은 것**을 쓴다(localStorage 키 공유, 목록 fetch 1회).
 */
export function getKoreanSyllableUrl(text: string): Promise<string | undefined> {
  if (sharedKoMap) return Promise.resolve(sharedKoMap.get(text));
  if (!sharedKoMapPromise) {
    const cached = loadCachedLibrary();
    sharedKoMapPromise = cached
      ? Promise.resolve(buildPhonicsMap(cached, ['mod_korean']))
      : fetchLibShared()
          .then((lib) => {
            saveCachedLibrary(lib);
            return buildPhonicsMap(lib, ['mod_korean']);
          })
          .catch(() => new Map<string, string>());
    void sharedKoMapPromise.then((m) => {
      sharedKoMap = m;
    });
  }
  return sharedKoMapPromise.then((m) => m.get(text));
}

// ── 영어 낱 토큰 조회 (한글 getKoreanSyllableUrl 과 대칭) ─────────────────────
let sharedEnMap: Map<string, string> | null = null;
let sharedEnMapPromise: Promise<Map<string, string>> | null = null;

/**
 * 서버 `downloadSound` 와 **같은 후보 순서**로 map 을 뒤진다 — 소리를 바꾸지 않고 왕복만 없앤다.
 * 원본 → 소문자 → 같은 글자 압축('Aa'→'a') → 하이픈/아포스트로피 제거('yo-yo'→'yoyo').
 * (우선순위 mod_phonics→mod_english 는 `buildPhonicsMap` 의 module 순서로 이미 반영.)
 */
export function lookupEnglishSound(map: Map<string, string>, text: string): string | undefined {
  const cands = [text];
  const lower = text.toLowerCase();
  if (lower !== text) cands.push(lower);
  const uniq = Array.from(new Set(lower));
  if (uniq.length === 1 && uniq[0] !== lower) cands.push(uniq[0]);
  const stripped = lower.replace(/[^a-z0-9]/g, '');
  if (stripped && stripped !== text) cands.push(stripped);
  for (const c of cands) {
    const u = map.get(c);
    if (u) return u;
  }
  return undefined;
}

/**
 * 영어 낱글자/패턴/낱말 → R2 mp3 URL. **React 훅 밖에서도** 쓴다.
 *
 * 🔴 `e`·`an`·`cat` 은 라이브러리에 **이미 mp3 가 있다**(mod_phonics 3424 + mod_english 5288).
 *    그런데 영어 파닉스는 그걸 안 보고 매번 서버 concat(~800ms 왕복)을 불렀다 — 한글은 진작
 *    `getKoreanSyllableUrl` 로 직행하는데 영어만 빠져 있어, 글자 사냥 방해꾼·복습 낱글자 등
 *    워밍 목록에서 새는 소리가 전부 늦게 났다. 공백 있는 이어읽기만 진짜 concat 이 필요하다.
 */
export function getEnglishPhonemeUrl(text: string): Promise<string | undefined> {
  if (sharedEnMap) return Promise.resolve(lookupEnglishSound(sharedEnMap, text));
  if (!sharedEnMapPromise) {
    const cached = loadCachedLibrary();
    sharedEnMapPromise = cached
      ? Promise.resolve(buildPhonicsMap(cached, ['mod_phonics', 'mod_english']))
      : fetchLibShared()
          .then((lib) => {
            saveCachedLibrary(lib);
            return buildPhonicsMap(lib, ['mod_phonics', 'mod_english']);
          })
          .catch(() => new Map<string, string>());
    void sharedEnMapPromise.then((m) => {
      sharedEnMap = m;
    });
  }
  return sharedEnMapPromise.then((m) => lookupEnglishSound(m, text));
}

// ── 병음(拼音) 낱 음절 조회 (한글 getKoreanSyllableUrl 과 대칭) ─────────────────
let sharedZhMap: Map<string, string> | null = null;
let sharedZhMapPromise: Promise<Map<string, string>> | null = null;

/**
 * 병음 음절(성조부호 포함) → R2 mp3 URL. **React 훅 밖에서도** 쓴다.
 *
 * 🔴 `ā`·`ō`·`mā` 는 R2 `mod_chinese` 에 **원어민 녹음 mp3** 로 올라가 있다(성조 정확). 예전엔
 *    cmn-CN TTS 가 병음이 아니라 대표 한자를 읽어 성조가 근사였는데, 사전녹음이라 직행한다.
 *    한글/영어와 같은 라이브러리 맵 경로 — 첫 조회만 목록 fetch, 이후 캐시.
 */
export function getChineseSyllableUrl(text: string): Promise<string | undefined> {
  // 성조 부호는 NFC 단일 코드포인트로 통일한다 — 소스/R2 키가 NFD 로 갈리면 조회가 조용히 miss.
  const key = text.normalize('NFC');
  if (sharedZhMap) return Promise.resolve(sharedZhMap.get(key));
  if (!sharedZhMapPromise) {
    const cached = loadCachedLibrary();
    sharedZhMapPromise = cached
      ? Promise.resolve(buildPhonicsMap(cached, ['mod_chinese']))
      : fetchLibShared()
          .then((lib) => {
            saveCachedLibrary(lib);
            return buildPhonicsMap(lib, ['mod_chinese']);
          })
          .catch(() => new Map<string, string>());
    void sharedZhMapPromise.then((m) => {
      sharedZhMap = m;
    });
  }
  return sharedZhMapPromise.then((m) => m.get(key));
}
