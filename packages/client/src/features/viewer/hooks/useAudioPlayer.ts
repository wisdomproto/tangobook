import { useRef, useState, useCallback, useEffect } from 'react';

interface UseAudioPlayerOptions {
  backgroundMusicUrl?: string;
  onTtsEnded?: () => void;
}

export function useAudioPlayer({ backgroundMusicUrl, onTtsEnded }: UseAudioPlayerOptions) {
  const ttsRef = useRef<HTMLAudioElement | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  // TTS 프리로드 풀: url → 미리 버퍼링된 Audio 객체. playTts 가 이 풀의 객체를 재사용한다
  // (HTTP 캐시가 아니라 Audio 객체 자체가 버퍼를 들고 있어 첫 재생이 즉시 시작됨).
  const preloadPoolRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  // 현재 재생에 붙인 이벤트 리스너를 한 번에 떼기 위한 컨트롤러 (풀 객체 재사용 시 누수 방지).
  const playCtrlRef = useRef<AbortController | null>(null);

  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const [ttsCurrentTime, setTtsCurrentTime] = useState(0);
  const [ttsDuration, setTtsDuration] = useState(0);

  // Initialize BGM audio element + try autoplay (default ON).
  // iOS Safari 등 autoplay 차단 환경에선 조용히 실패하고 사용자 탭으로 켜짐.
  useEffect(() => {
    if (!backgroundMusicUrl) return;
    const audio = new Audio(backgroundMusicUrl);
    audio.loop = true;
    audio.volume = 0.3;
    bgmRef.current = audio;
    audio
      .play()
      .then(() => setIsBgmPlaying(true))
      .catch(() => setIsBgmPlaying(false));
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [backgroundMusicUrl]);

  const onTtsEndedRef = useRef(onTtsEnded);
  onTtsEndedRef.current = onTtsEnded;

  const playTts = useCallback((url: string) => {
    const pool = preloadPoolRef.current;
    // 이전 재생의 리스너 제거 + 정지. 풀 객체는 src 를 비우지 않고 보존(재사용).
    playCtrlRef.current?.abort();
    const prev = ttsRef.current;
    if (prev) {
      prev.pause();
      const prevInPool = [...pool.values()].includes(prev);
      if (!prevInPool) prev.src = '';
    }

    // 프리로드 풀에 버퍼링된 객체가 있으면 재사용(즉시 재생), 없으면 새로 생성.
    const audio = pool.get(url) ?? new Audio(url);
    ttsRef.current = audio;
    audio.currentTime = 0;
    setTtsCurrentTime(0);
    // 프리로드로 메타데이터가 이미 로드됐으면 duration 즉시 반영(loadedmetadata 가 이미 지나 안 불릴 수 있음).
    const known = audio.duration;
    setTtsDuration(isFinite(known) && known > 0 ? known : 0);
    setIsTtsPlaying(true);

    const ctrl = new AbortController();
    playCtrlRef.current = ctrl;
    const opt = { signal: ctrl.signal };

    const updateDuration = () => {
      const d = audio.duration;
      if (isFinite(d) && d > 0) setTtsDuration(d);
    };
    audio.addEventListener('loadedmetadata', updateDuration, opt);
    audio.addEventListener('durationchange', updateDuration, opt);
    audio.addEventListener(
      'timeupdate',
      () => {
        setTtsCurrentTime(audio.currentTime);
      },
      opt
    );
    audio.addEventListener(
      'ended',
      () => {
        setIsTtsPlaying(false);
        setTtsCurrentTime(audio.duration || 0);
        onTtsEndedRef.current?.();
      },
      opt
    );
    audio.addEventListener(
      'error',
      (e) => {
        console.warn('[tts] audio error', e);
        setIsTtsPlaying(false);
      },
      opt
    );

    audio.play().catch((err) => {
      console.warn('[tts] play() rejected (autoplay policy?):', err);
      setIsTtsPlaying(false);
    });
  }, []);

  /**
   * 다가올 페이지의 TTS 를 미리 버퍼링한다 (현재 페이지 포함).
   * url 별 Audio 객체를 풀에 보관 → playTts 가 같은 url 로 호출될 때 재사용해 즉시 재생.
   * 전달된 url 집합에 없는 오래된 항목은 정리(현재 재생 중인 객체는 보존).
   */
  const preloadTts = useCallback((urls: (string | undefined)[]) => {
    const pool = preloadPoolRef.current;
    const keep = new Set(urls.filter((u): u is string => !!u));
    for (const url of keep) {
      if (pool.has(url)) continue;
      const a = new Audio();
      a.preload = 'auto';
      a.src = url;
      pool.set(url, a);
    }
    const current = ttsRef.current;
    for (const [url, a] of pool) {
      if (!keep.has(url) && a !== current) {
        a.src = '';
        pool.delete(url);
      }
    }
  }, []);

  /** 처음으로 reset + pause (페이지 unmount, HOME 이동 등) */
  const stopTts = useCallback(() => {
    if (ttsRef.current) {
      ttsRef.current.pause();
      ttsRef.current.currentTime = 0;
      setIsTtsPlaying(false);
    }
  }, []);

  /** 현재 위치에서 일시정지 (재생 위치 유지) — 자동재생 토글 OFF 용 */
  const pauseTts = useCallback(() => {
    if (ttsRef.current) {
      ttsRef.current.pause();
      setIsTtsPlaying(false);
    }
  }, []);

  /** 일시정지 상태에서 이어재생 — 새 src 로 시작이 아니라 현재 currentTime 부터 */
  const resumeTts = useCallback(() => {
    if (ttsRef.current) {
      ttsRef.current.play().catch(() => {});
      setIsTtsPlaying(true);
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
    const pool = preloadPoolRef.current;
    return () => {
      playCtrlRef.current?.abort();
      if (ttsRef.current) {
        ttsRef.current.pause();
        ttsRef.current.src = '';
        ttsRef.current = null;
      }
      pool.forEach((a) => {
        a.src = '';
      });
      pool.clear();
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current.src = '';
        bgmRef.current = null;
      }
    };
  }, []);

  return {
    playTts,
    preloadTts,
    stopTts,
    pauseTts,
    resumeTts,
    isTtsPlaying,
    ttsCurrentTime,
    ttsDuration,
    toggleBgm,
    isBgmPlaying,
  };
}
