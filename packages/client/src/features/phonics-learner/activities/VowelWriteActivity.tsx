import { useCallback, useState } from 'react';
import { LetterWritingCanvas } from '@/features/phonics/components/LetterWritingCanvas';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { resolveTtsUrl } from '@/features/tts';

interface VowelItem {
  vowel: string;
  syllable: string; // 따라쓸 글자 (e.g. '아')
}

interface Props {
  unitId: string;
  vowels: ReadonlyArray<VowelItem>;
  onComplete: () => void;
  onBack: () => void;
}

/**
 * 모음 쓰기 액티비티.
 *
 * 위쪽 chip 줄 — 진행 표시 (✓ 완료된 모음).
 * 중앙 — 현재 모음 큰 캔버스 (LetterWritingCanvas, autoCheck).
 * 통과 시 → 발음 재생 + 다음 모음. 모두 통과 → 칭찬 후 onComplete.
 */
export function VowelWriteActivity({ unitId, vowels, onComplete, onBack }: Props) {
  const { playAudio, playCorrectSequence, praiseVisible } = useGameAudio();
  const [doneSet, setDoneSet] = useState<Set<number>>(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);

  const handleResult = useCallback(
    async (passed: boolean) => {
      if (!passed) return;
      const idx = currentIdx;
      // 단어 발음 (한글 phonics concat)
      const url = await resolveTtsUrl({
        text: vowels[idx].syllable,
        language: 'korean',
        storybookId: unitId,
        identifierPrefix: 'phonics-write',
      });
      const nextDone = new Set(doneSet);
      nextDone.add(idx);
      setDoneSet(nextDone);

      const remaining = vowels.map((_, i) => i).filter((i) => !nextDone.has(i));

      // playAudio onEnded chain — 단어 TTS 끝난 후 칭찬/다음 카드 (기존 setTimeout 가정 폐기)
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
    [currentIdx, vowels, doneSet, playAudio, playCorrectSequence, onComplete, unitId]
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

      {/* chip 줄 — 진행 + 클릭으로 임의 선택 */}
      <div className="flex flex-wrap justify-center gap-3 mb-4">
        {vowels.map((v, i) => {
          const done = doneSet.has(i);
          const active = i === currentIdx;
          return (
            <button
              key={v.vowel}
              onClick={() => !done && setCurrentIdx(i)}
              disabled={done}
              className={[
                'inline-flex items-center gap-1.5 px-5 py-3 rounded-full font-black border-[3px] transition shadow-soft',
                done
                  ? 'bg-success/15 border-success text-success-700'
                  : active
                    ? 'bg-coral-500 border-coral-600 text-white shadow-pop scale-105'
                    : 'bg-white border-white text-ink-700 hover:shadow-pop',
              ].join(' ')}
            >
              {done && <span className="text-base">✓</span>}
              <span className="text-2xl sm:text-3xl">{v.syllable}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-ink-900 text-center mb-4">
          ✏️ <span className="text-coral-600">{vowels[currentIdx].syllable}</span> 를 따라써봐!
        </h2>
        <LetterWritingCanvas
          key={`${currentIdx}-${vowels[currentIdx].syllable}`}
          letter={vowels[currentIdx].syllable}
          onResult={handleResult}
          autoCheck
          threshold={35}
        />
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </div>
  );
}
