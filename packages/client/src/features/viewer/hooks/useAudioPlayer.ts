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
  const [ttsCurrentTime, setTtsCurrentTime] = useState(0);
  const [ttsDuration, setTtsDuration] = useState(0);

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
    setTtsCurrentTime(0);
    setTtsDuration(0);
    setIsTtsPlaying(true);

    const updateDuration = () => {
      const d = audio.duration;

      console.log('[tts] duration:', d, 'src:', url.slice(-40));
      if (isFinite(d) && d > 0) setTtsDuration(d);
    };
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);

    audio.addEventListener('timeupdate', () => {
      setTtsCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsTtsPlaying(false);
      setTtsCurrentTime(audio.duration || 0);
      onTtsEndedRef.current?.();
    });
    audio.addEventListener('error', (e) => {
      console.warn('[tts] audio error', e);
      setIsTtsPlaying(false);
    });

    audio.play().catch((err) => {
      console.warn('[tts] play() rejected (autoplay policy?):', err);
      setIsTtsPlaying(false);
    });
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

  return {
    playTts,
    stopTts,
    isTtsPlaying,
    ttsCurrentTime,
    ttsDuration,
    toggleBgm,
    isBgmPlaying,
  };
}
