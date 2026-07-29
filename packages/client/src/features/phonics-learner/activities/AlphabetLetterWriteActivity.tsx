import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { REST_MS } from '../hooks/useActivitySound';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { LetterFillCanvas } from '@/features/phonics/components/LetterFillCanvas';
import type { Storybook } from '@tangobook/shared';
import { ActivityShell } from '../components/ActivityShell';

interface Props {
  unitId: string;
  /** 학습 대상 글자 목록 (예: ['A','B','C']). */
  letters: readonly string[];
  onMarkComplete: () => void;
  onBack: () => void;
}

/**
 * 영어 알파벳 글자 쓰기 (Book 1).
 *
 * 글자 좌→우 카드 진행. 각 카드에 [대문자 캔버스] + [소문자 캔버스] 동시 노출.
 * 두 캔버스 모두 통과 (LetterWritingCanvas onResult passed) → 그 글자 완료 → 다음 글자.
 * 모든 글자 통과 → 칭찬 시퀀스 → onMarkComplete + onBack.
 *
 * 글자 음원: storybook.phonicsLesson.blending[i].blendTtsUrl 우선,
 *   없으면 vowelTtsUrl 또는 blendingSequenceTtsUrl 폴백. 통과 시 자동 재생.
 */
export function AlphabetLetterWriteActivity({ unitId, letters, onMarkComplete, onBack }: Props) {
  const storybookQuery = useStorybook(unitId);
  const sb = storybookQuery.data as Storybook | undefined;
  const { playAudio, playCorrectSequence, praiseVisible } = useGameAudio();
  const systemSounds = sb?.systemSounds;

  // 글자별 (대문자/소문자) 통과 트래킹
  const [passed, setPassed] = useState<Record<string, { upper: boolean; lower: boolean }>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [advancing, setAdvancing] = useState(false);

  const wordFamilies = sb?.phonicsLesson?.wordFamilies ?? [];

  // 현재 글자의 단어 TTS URL 중 랜덤 1개 (예: 'a a apple' / 'a a alligator' / 'a a ant').
  // 캔버스 통과마다 호출 → 통과 시점에 다른 단어 들음.
  const pickRandomWordTts = useCallback(
    (letterIdx: number): string | undefined => {
      const wf = wordFamilies[letterIdx];
      const urls = (wf?.words ?? []).map((w) => w.ttsUrl).filter((u): u is string => !!u);
      if (urls.length === 0) return undefined;
      return urls[Math.floor(Math.random() * urls.length)];
    },
    [wordFamilies]
  );

  const currentLetter = letters[currentIdx];
  const currentUpper = currentLetter?.toUpperCase() ?? '';
  const currentLower = currentLetter?.toLowerCase() ?? '';
  const currentPassed = passed[currentLetter ?? ''] ?? { upper: false, lower: false };

  // 다음 글자로 진행 — 두 캔버스 모두 통과했을 때만 호출.
  // 별도 음원 재생 X (직전 캔버스 통과 시 단어 TTS 이미 들음). 단어 TTS 길이 고려해 1.2s 후 advance.
  const advanceToNext = useCallback(() => {
    if (advancing) return;
    setAdvancing(true);
    setTimeout(() => {
      if (currentIdx + 1 < letters.length) {
        setCurrentIdx((i) => i + 1);
        setAdvancing(false);
      } else {
        // 마지막 글자 — 칭찬 시퀀스
        playCorrectSequence({
          language: 'en',
          systemSounds,
          onDone: () => {
            onMarkComplete();
            onBack();
          },
        });
      }
    }, 1200);
  }, [
    advancing,
    currentIdx,
    letters.length,
    playCorrectSequence,
    systemSounds,
    onMarkComplete,
    onBack,
  ]);

  // 캔버스 통과 콜백 — LetterFillCanvas paint mode, threshold 도달 시 onResult(true) 호출.
  //   1) 통과 시 그 글자의 랜덤 단어 TTS 재생 (예: 'a a apple').
  //   2) advance 판정은 useEffect 가 단일 source (race 무관).
  const handleResult = useCallback(
    (which: 'upper' | 'lower') => (ok: boolean) => {
      if (!currentLetter || !ok) return;
      const alreadyPassed = passed[currentLetter]?.[which];
      setPassed((prev) => {
        const cur = prev[currentLetter] ?? { upper: false, lower: false };
        if (cur[which]) return prev; // 이미 통과
        return { ...prev, [currentLetter]: { ...cur, [which]: true } };
      });
      if (!alreadyPassed) {
        const url = pickRandomWordTts(currentIdx);
        if (url) {
          // 쓰기가 끝난 뒤 숨 돌릴 자리 — 간격은 공용 값(`REST_MS`)을 쓴다.
          setTimeout(() => playAudio(url), REST_MS);
        }
      }
    },
    [currentLetter, currentIdx, passed, pickRandomWordTts, playAudio]
  );

  // 두 캔버스 모두 통과 + advance 아직 진행 중 X → 다음 글자.
  // setTimeout 안 closure 변수 대신 useEffect 가 commit 된 state 만 보고 결정 → race 무관.
  useEffect(() => {
    if (!currentLetter || advancing) return;
    const cur = passed[currentLetter];
    if (cur?.upper && cur?.lower) {
      const t = setTimeout(advanceToNext, 200);
      return () => clearTimeout(t);
    }
  }, [passed, currentLetter, advancing, advanceToNext]);

  const progressText = useMemo(
    () =>
      letters.map((L, i) => {
        const p = passed[L] ?? { upper: false, lower: false };
        const done = p.upper && p.lower;
        const current = i === currentIdx;
        return { L, done, current };
      }),
    [letters, passed, currentIdx]
  );

  if (storybookQuery.isLoading || !sb) {
    return (
      <ActivityShell onBack={onBack} background="peach-gradient">
        <div className="flex-1 flex items-center justify-center text-ink-500 font-bold">
          불러오는 중…
        </div>
      </ActivityShell>
    );
  }

  if (!currentLetter) {
    return null;
  }

  return (
    <ActivityShell
      onBack={onBack}
      background="peach-gradient"
      scroll
      // 진행 도트 — 뒤로가기와 한 줄에.
      headerRight={
        <div className="flex items-center gap-2">
          {progressText.map(({ L, done, current }) => (
            <div
              key={L}
              className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full text-lg sm:text-xl font-black shadow-soft border-[3px] transition-all ${
                done
                  ? 'bg-mint-400 text-white border-white'
                  : current
                    ? 'bg-coral-400 text-white border-white scale-110 shadow-pop'
                    : 'bg-white text-ink-400 border-ink-100'
              }`}
            >
              {done ? '✓' : L}
            </div>
          ))}
        </div>
      }
    >
      {/* 가운데 — 현재 글자의 대문자/소문자 캔버스 2개 */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-start gap-4">
        <h2 className="text-2xl sm:text-3xl font-black text-ink-900 font-display">
          <span className="text-coral-500">{currentUpper}</span>
          <span className="text-sky-500 ml-1">{currentLower}</span>
          <span className="ml-2 text-ink-700">써 보기</span>
        </h2>

        <div className="w-full max-w-[920px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* 대문자 */}
          <div className="bg-white rounded-[24px] p-3 sm:p-4 shadow-pop ring-4 ring-white border-2 border-coral-100">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coral-100 text-coral-700 text-sm sm:text-base font-black">
                <span>🅰️</span> 대문자 {currentUpper}
              </span>
              {currentPassed.upper && (
                <span className="text-mint-500 text-xl sm:text-2xl font-black">✓ 통과</span>
              )}
            </div>
            <LetterFillCanvas
              key={`upper-${currentLetter}`}
              letter={currentUpper}
              onResult={handleResult('upper')}
              autoCheck
            />
          </div>
          {/* 소문자 */}
          <div className="bg-white rounded-[24px] p-3 sm:p-4 shadow-pop ring-4 ring-white border-2 border-sky-100">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-sm sm:text-base font-black">
                <span>🔤</span> 소문자 {currentLower}
              </span>
              {currentPassed.lower && (
                <span className="text-mint-500 text-xl sm:text-2xl font-black">✓ 통과</span>
              )}
            </div>
            <LetterFillCanvas
              key={`lower-${currentLetter}`}
              letter={currentLower}
              onResult={handleResult('lower')}
              autoCheck
            />
          </div>
        </div>

        <p className="text-sm sm:text-base font-bold text-ink-500 text-center mt-1">
          대문자와 소문자를 따라써 보세요. 둘 다 통과하면 다음 글자로 넘어가요.
        </p>
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </ActivityShell>
  );
}
