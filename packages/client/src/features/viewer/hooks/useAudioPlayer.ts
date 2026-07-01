import { useRef, useState, useCallback, useEffect } from 'react';

interface UseAudioPlayerOptions {
  backgroundMusicUrl?: string;
  /** 배경음악 볼륨 (0–100%, 기본 30). 기본설정에서 책별로 조절. */
  backgroundMusicVolume?: number;
  onTtsEnded?: () => void;
}

export function useAudioPlayer({
  backgroundMusicUrl,
  backgroundMusicVolume,
  onTtsEnded,
}: UseAudioPlayerOptions) {
  const ttsRef = useRef<HTMLAudioElement | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  // TTS 프리로드 풀: url → 미리 버퍼링된 Audio 객체. playTts 가 이 풀의 객체를 재사용한다
  // (HTTP 캐시가 아니라 Audio 객체 자체가 버퍼를 들고 있어 첫 재생이 즉시 시작됨).
  const preloadPoolRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  // 현재 재생에 붙인 이벤트 리스너를 한 번에 떼기 위한 컨트롤러 (풀 객체 재사용 시 누수 방지).
  const playCtrlRef = useRef<AbortController | null>(null);
  // TTS 재생 속도 (ref — state 로 하면 stale closure 문제 + 불필요한 리렌더 발생).
  const rateRef = useRef<number>(1);

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
    audio.preload = 'auto'; // 시작 화면 동안 미리 버퍼링 → 탭 시 즉시 재생(늦게 나오는 것 방지)
    audio.volume = (backgroundMusicVolume ?? 30) / 100;
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

  // 볼륨 변경 시 재생 중인 BGM 에 즉시 반영 (오디오 재생성 없이).
  useEffect(() => {
    if (bgmRef.current) bgmRef.current.volume = (backgroundMusicVolume ?? 30) / 100;
  }, [backgroundMusicVolume]);

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

    // 재생 속도 적용 — 풀 객체 재사용/프리로드 객체 모두 play() 직전에 설정.
    audio.playbackRate = rateRef.current;
    // 재생 성공 여부를 반환 — autoplay 정책으로 막히면 false. 일부 브라우저는 reject 없이
    // resolve 후 곧바로 paused 가 되므로 !paused 로 실제 시작 여부를 확인한다.
    return audio.play().then(
      () => !audio.paused,
      (err) => {
        console.warn('[tts] play() rejected (autoplay policy?):', err);
        setIsTtsPlaying(false);
        return false;
      }
    );
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

  /**
   * 주어진 url 들의 TTS 가 재생 시작 가능할 만큼 버퍼링될 때까지 대기 (뷰어 로딩 화면에서 사용).
   * 풀의 Audio 가 canplaythrough(readyState 4) 되면 resolve, timeoutMs 로 상한(느린 네트워크 대비).
   */
  const waitForTts = useCallback((urls: string[], timeoutMs = 6000): Promise<void> => {
    const pool = preloadPoolRef.current;
    const audios = urls.map((u) => pool.get(u)).filter((a): a is HTMLAudioElement => !!a);
    if (audios.length === 0) return Promise.resolve();
    const ready = Promise.all(
      audios.map(
        (a) =>
          new Promise<void>((res) => {
            if (a.readyState >= 3) return res(); // HAVE_FUTURE_DATA — 재생 시작 가능
            const done = () => res();
            a.addEventListener('canplay', done, { once: true });
            a.addEventListener('canplaythrough', done, { once: true });
            a.addEventListener('error', done, { once: true });
          })
      )
    ).then(() => undefined);
    return Promise.race([ready, new Promise<void>((res) => setTimeout(res, timeoutMs))]);
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

  /**
   * TTS 재생 속도 변경. 현재 재생 중인 TTS 에도 즉시 반영.
   * BGM 은 영향받지 않음.
   */
  const setPlaybackRate = useCallback((rate: number) => {
    rateRef.current = rate;
    if (ttsRef.current) ttsRef.current.playbackRate = rate;
  }, []);

  const toggleBgm = useCallback(() => {
    const audio = bgmRef.current;
    if (!audio) return;
    if (audio.paused) {
      // play() 성공 시에만 ON 표시 — 차단/로드 실패 시 버튼이 켜진 척하지 않게
      audio
        .play()
        .then(() => setIsBgmPlaying(!audio.paused))
        .catch(() => setIsBgmPlaying(false));
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
    waitForTts,
    stopTts,
    pauseTts,
    resumeTts,
    setPlaybackRate,
    isTtsPlaying,
    ttsCurrentTime,
    ttsDuration,
    toggleBgm,
    isBgmPlaying,
  };
}
