import { useRef, useCallback, useEffect, useState } from 'react';
import { LANG_TO_SYSTEM_SOUND, type Lang } from '@tangobook/shared';
import { settingsApi } from '@/features/settings/api/settings.api';
import { useGameSound } from './useGameSound';

export interface CorrectSequenceOpts {
  ttsUrl?: string;
  systemSounds?: { correctUrl?: string; incorrectUrl?: string };
  /** 지정 시 해당 언어(ko/en/vi/zh/th) 칭찬 음원만 랜덤 선택. 생략/풀 없으면 전체 pool 사용. */
  language?: Lang;
  onDone?: () => void;
}

/** 게임 공통 오디오 훅 — TTS 재생 + 정답/오답 효과음 + 칭찬 시퀀스 */
export function useGameAudio() {
  const { playCorrect, playIncorrect } = useGameSound();

  const lastAudioRef = useRef<HTMLAudioElement | null>(null);
  // playAudio가 생성한 모든 Audio 인스턴스 (언마운트 시 전부 pause).
  // `new Audio()`는 DOM에 부착되지 않은 detached MediaElement라 ref 놓치면 GC 시까지 재생 계속됨.
  const allAudiosRef = useRef<Set<HTMLAudioElement>>(new Set());
  // playCorrectSequence 내부 setTimeout 들을 모아 언마운트 시 clearTimeout
  const pendingTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  // 언어별 칭찬 음원 풀 (SystemSoundLanguage → url[]). 플레이어가 language 지정 시 해당 pool만.
  const [correctPools, setCorrectPools] = useState<Record<string, string[]>>({});
  // 🔴 세대 토큰 — `stopAll()` 이 올리면 진행 중이던 재생 체인의 onEnded 가 다음 걸 트리거하지 않는다.
  //    (오디오를 pause/src='' 하면 'error'→finish 가 도는데, 그때 세대가 어긋나면 콜백을 안 부른다.)
  const genRef = useRef(0);

  // 시스템 칭찬 음원 라이브러리 자동 로드
  useEffect(() => {
    settingsApi
      .getSystemSounds()
      .then((data) => {
        const pools: Record<string, string[]> = {};
        for (const [lang, group] of Object.entries(data)) {
          pools[lang] = (group?.correct ?? []).map((s) => s.url);
        }
        setCorrectPools(pools);
      })
      .catch(() => {});
  }, []);

  const playAudio = useCallback((url?: string, onEnded?: () => void) => {
    if (!url) {
      onEnded?.();
      return;
    }
    // 이전 오디오 정지 후 새 인스턴스로 재생 (autoplay 정책 회피)
    if (lastAudioRef.current) {
      lastAudioRef.current.pause();
      lastAudioRef.current.src = '';
      lastAudioRef.current = null;
    }
    const audio = new Audio(url);
    allAudiosRef.current.add(audio);
    const gen = genRef.current;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      allAudiosRef.current.delete(audio);
      // 🔴 stopAll() 이후 취소된 재생이면 onEnded(체인의 다음 소리)를 부르지 않는다.
      if (gen !== genRef.current) return;
      onEnded?.();
    };
    audio.addEventListener('ended', finish);
    audio.addEventListener('error', finish);
    lastAudioRef.current = audio;
    audio.play().catch(finish);
  }, []);

  // 기존 WebAudio 톤 합성 제거 → useGameSound에 위임
  const playFeedbackSound = useCallback(
    (correct: boolean) => {
      if (correct) playCorrect();
      else playIncorrect();
    },
    [playCorrect, playIncorrect]
  );

  // 칭찬 애니메이션 오버레이 상태
  const [praiseVisible, setPraiseVisible] = useState(false);

  /**
   * 🔴 진행 중인 **모든 재생·예약을 즉시 비운다**(2026-08-06 사용자: 빠르게 누르면 소리가 큐에 쌓이는데
   *    「다음」을 누르면 다음 장은 처음부터 시작하게). 세대를 올려 진행 중 체인의 onEnded 를 무효화하고
   *    (오디오 pause 시 'error'→finish 가 다음 걸 트리거하는 함정 회피), 예약 타이머·오디오를 다 지운다.
   */
  const stopAll = useCallback(() => {
    genRef.current++;
    pendingTimersRef.current.forEach((id) => clearTimeout(id));
    pendingTimersRef.current.clear();
    allAudiosRef.current.forEach((a) => {
      try {
        a.pause();
        a.src = '';
        a.load();
      } catch {
        /* ignore */
      }
    });
    allAudiosRef.current.clear();
    lastAudioRef.current = null;
    setPraiseVisible(false);
  }, []);

  const scheduleTimer = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      pendingTimersRef.current.delete(id);
      fn();
    }, ms);
    pendingTimersRef.current.add(id);
    return id;
  }, []);

  /**
   * 단어 한 개 정답 — 효과음 → TTS(선택, 끝까지 재생) → onDone. 호리/칭찬음원 X (4-5세 부담 ↓).
   * 사용자 정책 (2026-05-10): 단어 1개 맞출 때는 호리/칭찬 X, 모든 단어 맞으면 GameResultScreen 호리.
   */
  const playWordCorrect = useCallback(
    (opts?: { ttsUrl?: string; onDone?: () => void }) => {
      playFeedbackSound(true);
      scheduleTimer(() => {
        if (opts?.ttsUrl) {
          playAudio(opts.ttsUrl, () => opts.onDone?.());
        } else {
          opts?.onDone?.();
        }
      }, 500);
    },
    [playFeedbackSound, playAudio, scheduleTimer]
  );

  /** 정답 시퀀스: 효과음 → 칭찬 애니메이션 → TTS (단어 끝까지) → 시스템 칭찬 (끝까지) → onDone.
   * 단어/칭찬 TTS 의 실제 'ended' 이벤트를 기다려 chain — 단어 길이에 관계없이 잘리지 않음. */
  const playCorrectSequence = useCallback(
    (opts?: CorrectSequenceOpts) => {
      playFeedbackSound(true);
      setPraiseVisible(true);

      // 시스템 칭찬 음원: props로 전달된 URL 우선, 없으면 라이브러리에서 랜덤 선택.
      // language 지정 시 해당 언어(ko/en/vi/zh/th) pool만. 비어있으면 전체 pool 로 fallback.
      const allUrls = Object.values(correctPools).flat();
      const ssLang = opts?.language ? LANG_TO_SYSTEM_SOUND[opts.language] : undefined;
      const langPool = ssLang ? (correctPools[ssLang] ?? []) : [];
      const pool = langPool.length > 0 ? langPool : allUrls;
      const correctUrl =
        opts?.systemSounds?.correctUrl ||
        (pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : undefined);

      const finishSequence = () => {
        setPraiseVisible(false);
        opts?.onDone?.();
      };
      const playPraise = () => {
        if (correctUrl) {
          playAudio(correctUrl, finishSequence);
        } else {
          // 음원이 없어도 잠깐 칭찬 오버레이 유지 후 종료
          scheduleTimer(finishSequence, 400);
        }
      };

      // 효과음 → 0.5s 갭 → 단어 TTS (끝까지) → 시스템 칭찬 (끝까지) → onDone
      scheduleTimer(() => {
        if (opts?.ttsUrl) {
          playAudio(opts.ttsUrl, playPraise);
        } else {
          playPraise();
        }
      }, 500);
    },
    [playFeedbackSound, playAudio, correctPools, scheduleTimer]
  );

  // 언마운트 시 재생 중 오디오 + 예약 타이머 모두 정리.
  // 떠돌이 Audio(이미 play().then 전 상태 포함) 모두 stop.
  useEffect(() => {
    return () => {
      pendingTimersRef.current.forEach((id) => clearTimeout(id));
      pendingTimersRef.current.clear();
      allAudiosRef.current.forEach((a) => {
        try {
          a.pause();
          a.src = '';
          a.load();
        } catch {
          /* ignore */
        }
      });
      allAudiosRef.current.clear();
      lastAudioRef.current = null;
    };
  }, []);

  return {
    playAudio,
    playFeedbackSound,
    playWordCorrect,
    playCorrectSequence,
    praiseVisible,
    /** 언마운트 시 자동 정리되는 setTimeout — 오디오 사이 의도적 '쉬는' 간격 등에 사용. */
    scheduleTimer,
    /** 진행 중인 재생·예약을 즉시 비운다(장 전환 시). */
    stopAll,
  };
}
