import { useEffect, useState } from 'react';

export interface AssetPreloadState {
  loaded: number;
  failed: number;
  total: number;
  done: boolean;
}

const AUDIO_EXT_RE = /\.(mp3|m4a|wav|ogg|aac|flac|webm)(?:\?|$)/i;
const VIDEO_EXT_RE = /\.(mp4|mov|webm|mkv)(?:\?|$)/i;

/**
 * 여러 에셋 URL을 병렬로 프리로드하여 브라우저 캐시에 채우고,
 * 로드/실패 진행도를 반환. 이후 렌더되는 `<img>`·`<audio>`·`<video>`는
 * 네트워크 재요청 없이 캐시에서 즉시 사용됨.
 *
 * 주의: `fetch({ mode: 'cors' })`는 R2 같은 CORS 미설정 버킷에서 전부 실패하므로
 * HTMLImageElement / HTMLAudioElement / HTMLVideoElement 로 프리로드한다.
 * 이들은 CORS 체크 없이 opaque 로드가 가능하고, 브라우저 HTTP 캐시에 저장돼
 * 이후 같은 URL 요청을 cache hit로 처리한다.
 *
 * 오디오북/동영상 프리뷰 로딩 게이지 용도.
 */
export function useAssetPreloadProgress(urls: string[]): AssetPreloadState {
  const total = urls.length;
  const [loaded, setLoaded] = useState(0);
  const [failed, setFailed] = useState(0);
  const key = urls.join('|');

  useEffect(() => {
    setLoaded(0);
    setFailed(0);
    if (total === 0) return;

    let cancelled = false;
    const cleanups: Array<() => void> = [];

    const markLoaded = () => {
      if (!cancelled) setLoaded((n) => n + 1);
    };
    const markFailed = () => {
      if (!cancelled) setFailed((n) => n + 1);
    };

    for (const url of urls) {
      if (!url) {
        markFailed();
        continue;
      }

      if (AUDIO_EXT_RE.test(url)) {
        const el = new Audio();
        el.preload = 'auto';
        const onOk = () => {
          cleanup();
          markLoaded();
        };
        const onErr = () => {
          cleanup();
          markFailed();
        };
        const cleanup = () => {
          el.removeEventListener('canplaythrough', onOk);
          el.removeEventListener('loadeddata', onOk);
          el.removeEventListener('error', onErr);
          el.src = '';
        };
        el.addEventListener('canplaythrough', onOk, { once: true });
        el.addEventListener('loadeddata', onOk, { once: true });
        el.addEventListener('error', onErr, { once: true });
        el.src = url;
        cleanups.push(cleanup);
      } else if (VIDEO_EXT_RE.test(url)) {
        const el = document.createElement('video');
        el.preload = 'auto';
        el.muted = true;
        const onOk = () => {
          cleanup();
          markLoaded();
        };
        const onErr = () => {
          cleanup();
          markFailed();
        };
        const cleanup = () => {
          el.removeEventListener('loadeddata', onOk);
          el.removeEventListener('canplaythrough', onOk);
          el.removeEventListener('error', onErr);
          el.src = '';
        };
        el.addEventListener('loadeddata', onOk, { once: true });
        el.addEventListener('canplaythrough', onOk, { once: true });
        el.addEventListener('error', onErr, { once: true });
        el.src = url;
        cleanups.push(cleanup);
      } else {
        // 기본: 이미지로 간주
        const img = new Image();
        const onOk = () => {
          img.onload = null;
          img.onerror = null;
          markLoaded();
        };
        const onErr = () => {
          img.onload = null;
          img.onerror = null;
          markFailed();
        };
        img.onload = onOk;
        img.onerror = onErr;
        img.src = url;
        cleanups.push(() => {
          img.onload = null;
          img.onerror = null;
        });
      }
    }

    return () => {
      cancelled = true;
      for (const cleanup of cleanups) cleanup();
    };
    // urls는 key로 내용을 비교 — 배열 참조 변화만으로는 재실행하지 않음.
  }, [key]);

  return { loaded, failed, total, done: total === 0 || loaded + failed >= total };
}
