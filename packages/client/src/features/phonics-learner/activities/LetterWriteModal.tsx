import { useCallback, useEffect, useState } from 'react';
import type { Storybook } from '@tangobook/shared';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { LetterFillCanvas } from '@/features/phonics/components/LetterFillCanvas';

interface Props {
  storybook: Storybook;
  /** storybook.phonicsLesson.blending[letterIndex] / wordFamilies[letterIndex] 인덱스. */
  letterIndex: number;
  /** 학습 페이지에서 보고 있는 활성 글자 (예: 'A'). blending 의 vowel 보다 우선 — title 일관성. */
  activeLetter: string;
  onClose: () => void;
}

/**
 * 단일 글자 써보기 모달 (학습 페이지 안에서 띄움).
 *
 * - 대문자/소문자 두 캔버스 분리 채점. autoCheck.
 * - 한쪽 통과 시 그 글자의 단어 TTS 중 랜덤 1개 재생 (학습카드 단어와 동일 source).
 * - 두 캔버스 모두 통과 → 칭찬 시퀀스 → 모달 자동 닫기.
 * - ✕ 클릭으로 언제든 닫기 가능.
 */
export function LetterWriteModal({ storybook, letterIndex, activeLetter, onClose }: Props) {
  const wordFamily = storybook.phonicsLesson?.wordFamilies?.[letterIndex];
  const upper = activeLetter.toUpperCase();
  const lower = activeLetter.toLowerCase();

  const { playAudio, playCorrectSequence, praiseVisible } = useGameAudio();
  const [passed, setPassed] = useState<{ upper: boolean; lower: boolean }>({
    upper: false,
    lower: false,
  });
  const [closing, setClosing] = useState(false);

  const pickRandomWordTts = useCallback((): string | undefined => {
    const urls = (wordFamily?.words ?? []).map((w) => w.ttsUrl).filter((u): u is string => !!u);
    if (urls.length === 0) return undefined;
    return urls[Math.floor(Math.random() * urls.length)];
  }, [wordFamily]);

  const handleComplete = useCallback(
    (which: 'upper' | 'lower') => (passed: boolean) => {
      if (!passed) return;
      setPassed((prev) => {
        if (prev[which]) return prev;
        return { ...prev, [which]: true };
      });
      // 완료 시 단어 TTS 랜덤 재생 — 짧은 갭 후 (시스템 효과음 없음)
      const url = pickRandomWordTts();
      if (url) setTimeout(() => playAudio(url), 200);
    },
    [pickRandomWordTts, playAudio]
  );

  // 자유 stroke 라 "miss" 개념 없음 — handleMiss 제거 (사용자가 자유롭게 그리고 점만 통과하면 인정)

  // 두 캔버스 모두 통과 → 1.2s 후 칭찬 시퀀스 → 모달 닫기 (race-free useEffect 패턴)
  useEffect(() => {
    if (closing) return;
    if (!passed.upper || !passed.lower) return;
    setClosing(true);
    const t = setTimeout(() => {
      playCorrectSequence({
        language: 'en',
        systemSounds: storybook.systemSounds,
        onDone: onClose,
      });
    }, 1200);
    return () => clearTimeout(t);
  }, [passed, closing, playCorrectSequence, storybook.systemSounds, onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div
        className="relative bg-gradient-to-b from-cream-50 to-peach-100 rounded-[28px] shadow-2xl overflow-y-auto p-4 sm:p-6"
        style={{
          width: 'min(95vw, 900px)',
          maxHeight: 'min(95vh, 800px)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl sm:text-3xl font-black font-display flex items-baseline gap-1">
            <span className="text-coral-500">{upper}</span>
            <span className="text-sky-500">{lower}</span>
            <span className="ml-2 text-ink-700">써보기</span>
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/90 shadow-soft text-xl font-black text-ink-500 hover:text-ink-900 transition-colors"
            title="닫기"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* 대문자 */}
          <div className="bg-white rounded-[20px] p-3 sm:p-4 shadow-pop ring-4 ring-white border-2 border-coral-100">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coral-100 text-coral-700 text-sm sm:text-base font-black">
                <span>🅰️</span> 대문자 {upper}
              </span>
              {passed.upper && (
                <span className="text-mint-500 text-xl sm:text-2xl font-black">✓ 통과</span>
              )}
            </div>
            <LetterFillCanvas
              key={`upper-${letterIndex}`}
              letter={upper}
              onResult={handleComplete('upper')}
              autoCheck
            />
          </div>
          {/* 소문자 */}
          <div className="bg-white rounded-[20px] p-3 sm:p-4 shadow-pop ring-4 ring-white border-2 border-sky-100">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-sm sm:text-base font-black">
                <span>🔤</span> 소문자 {lower}
              </span>
              {passed.lower && (
                <span className="text-mint-500 text-xl sm:text-2xl font-black">✓ 통과</span>
              )}
            </div>
            <LetterFillCanvas
              key={`lower-${letterIndex}`}
              letter={lower}
              onResult={handleComplete('lower')}
              autoCheck
            />
          </div>
        </div>

        <p className="text-sm sm:text-base font-bold text-ink-500 text-center mt-4">
          글자 안을 색칠해봐!
        </p>

        <FeedbackOverlay kind="correct" visible={praiseVisible} />
      </div>
    </div>
  );
}
