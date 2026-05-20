import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { LetterWritingCanvas } from '@/features/phonics/components/LetterWritingCanvas';
import { resolveTtsUrl } from '@/features/tts';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { pickPhonicsWordCards, type PhonicsWordCard } from '../lib/pick-word-cards';

interface Props {
  unitId: string;
  consonant: string;
  onComplete: () => void;
  onBack: () => void;
}

const CARDS = 3;

/**
 * 자음 쓰기 액티비티 (unit 2 활동 4).
 *
 * 액티비티 1 (자음 누르기) 의 쓰기 버전.
 * 위쪽 chip: 단어 이미지 카드 3개 (진행 표시 / 임의 선택).
 * 가운데: 현재 카드의 ㄱ 쓰기 캔버스 (autoCheck).
 * 통과 → "ㄱ ㄱ {단어}" 시퀀스 발음 + 다음 카드 자동 이동.
 * 3 카드 모두 통과 → 칭찬 + onComplete.
 */
export function ConsonantWriteActivity({ unitId, consonant, onComplete, onBack }: Props) {
  const storybookQuery = useStorybook(unitId);
  const cards = useMemo<PhonicsWordCard[]>(() => {
    if (!storybookQuery.data) return [];
    return pickPhonicsWordCards(storybookQuery.data, CARDS);
  }, [storybookQuery.data]);

  const { playAudio, playCorrectSequence, praiseVisible } = useGameAudio();
  const [doneSet, setDoneSet] = useState<Set<number>>(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);

  const handleResult = useCallback(
    async (passed: boolean) => {
      if (!passed) return;
      const idx = currentIdx;
      const card = cards[idx];
      if (!card) return;
      // "ㄱ ㄱ {단어}" 시퀀스 재생 (phonics concat, 공백 = 0.3s 무음)
      const url = await resolveTtsUrl({
        text: `${consonant} ${consonant} ${card.word}`,
        language: 'korean',
        storybookId: unitId,
        identifierPrefix: 'consonant-write',
      });
      const nextDone = new Set(doneSet);
      nextDone.add(idx);
      setDoneSet(nextDone);

      const remaining = cards.map((_, i) => i).filter((i) => !nextDone.has(i));
      // 고정 setTimeout (1.8s) 가정은 "ㄱ ㄱ 단어" 가 길 때 칭찬/다음 카드가 먼저 트리거되는 원인.
      // playAudio(url, onEnded) chain 으로 TTS 끝난 후 다음 단계.
      const onTtsEnded = () => {
        if (remaining.length === 0) {
          playCorrectSequence({ language: 'ko', onDone: onComplete });
        } else {
          const next = remaining.find((i) => i > idx) ?? remaining[0];
          setCurrentIdx(next);
        }
      };
      if (url) {
        playAudio(url, onTtsEnded);
      } else {
        onTtsEnded();
      }
    },
    [currentIdx, cards, doneSet, consonant, unitId, playAudio, playCorrectSequence, onComplete]
  );

  // currentIdx 가 done 된 카드를 가리키지 않게 조정
  useEffect(() => {
    if (cards.length === 0) return;
    if (doneSet.has(currentIdx)) {
      const next = cards.map((_, i) => i).find((i) => !doneSet.has(i));
      if (next !== undefined) setCurrentIdx(next);
    }
  }, [cards.length, doneSet, currentIdx]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col px-4 sm:px-6 py-4 bg-gradient-to-b from-cream-50 to-peach-100 overflow-hidden">
      <button
        onClick={onBack}
        className="self-start mb-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold"
      >
        ← 돌아가기
      </button>

      {storybookQuery.isLoading ? (
        <div className="flex-1 flex items-center justify-center text-base font-bold text-ink-500">
          불러오는 중…
        </div>
      ) : cards.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-base font-bold text-ink-500">
          단원에 단어가 부족해요.
        </div>
      ) : (
        <>
          {/* 카드 chip 줄 — 진행 표시 + 임의 선택 */}
          <div className="flex justify-center gap-3 mb-3">
            {cards.map((card, i) => {
              const done = doneSet.has(i);
              const active = i === currentIdx;
              return (
                <button
                  key={i}
                  onClick={() => !done && setCurrentIdx(i)}
                  disabled={done}
                  className={[
                    'flex flex-col items-center gap-1 px-3 py-2 rounded-2xl border-[3px] transition',
                    done
                      ? 'bg-success/15 border-success text-success-700'
                      : active
                        ? 'bg-coral-100 border-coral-500'
                        : 'bg-white border-white hover:shadow-soft',
                  ].join(' ')}
                >
                  {card.imageUrl ? (
                    <img
                      src={card.imageUrl}
                      alt={card.word}
                      className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-cream-100 flex items-center justify-center text-xl">
                      🖼️
                    </div>
                  )}
                  <span className="text-xs sm:text-sm font-black text-ink-800">
                    {done ? '✓ ' : ''}
                    {card.word}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 min-h-0 flex flex-col items-center justify-center">
            <h2 className="text-xl sm:text-2xl font-black text-ink-900 text-center mb-3">
              ✏️ <span className="text-coral-600">{consonant}</span> 을 따라써봐!{' '}
              <span className="text-base font-bold text-ink-600">({cards[currentIdx]?.word})</span>
            </h2>
            <LetterWritingCanvas
              key={`${currentIdx}-${consonant}`}
              letter={consonant}
              onResult={handleResult}
              autoCheck
              threshold={30}
            />
          </div>
        </>
      )}

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </div>
  );
}
