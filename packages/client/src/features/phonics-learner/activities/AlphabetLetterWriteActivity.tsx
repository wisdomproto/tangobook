import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { useEntryGuide, ENTRY_GUIDE } from '../hooks/useEntryGuide';
import { REST_MS } from '../hooks/useActivitySound';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { LetterFillCanvas } from '@/features/phonics/components/LetterFillCanvas';
import type { Storybook } from '@tangobook/shared';
import { ActivityShell } from '../components/ActivityShell';
import { FirstLetterWord } from '../components/FirstLetterWord';
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
  const [advancing, setAdvancing] = useState(false);

  const wordFamilies = sb?.phonicsLesson?.wordFamilies ?? [];

  /**
   * 캔버스 하나를 통과할 때 여는 그림 — **글자당 두 장**(apple / alligator)을 하나씩 준다.
   * 🔴 대문자 통과 = 첫 낱말, 소문자 통과 = 둘째 낱말(2026-07-29 사용자 지시: "하나씩 나오게 해").
   *    예전엔 낱말을 **무작위**로 골라 소리만 냈고 그림은 글자를 다 쓴 뒤 한 장만 나왔다 —
   *    글자당 그림이 두 장인데 한 장은 아무도 못 봤다.
   * 🔴 그림은 **낱말 소리와 함께** 연다. 소리가 끝나기를 기다렸다가 열었더니 「a a alligator」를
   *    다 듣고도 4.2초 동안 아무 일이 없었다(사용자: "그림이 안 나오는데?").
   */
  const [reward, setReward] = useState<{
    url: string;
    word: string;
    /** 이 그림이 닫히면 다음 글자로 — 그 글자의 두 번째(=마지막) 통과였다. */
    last: boolean;
  } | null>(null);

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

  /** 그림을 닫는다 — 그 글자의 마지막 그림이었으면 다음 글자(또는 단원 종료)로. */
  const closeReward = useCallback(() => {
    setReward((r) => {
      if (!r) return null;
      if (r.last) {
        if (currentIdx + 1 < letters.length) {
          setCurrentIdx((i) => i + 1);
          setAdvancing(false);
        } else {
          finishUnit();
        }
      }
      return null;
    });
  }, [currentIdx, letters.length, finishUnit]);
  const closeRewardRef = useRef(closeReward);
  closeRewardRef.current = closeReward;

  /**
   * 캔버스 통과 콜백 — 통과한 쪽(대/소문자)에 해당하는 낱말을 **그림 + 소리로 함께** 낸다.
   * 🔴 소리 길이를 가정하지 않는다 — 그림은 소리가 끝나고 잠깐 더 있다가 닫힌다(탭하면 즉시).
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
      if (isLast) setAdvancing(true);

      const w = wordAt(currentIdx, which === 'upper' ? 0 : 1) ?? wordAt(currentIdx, 0);
      if (w?.imageUrl) setReward({ url: w.imageUrl, word: w.word, last: isLast });

      // 쓰기가 끝난 뒤 숨 돌릴 자리 — 간격은 공용 값(`REST_MS`).
      scheduleTimer(() => {
        playAudio(w?.ttsUrl, () => {
          // 소리가 끝나면 그림을 잠깐 더 두고 닫는다. 그림이 없으면 바로 다음 단계로.
          scheduleTimer(() => closeRewardRef.current(), w?.imageUrl ? 1200 : 0);
        });
      }, REST_MS);
    },
    [currentLetter, currentIdx, passed, wordAt, playAudio, scheduleTimer]
  );

  /** 소리가 아예 없어 `playAudio` 가 즉시 끝나는 경우 대비 — 그림이 영영 안 닫히지 않게. */
  useEffect(() => {
    if (!reward) return;
    scheduleTimer(() => closeRewardRef.current(), 6000);
  }, [reward, scheduleTimer]);

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

      {reward && (
        // 🔴 `onClick` 으로 언제든 넘어갈 수 있게 — 기다리는 화면을 강제하지 않는다.
        <button
          onClick={closeReward}
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-4 bg-ink-900/70 backdrop-blur-sm px-6"
          aria-label={reward.word}
        >
          {/* 낱말을 같이 보여준다 — 소리로 듣는 그 낱말이 화면에도 있어야 글자와 이어진다. */}
          {/* 낱말을 같이 보여준다 — 첫 글자만 크게(이 권의 목표는 글자다). */}
          <span className="text-white font-display font-black text-4xl sm:text-6xl leading-none">
            <FirstLetterWord word={reward.word} />
          </span>
          <img
            src={reward.url}
            alt=""
            className="max-h-[60vh] max-w-full object-contain rounded-3xl border-[6px] border-white shadow-pop"
          />
        </button>
      )}

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </ActivityShell>
  );
}
