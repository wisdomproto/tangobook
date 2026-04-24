import { useEffect, useState } from 'react';
import type { AudiobookRenderData } from '@tangobook/shared';

/**
 * URL → duration(초). 0 은 "probe 실패" sentinel.
 * 컴포넌트 re-mount에도 유지되도록 모듈 레벨 Map에 캐시.
 */
const durationCache = new Map<string, number>();

function getCachedOrProbe(url: string): Promise<number> {
  const cached = durationCache.get(url);
  if (cached !== undefined) return Promise.resolve(cached);
  return getAudioDurationInBrowser(url)
    .then((d) => {
      durationCache.set(url, d);
      return d;
    })
    .catch(() => {
      durationCache.set(url, 0); // sentinel: probe 실패
      return 0;
    });
}

/**
 * Probe TTS durations for audiobook slides using HTMLAudioElement.
 * Returns a new renderData with ttsDuration populated + loading state.
 *
 * `loading`은 state에서 파생 — 현재 렌더의 ttsUrl 중 캐시에 없는 URL이 있으면 true.
 * 이렇게 하면 재마운트되거나 effect가 취소돼도 stuck loading이 발생하지 않음.
 */
export function useTtsDurations(renderData: AudiobookRenderData): {
  data: AudiobookRenderData;
  loading: boolean;
} {
  // 캐시 히트 상태 스냅샷 (변경 감지용 tick). probe 완료 시 증가시켜 re-render 트리거.
  const [, setTick] = useState(0);
  const [bgmDuration, setBgmDuration] = useState<number | undefined>(undefined);

  const ttsUrls = renderData.slides.map((s) => s.ttsUrl).filter((url): url is string => !!url);
  const ttsKey = ttsUrls.join(',');

  useEffect(() => {
    const pending = ttsUrls.filter((url) => !durationCache.has(url));
    if (pending.length === 0) return;

    let cancelled = false;
    Promise.all(pending.map((url) => getCachedOrProbe(url))).then(() => {
      if (!cancelled) setTick((n) => n + 1);
    });

    return () => {
      cancelled = true;
    };
  }, [ttsKey]);

  // BGM duration — 별도 캐시
  const bgmUrl = renderData.bgmUrl;
  useEffect(() => {
    if (!bgmUrl) {
      setBgmDuration(undefined);
      return;
    }
    const cached = durationCache.get(bgmUrl);
    if (cached !== undefined && cached > 0) {
      setBgmDuration(cached);
      return;
    }
    let cancelled = false;
    getCachedOrProbe(bgmUrl).then((d) => {
      if (!cancelled) setBgmDuration(d > 0 ? d : undefined);
    });
    return () => {
      cancelled = true;
    };
  }, [bgmUrl]);

  // loading은 state에서 파생: 현재 ttsUrl 중 캐시에 없는 게 하나라도 있으면 true.
  const loading = ttsUrls.some((url) => !durationCache.has(url));

  // Apply probed durations to slides (캐시에 0이면 기존 ttsDuration 유지)
  const data: AudiobookRenderData = {
    ...renderData,
    bgmDuration,
    slides: renderData.slides.map((slide) => {
      if (!slide.ttsUrl) return slide;
      const cached = durationCache.get(slide.ttsUrl);
      const probed = cached !== undefined && cached > 0 ? cached : undefined;
      return {
        ...slide,
        ttsDuration: probed ?? slide.ttsDuration,
      };
    }),
  };

  return { data, loading };
}

function getAudioDurationInBrowser(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = 'metadata';

    const cleanup = () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('error', onError);
      audio.src = '';
    };

    const onLoaded = () => {
      const duration = audio.duration;
      cleanup();
      if (isFinite(duration) && duration > 0) {
        resolve(duration);
      } else {
        reject(new Error('Invalid duration'));
      }
    };

    const onError = () => {
      cleanup();
      reject(new Error('Failed to load audio'));
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('error', onError);
    audio.src = url;
  });
}
