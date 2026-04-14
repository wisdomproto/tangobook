import { useEffect, useState, useRef } from 'react';
import type { AudiobookRenderData } from '@tangobook/shared';

/**
 * Probe TTS durations for audiobook slides using HTMLAudioElement.
 * Returns a new renderData with ttsDuration populated + loading state.
 */
export function useTtsDurations(renderData: AudiobookRenderData): {
  data: AudiobookRenderData;
  loading: boolean;
} {
  const [durations, setDurations] = useState<Record<string, number>>({});
  const [bgmDuration, setBgmDuration] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const probedRef = useRef<Set<string>>(new Set());
  const durationsRef = useRef<Record<string, number>>({});

  const ttsKey = renderData.slides.map((s) => s.ttsUrl || '').join(',');

  useEffect(() => {
    const ttsUrls = renderData.slides
      .map((s) => s.ttsUrl)
      .filter((url): url is string => !!url && !probedRef.current.has(url));

    if (ttsUrls.length === 0) {
      console.log('[useTtsDurations] No new TTS URLs to probe');
      return;
    }

    let cancelled = false;
    setLoading(true);
    console.log('[useTtsDurations] Probing', ttsUrls.length, 'TTS URLs');

    async function probeAll() {
      await Promise.all(
        ttsUrls.map(async (url) => {
          try {
            const duration = await getAudioDurationInBrowser(url);
            durationsRef.current[url] = duration;
          } catch (err) {
            console.warn('[useTtsDurations] Failed to probe:', url.slice(-30), err);
          } finally {
            probedRef.current.add(url);
          }
        })
      );

      if (!cancelled) {
        setDurations({ ...durationsRef.current });
        setLoading(false);
      }
    }

    probeAll();

    return () => {
      cancelled = true;
    };
  }, [ttsKey]);

  // Probe BGM duration
  const bgmUrl = renderData.bgmUrl;
  useEffect(() => {
    if (!bgmUrl) {
      setBgmDuration(undefined);
      return;
    }
    let cancelled = false;
    getAudioDurationInBrowser(bgmUrl)
      .then((d) => {
        if (!cancelled) setBgmDuration(d);
      })
      .catch(() => {
        if (!cancelled) setBgmDuration(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [bgmUrl]);

  // Apply probed durations to slides
  const data: AudiobookRenderData = {
    ...renderData,
    bgmDuration,
    slides: renderData.slides.map((slide) => ({
      ...slide,
      ttsDuration: slide.ttsUrl
        ? (durations[slide.ttsUrl] ?? slide.ttsDuration)
        : slide.ttsDuration,
    })),
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
