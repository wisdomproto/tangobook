import { useEffect, useRef, useState } from 'react';

export interface AssetPreloadState {
  loaded: number;
  failed: number;
  total: number;
  done: boolean;
}

/**
 * 여러 에셋 URL을 병렬로 fetch하여 브라우저 캐시에 채우고,
 * 로드/실패 진행도를 반환. 이후 렌더되는 `<img>`·`<audio>`·`<video>`는
 * 네트워크 재요청 없이 캐시에서 즉시 사용됨.
 *
 * 오디오북/동영상 프리뷰 로딩 게이지 용도.
 */
export function useAssetPreloadProgress(urls: string[]): AssetPreloadState {
  const total = urls.length;
  const [loaded, setLoaded] = useState(0);
  const [failed, setFailed] = useState(0);
  const key = urls.join('|');
  const startedKey = useRef<string | null>(null);

  useEffect(() => {
    if (total === 0) {
      setLoaded(0);
      setFailed(0);
      return;
    }
    if (startedKey.current === key) return;
    startedKey.current = key;
    setLoaded(0);
    setFailed(0);

    let cancelled = false;
    for (const url of urls) {
      (async () => {
        try {
          const res = await fetch(url, { mode: 'cors', cache: 'force-cache' });
          // Body를 한 번 읽어 브라우저 캐시에 완전히 채움
          await res.blob();
          if (!cancelled) setLoaded((n) => n + 1);
        } catch {
          if (!cancelled) setFailed((n) => n + 1);
        }
      })();
    }

    return () => {
      cancelled = true;
    };
  }, [key, total, urls]);

  return { loaded, failed, total, done: total === 0 || loaded + failed >= total };
}
