import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { resolveTtsUrl } from '@/features/tts';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { pickPhonicsWordCards, type PhonicsWordCard } from '../lib/pick-word-cards';

interface Props {
  unitId: string;
  consonant: string; // 'ㄱ'
  onComplete: () => void;
  onBack: () => void;
}

const TAPS_PER_CARD = 3;
const CARDS = 3;

/**
 * 자음 누르기 액티비티 (unit 2 활동 1).
 *
 * 위 행: 3개의 자음 버튼 (ㄱ). 각 버튼을 3번 누르면 진행 완료.
 *   - 1탭 → "ㄱ" 발음
 *   - 2탭 → "ㄱ" 발음
 *   - 3탭 → "ㄱ ㄱ {단어}" 시퀀스 발음 (phonics concat — 공백 = 0.3s 무음)
 *
 * 아래 행: 각 버튼과 짝지어진 단어 이미지 (저작도구 단원의 핵심단어 4개 중 랜덤 3개).
 *
 * 3 카드 모두 완료 → 칭찬 + onComplete.
 */
export function ConsonantTapActivity({ unitId, consonant, onComplete, onBack }: Props) {
  const storybookQuery = useStorybook(unitId);
  const cards = useMemo<PhonicsWordCard[]>(() => {
    if (!storybookQuery.data) return [];
    return pickPhonicsWordCards(storybookQuery.data, CARDS);
  }, [storybookQuery.data]);

  const [tapCounts, setTapCounts] = useState<number[]>(Array(CARDS).fill(0));
  const { playAudio, playCorrectSequence, praiseVisible } = useGameAudio();
  const [completed, setCompleted] = useState(false);

  const handleTap = useCallback(
    async (idx: number) => {
      if (completed) return;
      const cur = tapCounts[idx] ?? 0;
      if (cur >= TAPS_PER_CARD) return;
      const next = cur + 1;
      setTapCounts((p) => p.map((c, i) => (i === idx ? next : c)));

      const word = cards[idx]?.word;
      const isFinalTap = next === TAPS_PER_CARD;
      // 발음 텍스트: 마지막 탭은 "ㄱ ㄱ 단어" (공백 = 0.3s pause), 아니면 단순 자음.
      const text = isFinalTap && word ? `${consonant} ${consonant} ${word}` : consonant;
      const url = await resolveTtsUrl({
        text,
        language: 'korean',
        storybookId: unitId,
        identifierPrefix: 'consonant-tap',
      });
      if (url) playAudio(url);
    },
    [completed, tapCounts, cards, consonant, unitId, playAudio]
  );

  // 모두 완료 감지
  useEffect(() => {
    if (cards.length === 0 || completed) return;
    if (tapCounts.slice(0, cards.length).every((c) => c >= TAPS_PER_CARD)) {
      setCompleted(true);
      // 마지막 단어 TTS 가 끝날 시간을 좀 주고 칭찬 시퀀스 시작
      setTimeout(() => playCorrectSequence({ language: 'ko', onDone: onComplete }), 1800);
    }
  }, [tapCounts, cards.length, completed, playCorrectSequence, onComplete]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col px-4 sm:px-6 py-4 bg-gradient-to-b from-cream-50 to-peach-100 overflow-hidden">
      <button
        onClick={onBack}
        className="self-start mb-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold"
      >
        ← 돌아가기
      </button>

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-ink-900 text-center">
          <span className="text-coral-600">{consonant}</span> 을 세 번씩 눌러봐!
        </h2>

        {storybookQuery.isLoading ? (
          <div className="text-base font-bold text-ink-500">불러오는 중…</div>
        ) : cards.length === 0 ? (
          <div className="text-base font-bold text-ink-500">단원에 단어가 부족해요.</div>
        ) : (
          <div className="grid grid-cols-3 gap-4 sm:gap-6 w-full max-w-3xl">
            {cards.map((card, i) => {
              const taps = tapCounts[i] ?? 0;
              const done = taps >= TAPS_PER_CARD;
              return (
                <div key={i} className="flex flex-col gap-3">
                  <button
                    onClick={() => handleTap(i)}
                    disabled={done}
                    className={[
                      'relative rounded-3xl border-[5px] aspect-square flex flex-col items-center justify-center shadow-soft transition',
                      done
                        ? 'bg-success/15 border-success'
                        : 'bg-white border-coral-300 hover:shadow-pop active:scale-[0.96]',
                    ].join(' ')}
                    aria-label={`${consonant} ${i + 1}번 카드`}
                  >
                    <div className="text-6xl sm:text-7xl md:text-8xl font-black text-coral-600">
                      {consonant}
                    </div>
                    {/* 진행 dots */}
                    <div className="absolute bottom-3 flex gap-1.5">
                      {Array.from({ length: TAPS_PER_CARD }).map((_, k) => (
                        <span
                          key={k}
                          className={`w-2.5 h-2.5 rounded-full ${k < taps ? 'bg-coral-500' : 'bg-cream-200'}`}
                        />
                      ))}
                    </div>
                    {done && (
                      <span className="absolute top-2 right-2 text-success-700 text-2xl">✓</span>
                    )}
                  </button>
                  <div className="rounded-2xl bg-white border-[3px] border-white p-2 shadow-soft flex flex-col items-center">
                    {card.imageUrl ? (
                      <img
                        src={card.imageUrl}
                        alt={card.word}
                        className="w-full aspect-square object-cover rounded-xl"
                      />
                    ) : (
                      <div className="w-full aspect-square rounded-xl bg-cream-100 flex items-center justify-center text-3xl">
                        🖼️
                      </div>
                    )}
                    <div className="text-sm sm:text-base font-black text-ink-900 mt-1">
                      {card.word}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </div>
  );
}
