import { useCallback, useMemo, useState } from 'react';
import { LetterFillCanvas } from '@/features/phonics/components/LetterFillCanvas';
import { resolveTtsUrl } from '@/features/tts';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';

interface Props {
  unitId: string;
  consonant: string;
  /** 발음할 텍스트. 미지정이면 `consonant`. 받침은 홀로 소리 못 내 예시 음절('앙')을 읽는다. */
  soundText?: string;
  /** 단원의 타겟 단어(그림 있는 것). 한 번 쓸 때마다 슬롯에 하나씩 열린다. */
  words?: ReadonlyArray<{ word: string; imageUrl: string; ttsUrl?: string }>;
  onComplete: () => void;
  onBack: () => void;
}

const TIMES = 3;

/**
 * 자음 쓰기 액티비티 (unit 2 활동 4).
 *
 * 단순화 (2026-05-20): 단어 없이 ㄱ 만 N번 따라쓰기.
 *   - 매 통과 → ㄱ TTS → 띵동 (per-write 피드백) → 다음 슬롯 (캔버스 리셋)
 *   - N 회 통과 → ㄱ TTS → 띵동 → 칭찬 시퀀스
 *
 * 이전: storybook 단어 카드 3개 기반 → 단어 의존성 + UI 복잡. 사용자 단순화 요청.
 */
export function ConsonantWriteActivity({
  unitId,
  consonant,
  soundText,
  words = [],
  onComplete,
  onBack,
}: Props) {
  const { playAudio, playCorrectSequence, praiseVisible } = useGameAudio();
  const [completedCount, setCompletedCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const say = soundText ?? consonant;

  // 슬롯별 단어 — 마운트 때 한 번만 뽑는다(쓸 때마다 섞이면 그림이 춤춘다).
  const slotWords = useMemo(() => {
    if (!words.length) return [];
    const pool = [...words];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return Array.from({ length: TIMES }, (_, i) => pool[i % pool.length]);
  }, [words]);

  usePhonicsTtsWarm(
    unitId,
    useMemo(() => [say, ...slotWords.map((w) => w.word)], [say, slotWords]),
    'consonant-write'
  );

  const handleResult = useCallback(
    async (passed: boolean) => {
      if (!passed || completed) return;
      const nextCount = completedCount + 1;
      setCompletedCount(nextCount);

      const ttsFor = (text: string) =>
        resolveTtsUrl({
          text,
          language: 'korean',
          storybookId: unitId,
          identifierPrefix: 'consonant-write',
        });

      const url = await ttsFor(say);
      // 🔴 쓴 글자 → **그 슬롯에서 열린 낱말** 순서로 읽는다 (자음 누르기의 `ㄱ ㄱ 고기` 와 같은 리듬).
      const slot = slotWords[completedCount];
      const wordUrl = slot ? slot.ttsUrl || (await ttsFor(slot.word)) : null;

      const isAllDone = nextCount >= TIMES;
      if (isAllDone) setCompleted(true);

      // 글자 TTS → 낱말 TTS → 띵동 → (전체 완료면 칭찬)
      const afterChime = isAllDone
        ? () => playCorrectSequence({ language: 'ko', onDone: onComplete })
        : undefined;
      const playChime = () => playAudio('/sounds/game/correct.mp3', afterChime);
      const playWord = () => (wordUrl ? playAudio(wordUrl, playChime) : playChime());
      if (url) {
        playAudio(url, playWord);
      } else {
        playWord();
      }
    },
    [completed, completedCount, say, slotWords, unitId, playAudio, playCorrectSequence, onComplete]
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col px-4 sm:px-6 py-4 overflow-hidden"
      style={{
        backgroundImage: "url('/images/phonics/study-bg.webp')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <button
        onClick={onBack}
        className="self-start mb-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold"
      >
        ← 돌아가기
      </button>

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display text-ink-900 text-center break-keep">
          ✏️ <span className="text-coral-600">{consonant}</span> 을 세 번 따라써봐!
        </h2>

        {/* 진행 슬롯 — 한 번 쓸 때마다 그 자리에 **낱말 그림이 열린다**.
            자음 누르기 카드와 같은 규칙: 그림은 장식이 아니라 해낸 보상으로 나온다. */}
        <div className="flex gap-2 sm:gap-3">
          {Array.from({ length: TIMES }).map((_, i) => {
            const done = i < completedCount;
            const word = slotWords[i];
            return (
              <span
                key={i}
                title={done && word ? word.word : undefined}
                className={[
                  'relative overflow-hidden flex items-center justify-center font-black shadow-soft transition',
                  word
                    ? 'w-16 h-16 sm:w-24 sm:h-24 rounded-2xl text-base sm:text-xl'
                    : 'w-8 h-8 sm:w-10 sm:h-10 rounded-full text-sm sm:text-base',
                  done
                    ? 'bg-success text-white'
                    : i === completedCount
                      ? 'bg-coral-500 text-white ring-4 ring-coral-200 animate-pulse'
                      : 'bg-white text-ink-400',
                ].join(' ')}
              >
                {done && word ? (
                  <img
                    src={word.imageUrl}
                    alt={word.word}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <span>{done ? '✓' : i + 1}</span>
                )}
              </span>
            );
          })}
        </div>

        <LetterFillCanvas
          key={`write-${completedCount}`}
          letter={consonant}
          onResult={handleResult}
          autoCheck
          threshold={0.95}
        />
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </div>
  );
}
