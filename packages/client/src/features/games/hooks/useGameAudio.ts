import { useRef, useCallback, useEffect, useState } from 'react';
import { settingsApi } from '@/features/settings/api/settings.api';
import { useGameSound } from './useGameSound';

export interface CorrectSequenceOpts {
  ttsUrl?: string;
  systemSounds?: { correctUrl?: string; incorrectUrl?: string };
  /** 'ko' 또는 'en' 지정 시 해당 언어 칭찬 음원만 랜덤 선택. 생략 시 양 언어 pool 모두 사용 */
  language?: 'ko' | 'en';
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
  // 언어별 분리 저장. 플레이어가 language 지정 시 해당 pool만, 아니면 합쳐서 사용
  const [koreanSoundUrls, setKoreanSoundUrls] = useState<string[]>([]);
  const [englishSoundUrls, setEnglishSoundUrls] = useState<string[]>([]);

  // 시스템 칭찬 음원 라이브러리 자동 로드
  useEffect(() => {
    settingsApi
      .getSystemSounds()
      .then((data) => {
        setKoreanSoundUrls(data.korean.correct.map((s) => s.url));
        setEnglishSoundUrls(data.english.correct.map((s) => s.url));
      })
      .catch(() => {});
  }, []);

  const playAudio = useCallback((url?: string) => {
    if (!url) return;
    // 이전 오디오 정지 후 새 인스턴스로 재생 (autoplay 정책 회피)
    if (lastAudioRef.current) {
      lastAudioRef.current.pause();
      lastAudioRef.current.src = '';
      lastAudioRef.current = null;
    }
    const audio = new Audio(url);
    allAudiosRef.current.add(audio);
    audio.addEventListener('ended', () => {
      allAudiosRef.current.delete(audio);
    });
    lastAudioRef.current = audio;
    audio.play().catch(() => {});
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

  const scheduleTimer = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      pendingTimersRef.current.delete(id);
      fn();
    }, ms);
    pendingTimersRef.current.add(id);
    return id;
  }, []);

  /** 정답 시퀀스: 효과음 → 칭찬 애니메이션 → TTS(선택) → 시스템 칭찬 음원 → onDone 콜백 */
  const playCorrectSequence = useCallback(
    (opts?: CorrectSequenceOpts) => {
      playFeedbackSound(true);
      setPraiseVisible(true);
      let delay = 500;
      if (opts?.ttsUrl) {
        scheduleTimer(() => playAudio(opts.ttsUrl), delay);
        delay += 1200;
      }
      // 시스템 칭찬 음원: props로 전달된 URL 우선, 없으면 라이브러리에서 랜덤 선택
      // language 지정 시 해당 언어 pool만 사용. 비어있으면 반대 언어로 fallback. 둘 다 비면 undefined
      const pool =
        opts?.language === 'ko'
          ? koreanSoundUrls.length > 0
            ? koreanSoundUrls
            : englishSoundUrls
          : opts?.language === 'en'
            ? englishSoundUrls.length > 0
              ? englishSoundUrls
              : koreanSoundUrls
            : [...koreanSoundUrls, ...englishSoundUrls];
      const correctUrl =
        opts?.systemSounds?.correctUrl ||
        (pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : undefined);
      if (correctUrl) {
        scheduleTimer(() => playAudio(correctUrl), delay);
        delay += 1500;
      } else {
        // 음원이 없어도 최소 대기 (피드백 효과음을 들을 수 있도록)
        delay = Math.max(delay, 1200);
      }
      // 칭찬 오버레이 종료 (onDone 직전에 닫기)
      scheduleTimer(() => setPraiseVisible(false), delay - 300);
      if (opts?.onDone) scheduleTimer(opts.onDone, delay);
    },
    [playFeedbackSound, playAudio, koreanSoundUrls, englishSoundUrls, scheduleTimer]
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

  return { playAudio, playFeedbackSound, playCorrectSequence, praiseVisible };
}
