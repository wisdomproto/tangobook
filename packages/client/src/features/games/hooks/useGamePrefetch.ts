import { useEffect, useState } from 'react';
import { resolveTtsUrl } from '@/features/tts';

/** 로딩 게이트가 무한정 걸리지 않도록 하는 상한(ms) — 네트워크가 느려도 이 시간 뒤엔 시작. */
const PREWARM_MAX_MS = 6000;

// ─────────────────────────────────────────────────────────────────
// 워밍 플래그 — "이미 프리페치한 오디오"를 기록해 재진입 시 로딩 게이트를 스킵한다.
// 세션(모듈 Set) + localStorage(리로드에도 유지). URL/토큰이 이미 warmed 면 fetch 없이 즉시 통과.
// (실제 바이트는 HTTP force-cache 에 있고, 이 플래그는 "받아둔 적 있음"을 표시한다.)
// ─────────────────────────────────────────────────────────────────
const WARM_KEY = 'tangobook-warmed-audio-v1';
const WARM_CAP = 4000;

function loadWarmed(): string[] {
  try {
    const raw = localStorage.getItem(WARM_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

const warmed = new Set<string>(loadWarmed());
let warmDirty = false;

function markWarm(token: string): void {
  if (!token || warmed.has(token)) return;
  warmed.add(token);
  warmDirty = true;
}

function persistWarmed(): void {
  if (!warmDirty) return;
  warmDirty = false;
  try {
    // 최근 WARM_CAP 개만 유지 (무한 성장 방지)
    localStorage.setItem(WARM_KEY, JSON.stringify([...warmed].slice(-WARM_CAP)));
  } catch {
    /* quota/disabled — ignore */
  }
}

/**
 * 오디오 URL 을 **실제 재생 가능한 상태까지** 워밍 — `<audio>` 엘리먼트로 로드/디코드.
 *
 * 🔴 `fetch(no-cors)` 로 바이트만 받으면 R2 pub 의 opaque 응답이 `<audio>` 재생에 재사용되지
 *    않아 첫 발음이 여전히 늦다(게임마다 "첫 단어 음원 늦음" 원인). Audio 엘리먼트로 `load()`
 *    → `canplaythrough`/`loadeddata` 까지 기다리면 미디어 캐시에 확실히 적재돼 다음 `new Audio`
 *    재생이 즉시. 엘리먼트는 이벤트 리스너 클로저가 완료까지 참조를 잡아 GC 로 abort 되지 않는다.
 */
export function warmAudioUrl(url: string): Promise<void> {
  return new Promise<void>((resolve) => {
    try {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.muted = true;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        audio.removeEventListener('canplaythrough', finish);
        audio.removeEventListener('loadeddata', finish);
        audio.removeEventListener('error', finish);
        resolve();
      };
      audio.addEventListener('canplaythrough', finish, { once: true });
      audio.addEventListener('loadeddata', finish, { once: true });
      audio.addEventListener('error', finish, { once: true });
      // 일부 브라우저 이벤트 미발동 대비 상한
      setTimeout(finish, 4000);
      audio.src = url;
      audio.load();
    } catch {
      resolve();
    }
  });
}

/**
 * 이미지 URL 을 디코드 완료까지 워밍. 진행률 카운트를 위해 완료를 Promise 로 반환.
 * onload/onerror 둘 다 resolve(막지 않음) + 4초 상한.
 */
export function warmImageUrl(url: string): Promise<void> {
  return new Promise<void>((resolve) => {
    if (!url) return resolve();
    try {
      const img = new Image();
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };
      img.onload = finish;
      img.onerror = finish;
      setTimeout(finish, 4000);
      img.src = url;
    } catch {
      resolve();
    }
  });
}

/**
 * 게임 시작 시 이번 판 이미지 전부 워밍 — 라운드 진입 순간의 로드 지연 방지.
 * (단어 이미지는 수백 KB 급이라 온디맨드 로드 시 눈에 띄게 늦게 뜸 — 2026-07-03)
 */
export function usePreloadImages(urls: Array<string | undefined>) {
  const key = urls.filter(Boolean).join('|');
  useEffect(() => {
    if (!key) return;
    const imgs: HTMLImageElement[] = [];
    for (const u of key.split('|')) {
      const img = new Image();
      img.src = u;
      imgs.push(img);
    }
    return () => {
      for (const img of imgs) img.src = '';
    };
  }, [key]);
}

interface PrewarmItem {
  text: string;
  directUrl?: string;
}

/**
 * 정답 순간의 단어 TTS 지연 방지 — 마운트 시 이번 판 단어들을 순차로 미리 resolve.
 * 한글은 서버 concat(음절 합성→R2 업로드)이 처음엔 느려서, 정답 때가 아니라 지금 만들어 둔다.
 * 결과 URL 은 no-cors 프리페치로 HTTP 캐시에도 적재.
 *
 * 반환 `ready` = 프리워밍 완료(또는 이미 warmed 라 즉시). 게임 시작 로딩 게이트에 사용.
 * **이미 워밍한 단어 세트면 게이트 없이 즉시 ready=true** (재진입 시 로딩 반복 X).
 *
 * ⚠️ identifierPrefix 는 정답 시 resolveTtsUrl 호출과 **동일해야** 서버 캐시 키가 일치한다.
 */
export function usePrewarmWordTts(
  items: PrewarmItem[],
  language: 'korean' | 'english',
  storybookId: string | undefined,
  identifierPrefix: string
): { ready: boolean } {
  const tokens = items.map(
    (i) => `tts|${identifierPrefix}|${storybookId ?? ''}|${i.text}|${i.directUrl ?? ''}`
  );
  const key = tokens.join('|');
  const [ready, setReady] = useState(!storybookId || items.length === 0);

  useEffect(() => {
    if (!storybookId || items.length === 0) {
      setReady(true);
      return;
    }
    setReady(false);
    let alive = true;
    const cap = setTimeout(() => {
      if (alive) setReady(true);
    }, PREWARM_MAX_MS);
    void (async () => {
      // 🔴 warmed 플래그로 스킵하지 않는다 — 플래그는 영구지만 실제 캐시는 evict 가능(false-positive).
      //    항상 resolve+warm 하되, cache-control 덕에 진짜 캐시된 URL 은 즉시 통과(concat 서버도 캐시).
      for (let i = 0; i < items.length; i++) {
        if (!alive) return;
        const it = items[i];
        const token = tokens[i];
        try {
          const url = await resolveTtsUrl({
            text: it.text,
            language,
            storybookId,
            directUrl: it.directUrl,
            identifierPrefix,
          });
          if (alive && url) {
            await warmAudioUrl(url); // 바이트 fetch 아닌 실제 오디오 디코드 워밍 (첫 발음 즉시)
          }
          markWarm(token);
        } catch {
          // best-effort — 실패해도 정답 시 원래 경로로 resolve
        }
      }
      if (alive) {
        clearTimeout(cap);
        persistWarmed();
        setReady(true);
      }
    })();
    return () => {
      alive = false;
      clearTimeout(cap);
    };
    // deps: key 가 items 내용을 대변 (배열 identity 대신 내용 기준 재실행)
  }, [key, language, storybookId, identifierPrefix]);
  return { ready };
}

/**
 * 미리 정해진 URL 목록(예: 이번 판 음절 mp3)을 프리페치하고 완료 여부를 반환하는 게이트.
 * enabled=false 동안엔 대기(예: phonics 맵 로딩 중). 상한 타이머로 무한 대기 방지.
 * **이미 warmed 된 URL 만 있으면 즉시 ready=true** (재진입 시 로딩 반복 X).
 */
export function usePrefetchUrlsGate(urls: string[], enabled: boolean): { ready: boolean } {
  const key = urls.join('|');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setReady(false);
      return;
    }
    if (urls.length === 0) {
      setReady(true);
      return;
    }
    setReady(false);
    let alive = true;
    const cap = setTimeout(() => {
      if (alive) setReady(true);
    }, PREWARM_MAX_MS);
    // 🔴 warmed 플래그로 스킵하지 않는다 — 플래그는 localStorage 영구지만 실제 브라우저/엣지 캐시는
    //    evict 될 수 있어 "warmed=있음"이 false-positive(그 음절 재생 시 cold 다운로드 ~500ms). 항상
    //    실제 로드로 워밍하되, cache-control(immutable) 덕에 진짜 캐시된 건 canplaythrough 즉시 통과.
    void Promise.all(urls.map((u) => warmAudioUrl(u).then(() => markWarm(u)))).then(() => {
      if (alive) {
        clearTimeout(cap);
        persistWarmed();
        setReady(true);
      }
    });
    return () => {
      alive = false;
      clearTimeout(cap);
    };
  }, [key, enabled]);
  return { ready };
}
