import { useRef, useState, useCallback, useEffect } from 'react';

interface UseAudioPlayerOptions {
  backgroundMusicUrl?: string;
  onTtsEnded?: () => void;
}

export function useAudioPlayer({ backgroundMusicUrl, onTtsEnded }: UseAudioPlayerOptions) {
  const ttsRef = useRef<HTMLAudioElement | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);

  // Initialize BGM audio element
  useEffect(() => {
    if (!backgroundMusicUrl) return;
    const audio = new Audio(backgroundMusicUrl);
    audio.loop = true;
    audio.volume = 0.3;
    bgmRef.current = audio;
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [backgroundMusicUrl]);

  const onTtsEndedRef = useRef(onTtsEnded);
  onTtsEndedRef.current = onTtsEnded;

  const playTts = useCallback((url: string) => {
    // Stop previous TTS
    if (ttsRef.current) {
      ttsRef.current.pause();
      ttsRef.current.src = '';
    }
    const audio = new Audio(url);
    ttsRef.current = audio;
    setIsTtsPlaying(true);
    audio.addEventListener('ended', () => {
      setIsTtsPlaying(false);
      onTtsEndedRef.current?.();
    });
    audio.addEventListener('error', () => setIsTtsPlaying(false));
    audio.play().catch(() => setIsTtsPlaying(false));
  }, []);

  const stopTts = useCallback(() => {
    if (ttsRef.current) {
      ttsRef.current.pause();
      ttsRef.current.currentTime = 0;
      setIsTtsPlaying(false);
    }
  }, []);

  const toggleBgm = useCallback(() => {
    const audio = bgmRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
      setIsBgmPlaying(true);
    } else {
      audio.pause();
      setIsBgmPlaying(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ttsRef.current) {
        ttsRef.current.pause();
        ttsRef.current.src = '';
        ttsRef.current = null;
      }
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current.src = '';
        bgmRef.current = null;
      }
    };
  }, []);

  return { playTts, stopTts, isTtsPlaying, toggleBgm, isBgmPlaying };
}
