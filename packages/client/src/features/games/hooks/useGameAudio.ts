import { useRef, useCallback, useEffect, useState } from 'react';
import { settingsApi } from '@/features/settings/api/settings.api';

export interface CorrectSequenceOpts {
  ttsUrl?: string;
  systemSounds?: { correctUrl?: string; incorrectUrl?: string };
  onDone?: () => void;
}

/** 게임 공통 오디오 훅 — TTS 재생 + 정답/오답 효과음 + 칭찬 시퀀스 */
export function useGameAudio() {
  const lastAudioRef = useRef<HTMLAudioElement | null>(null);
  const [librarySoundUrls, setLibrarySoundUrls] = useState<string[]>([]);

  // 시스템 칭찬 음원 라이브러리 자동 로드
  useEffect(() => {
    settingsApi
      .getSystemSounds()
      .then((data) => {
        const urls = [
          ...data.korean.correct.map((s) => s.url),
          ...data.english.correct.map((s) => s.url),
        ];
        if (urls.length > 0) setLibrarySoundUrls(urls);
      })
      .catch(() => {});
  }, []);

  const playAudio = useCallback((url?: string) => {
    if (!url) return;
    // 이전 오디오 정지 후 새 인스턴스로 재생 (autoplay 정책 회피)
    if (lastAudioRef.current) {
      lastAudioRef.current.pause();
      lastAudioRef.current = null;
    }
    const audio = new Audio(url);
    lastAudioRef.current = audio;
    audio.play().catch(() => {});
  }, []);

  const playFeedbackSound = useCallback((correct: boolean) => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      if (correct) {
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } else {
        osc.frequency.setValueAtTime(330, ctx.currentTime);
        osc.frequency.setValueAtTime(262, ctx.currentTime + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // 칭찬 애니메이션 오버레이 상태
  const [praiseVisible, setPraiseVisible] = useState(false);

  /** 정답 시퀀스: 효과음 → 칭찬 애니메이션 → TTS(선택) → 시스템 칭찬 음원 → onDone 콜백 */
  const playCorrectSequence = useCallback(
    (opts?: CorrectSequenceOpts) => {
      playFeedbackSound(true);
      setPraiseVisible(true);
      let delay = 500;
      if (opts?.ttsUrl) {
        setTimeout(() => playAudio(opts.ttsUrl), delay);
        delay += 1200;
      }
      // 시스템 칭찬 음원: props로 전달된 URL 우선, 없으면 라이브러리에서 랜덤 선택
      const correctUrl =
        opts?.systemSounds?.correctUrl ||
        (librarySoundUrls.length > 0
          ? librarySoundUrls[Math.floor(Math.random() * librarySoundUrls.length)]
          : undefined);
      if (correctUrl) {
        setTimeout(() => playAudio(correctUrl), delay);
        delay += 1500;
      } else {
        // 음원이 없어도 최소 대기 (피드백 효과음을 들을 수 있도록)
        delay = Math.max(delay, 1200);
      }
      // 칭찬 오버레이 종료 (onDone 직전에 닫기)
      setTimeout(() => setPraiseVisible(false), delay - 300);
      if (opts?.onDone) setTimeout(opts.onDone, delay);
    },
    [playFeedbackSound, playAudio, librarySoundUrls]
  );

  return { playAudio, playFeedbackSound, playCorrectSequence, praiseVisible };
}
