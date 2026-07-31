import { useCallback, useMemo, useRef, useState } from 'react';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { useEntryGuide, ENTRY_GUIDE } from '../hooks/useEntryGuide';
import { REST_MS } from '../hooks/useActivitySound';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { LetterFillCanvas } from '@/features/phonics/components/LetterFillCanvas';
import type { Storybook } from '@tangobook/shared';
import { ActivityShell } from '../components/ActivityShell';
import { findImageData } from '../lib/phonics-game-adapter';

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
/** 마지막 칸까지 통과한 뒤 그림을 잠깐 더 두고 다음 글자로 — 아이가 그림을 볼 틈. */
const REVEAL_LINGER_MS = 1000;

export function AlphabetLetterWriteActivity({ unitId, letters, onMarkComplete, onBack }: Props) {
  const storybookQuery = useStorybook(unitId);
  const sb = storybookQuery.data as Storybook | undefined;
  const { playAudio, playCorrectSequence, praiseVisible, scheduleTimer } = useGameAudio();
  // 🔴 진입 안내 — 지시가 텍스트뿐이라 글 못 읽는 아이엔 통째로 무음이었다(쓰기 6종 공통).
  useEntryGuide(ENTRY_GUIDE.write, playAudio);
  const systemSounds = sb?.systemSounds;

  // 글자별 (대문자/소문자) 통과 트래킹
  const [passed, setPassed] = useState<Record<string, { upper: boolean; lower: boolean }>>({});
  const [currentIdx, setCurrentIdx] = useState(0);

  const wordFamilies = sb?.phonicsLesson?.wordFamilies ?? [];

  /**
   * 🔴 **통과한 칸은 그 자리에서 그림으로 바뀐다**(2026-07-31 사용자: "쓰기 칸을 그림으로 바꾸자.
   *    그 아래 알파벳은 보여주고"). 예전엔 통과할 때마다 **풀스크린 그림 팝업**이 튀어나왔는데
   *    (`reward` 오버레이), 쓰던 자리를 덮어 흐름이 끊겼다. 이제 그림은 캔버스 칸 안에서 열린다 —
   *    대문자 통과 = 첫 낱말(apple) / 소문자 통과 = 둘째 낱말(alligator), 그림 아래 알파벳(B/b)을 둔다.
   */

  /** 글자의 n 번째 낱말 — 그림·소리를 같이 준다. */
  const wordAt = useCallback(
    (letterIdx: number, slot: number) => {
      const w = wordFamilies[letterIdx]?.words?.[slot];
      if (!w?.word || !sb) return null;
      const extra = findImageData(sb, w.word);
      return { word: w.word, ttsUrl: w.ttsUrl, imageUrl: extra.imageUrl };
    },
    [wordFamilies, sb]
  );

  const currentLetter = letters[currentIdx];
  const currentUpper = currentLetter?.toUpperCase() ?? '';
  const currentLower = currentLetter?.toLowerCase() ?? '';
  const currentPassed = passed[currentLetter ?? ''] ?? { upper: false, lower: false };

  /** 마지막 글자까지 끝났을 때 — 칭찬하고 단원으로. */
  const finishUnit = useCallback(() => {
    playCorrectSequence({
      language: 'en',
      systemSounds,
      onDone: () => {
        onMarkComplete();
        onBack();
      },
    });
  }, [playCorrectSequence, systemSounds, onMarkComplete, onBack]);

  /** 이 글자의 두 칸을 다 통과했으니 다음 글자(또는 단원 종료)로. */
  const advanceLetter = useCallback(() => {
    if (currentIdx + 1 < letters.length) setCurrentIdx((i) => i + 1);
    else finishUnit();
  }, [currentIdx, letters.length, finishUnit]);
  const advanceRef = useRef(advanceLetter);
  advanceRef.current = advanceLetter;

  /**
   * 캔버스 통과 콜백 — 통과한 칸은 그림으로 바뀌고(`passed` → 아래 `renderCell` 이 파생), 그 낱말을 읽어준다.
   * 🔴 소리 길이를 가정하지 않는다(`playAudio` 콜백 체인). 두 번째 통과면 소리가 끝나고 그림을 잠깐
   *    더 둔 뒤 다음 글자로 — 아이가 그림을 볼 틈.
   */
  const handleResult = useCallback(
    (which: 'upper' | 'lower') => (ok: boolean) => {
      if (!currentLetter || !ok) return;
      if (passed[currentLetter]?.[which]) return; // 이미 통과한 칸
      const other = which === 'upper' ? 'lower' : 'upper';
      const isLast = !!passed[currentLetter]?.[other]; // 이번이 그 글자의 두 번째 통과
      setPassed((prev) => {
        const cur = prev[currentLetter] ?? { upper: false, lower: false };
        return { ...prev, [currentLetter]: { ...cur, [which]: true } };
      });

      const w = wordAt(currentIdx, which === 'upper' ? 0 : 1) ?? wordAt(currentIdx, 0);
      // 그림은 setPassed 로 칸에 이미 떴다 — 쓰기 뒤 숨 돌리고 낱말 소리, 마지막이면 그 뒤 다음 글자로.
      scheduleTimer(() => {
        playAudio(w?.ttsUrl, () => {
          if (isLast) scheduleTimer(() => advanceRef.current(), REVEAL_LINGER_MS);
        });
      }, REST_MS);
    },
    [currentLetter, currentIdx, passed, wordAt, playAudio, scheduleTimer]
  );

  /**
   * 한 칸(대/소문자) — 통과 전엔 캔버스, 통과하면 그 낱말 그림 + 아래 알파벳.
   * 🔴 그림이 없는 글자(플래시카드 미보유)는 통과해도 캔버스를 그대로 둔다(✓ 통과 배지가 상태를 말한다).
   */
  const renderCell = (which: 'upper' | 'lower', letter: string, letterColor: string) => {
    const img = currentPassed[which]
      ? (wordAt(currentIdx, which === 'upper' ? 0 : 1) ?? wordAt(currentIdx, 0))?.imageUrl
      : undefined;
    if (img) {
      return (
        <div className="flex flex-col items-center gap-1">
          <img src={img} alt="" className="w-full aspect-square object-contain rounded-[18px]" />
          <span
            className={`font-display font-black text-4xl sm:text-5xl leading-none ${letterColor}`}
          >
            {letter}
          </span>
        </div>
      );
    }
    return (
      <LetterFillCanvas
        key={`${which}-${currentLetter}`}
        letter={letter}
        onResult={handleResult(which)}
        autoCheck
      />
    );
  };

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
      {/* 가운데 — 현재 글자의 대문자/소문자 캔버스 2개.
          🔴 `justify-start` 였을 때 캔버스가 위에 몰리고 **아래 절반이 통째로 비었다**(1280×800 실측). */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4">
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
            {renderCell('upper', currentUpper, 'text-coral-600')}
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
            {renderCell('lower', currentLower, 'text-sky-600')}
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
