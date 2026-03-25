import { useEffect, useState, useRef } from 'react';
import type { AudiobookRenderData } from '@tangobook/shared';

/**
 * Probe TTS durations for audiobook slides using HTMLAudioElement.
 * Returns a new renderData with ttsDuration populated for each slide.
 */
export function useTtsDurations(renderData: AudiobookRenderData): AudiobookRenderData {
  const [durations, setDurations] = useState<Map<string, number>>(new Map());
  const probedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const ttsUrls = renderData.slides
      .map((s) => s.ttsUrl)
      .filter((url): url is string => !!url && !probedRef.current.has(url));

    if (ttsUrls.length === 0) return;

    let cancelled = false;

    async function probeAll() {
      const newDurations = new Map(durations);

      for (const url of ttsUrls) {
        if (cancelled) break;
        try {
          const duration = await getAudioDurationInBrowser(url);
          newDurations.set(url, duration);
          probedRef.current.add(url);
        } catch {
          // Failed to probe, will use default 3s
          probedRef.current.add(url);
        }
      }

      if (!cancelled) {
        setDurations(new Map(newDurations));
      }
    }

    probeAll();

    return () => {
      cancelled = true;
    };
  }, [renderData.slides.map((s) => s.ttsUrl).join(',')]);

  // Apply probed durations to slides
  return {
    ...renderData,
    slides: renderData.slides.map((slide) => ({
      ...slide,
      ttsDuration: slide.ttsUrl
        ? (durations.get(slide.ttsUrl) ?? slide.ttsDuration)
        : slide.ttsDuration,
    })),
  };
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
