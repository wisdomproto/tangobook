import { useRef, useCallback, useEffect, useState } from 'react';
import { LANG_TO_SYSTEM_SOUND, type Lang } from '@tangobook/shared';
import { settingsApi } from '@/features/settings/api/settings.api';
import { getSharedAudio } from '@/lib/audio-unlock';
import { useGameSound } from './useGameSound';

export interface CorrectSequenceOpts {
  ttsUrl?: string;
  systemSounds?: { correctUrl?: string; incorrectUrl?: string };
  /** 지정 시 해당 언어(ko/en/vi/zh/th) 칭찬 음원만 랜덤 선택. 생략/풀 없으면 전체 pool 사용. */
  language?: Lang;
  onDone?: () => void;
}

// 진행 중인 재생의 finish — 요소가 하나라 체인도 하나다(훅 인스턴스가 여럿이어도 공용).
let currentFinish: (() => void) | null = null;

/** 게임 공통 오디오 훅 — TTS 재생 + 정답/오답 효과음 + 칭찬 시퀀스 */
export function useGameAudio() {
  const { playCorrect, playIncorrect } = useGameSound();

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
    // 🔴 **요소 하나를 재사용한다**(2026-09-16). 예전엔 소리마다 `new Audio(url)` 였는데, iOS
    //    Safari 는 재생 권한을 요소 단위로 주기 때문에 그 요소는 영영 안 풀린다(→ lib/audio-unlock).
    //    공용 요소라 화면 여럿이 동시에 소리를 내진 못한다 — 어차피 이전 소리를 끊던 동작이라 같다.
    const audio = getSharedAudio();
    const gen = genRef.current;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (currentFinish === finish) currentFinish = null;
      // 🔴 stopAll() 이후 취소된 재생이면 onEnded(체인의 다음 소리)를 부르지 않는다.
      if (gen !== genRef.current) return;
      onEnded?.();
    };
    // 끼어들기로 끝난 옛 재생의 체인을 닫아 준다 — 요소가 따로였을 땐 `src=''` 가 띄우는 'error'
    // 가 대신 해 줬다(안 닫으면 그 화면의 onEnded 를 기다리던 진행이 멈춘다). 새 재생이 먼저
    // 걸리도록 마이크로태스크로 미룬다.
    const prev = currentFinish;
    currentFinish = finish;
    if (prev) queueMicrotask(prev);

    audio.pause();
    // 🔴 addEventListener 가 아니라 **대입** — 재사용 요소라 리스너가 쌓이면 옛 체인이 같이 운다.
    audio.onended = finish;
    audio.onerror = finish;
    audio.src = url;
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
    currentFinish = null;
    try {
      getSharedAudio().pause();
    } catch {
      /* ignore */
    }
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

  // 언마운트 시 재생 중 소리 + 예약 타이머 정리.
  useEffect(() => {
    return () => {
      pendingTimersRef.current.forEach((id) => clearTimeout(id));
      pendingTimersRef.current.clear();
      currentFinish = null;
      try {
        getSharedAudio().pause();
      } catch {
        /* ignore */
      }
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
