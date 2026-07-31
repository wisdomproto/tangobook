import { useCallback, useEffect, useRef, useState } from 'react';
import { LetterFillCanvas } from '@/features/phonics/components/LetterFillCanvas';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { useEntryGuide, ENTRY_GUIDE } from '../hooks/useEntryGuide';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { resolveTtsUrl } from '@/features/tts';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';
import { ActivityShell } from '../components/ActivityShell';

/** 읽어준 뒤 다음 글자까지의 쉼 (ms). 소리가 끝난 걸 확인한 뒤 넣으므로 길이 가정이 아니다. */
const REST_MS = 450;

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
  // 🔴 진입 안내 — 지시가 텍스트뿐이라 글 못 읽는 아이엔 통째로 무음이었다(쓰기 6종 공통).
  useEntryGuide(ENTRY_GUIDE.write, playAudio);
  const [doneSet, setDoneSet] = useState<Set<number>>(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);
  // 쉬는 동안 나가면 예약된 다음 카드·칭찬이 빈 화면에서 울린다.
  const restRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (restRef.current) clearTimeout(restRef.current);
    },
    []
  );

  usePhonicsTtsWarm(
    unitId,
    vowels.map((v) => v.syllable),
    'phonics-write'
  );

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

      /**
       * playAudio onEnded chain — 발음이 끝난 뒤 칭찬/다음 카드 (setTimeout 길이 가정 폐기).
       * 🔴 그 사이에 **쉼**을 둔다 — `아` 를 읽자마자 다음 칸으로 바뀌면 읽어준 소리와 새 글자가
       *    한 덩어리로 지나간다. 소리가 **끝난 걸 확인한 뒤** 넣는 쉼이라 길이 가정이 아니다.
       */
      const onTtsEnded = () => {
        restRef.current = window.setTimeout(() => {
          if (remaining.length === 0) {
            playCorrectSequence({ language: 'ko', onDone: onComplete });
          } else {
            const next = remaining.find((i) => i > idx) ?? remaining[0];
            setCurrentIdx(next);
          }
        }, REST_MS);
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
    <ActivityShell onBack={onBack}>
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
        <LetterFillCanvas
          key={`${currentIdx}-${vowels[currentIdx].syllable}`}
          letter={vowels[currentIdx].syllable}
          onResult={handleResult}
          autoCheck
        />
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </ActivityShell>
  );
}
