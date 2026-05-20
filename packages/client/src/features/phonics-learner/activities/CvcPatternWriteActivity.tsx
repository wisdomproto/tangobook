import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { LetterWritingCanvas } from '@/features/phonics/components/LetterWritingCanvas';
import { resolveTtsUrl } from '@/features/tts';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';

interface Props {
  unitId: string;
  pattern: { vowel: string; consonant: string; vc: string };
  onMarkComplete: () => void;
  onBack: () => void;
}

interface CvcWord {
  word: string;
  consonantBefore: string;
  imageUrl?: string;
  sentence?: string;
}

/**
 * 영어 CVC 쓰기 액티비티 — VC 글자별 분리 canvas (book2 unit1+).
 *
 * 한 단어 화면: 위 단어 이미지 + 아래 [consonant 셀][VC 1 canvas][VC 2 canvas].
 * 각 VC canvas 통과 시: 띵동 → 음가. 단어의 모든 VC 통과 → 단어 전체 발음 → 다음 단어.
 * 4 단어 모두 통과 → 칭찬 + onMarkComplete.
 */
export function CvcPatternWriteActivity({ unitId, pattern, onMarkComplete, onBack }: Props) {
  const storybookQuery = useStorybook(unitId);
  const { playAudio, playCorrectSequence, praiseVisible } = useGameAudio();

  const cvcWords = useMemo<CvcWord[]>(() => {
    const sb = storybookQuery.data;
    if (!sb) return [];
    const expected = `_${pattern.vc}`;
    const matches = (sb.flashcards ?? []).filter((f) => f.phonicPattern === expected);
    return matches.slice(0, 4).map((f) => {
      const word = f.word ?? '';
      const consonantBefore = word.slice(0, Math.max(0, word.length - pattern.vc.length));
      const out: CvcWord = { word, consonantBefore };
      if (f.imageUrl) out.imageUrl = f.imageUrl;
      if (f.sentence) out.sentence = f.sentence;
      return out;
    });
  }, [storybookQuery.data, pattern.vc]);

  const vcLetters = useMemo(() => pattern.vc.split(''), [pattern.vc]);

  // 진척: `${wordIdx}-${letterIdx}` 완료 set
  const [done, setDone] = useState<Set<string>>(new Set());
  const [currentWordIdx, setCurrentWordIdx] = useState(0);

  // 현재 단어의 모든 VC 글자 완료 여부
  const currentWordDone = useMemo(
    () => vcLetters.every((_, l) => done.has(`${currentWordIdx}-${l}`)),
    [currentWordIdx, vcLetters, done]
  );
  const allComplete = useMemo(
    () =>
      cvcWords.length > 0 &&
      cvcWords.every((_, w) => vcLetters.every((_, l) => done.has(`${w}-${l}`))),
    [cvcWords, vcLetters, done]
  );

  // 단어 완료 감지 → 단어 발음 + 다음 단어 자동 이동 (또는 전체 완료시 칭찬)
  useEffect(() => {
    if (!currentWordDone) return;
    const cw = cvcWords[currentWordIdx];
    if (!cw) return;

    let cancelled = false;
    (async () => {
      // 잠시 대기 후 단어 전체 발음
      await new Promise((r) => setTimeout(r, 600));
      if (cancelled) return;
      const wordUrl = await resolveTtsUrl({
        text: cw.word,
        language: 'english',
        storybookId: unitId,
        identifierPrefix: 'cvc-write-word',
      });
      const after = () => {
        if (cancelled) return;
        if (allComplete) {
          setTimeout(() => playCorrectSequence({ language: 'en', onDone: onMarkComplete }), 400);
        } else {
          // 다음 미완료 단어로
          const next = cvcWords.findIndex(
            (_, w) => !vcLetters.every((_, l) => done.has(`${w}-${l}`))
          );
          if (next !== -1 && next !== currentWordIdx) {
            setTimeout(() => setCurrentWordIdx(next), 600);
          }
        }
      };
      if (wordUrl) playAudio(wordUrl, after);
      else after();
    })();
    return () => {
      cancelled = true;
    };
  }, [
    currentWordDone,
    currentWordIdx,
    cvcWords,
    vcLetters,
    done,
    allComplete,
    unitId,
    playAudio,
    playCorrectSequence,
    onMarkComplete,
  ]);

  // 한 글자 통과 핸들러 — 띵동 → 글자 음가 → 상태 업데이트
  const makeHandleLetter = useCallback(
    (wordIdx: number, letterIdx: number) => async (passed: boolean) => {
      if (!passed) return;
      if (done.has(`${wordIdx}-${letterIdx}`)) return;
      const letter = vcLetters[letterIdx];

      // 사운드: 띵동 → 글자 음가
      const letterUrl = letter
        ? await resolveTtsUrl({
            text: letter,
            language: 'english',
            storybookId: unitId,
            identifierPrefix: 'cvc-write-letter',
          })
        : undefined;
      const playLetter = () => {
        if (letterUrl) playAudio(letterUrl);
      };
      playAudio('/sounds/game/correct.mp3', playLetter);

      setDone((prev) => {
        if (prev.has(`${wordIdx}-${letterIdx}`)) return prev;
        const next = new Set(prev);
        next.add(`${wordIdx}-${letterIdx}`);
        return next;
      });
    },
    [done, vcLetters, unitId, playAudio]
  );

  const currentWord = cvcWords[currentWordIdx];

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

      {storybookQuery.isLoading ? (
        <div className="flex-1 flex items-center justify-center text-lg font-bold text-ink-500">
          불러오는 중…
        </div>
      ) : cvcWords.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-lg font-bold text-ink-500">
          {pattern.vc} 단어가 없어요.
        </div>
      ) : (
        <>
          {/* chip 줄 — 4 단어 진척 + 임의 선택 */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-4">
            {cvcWords.map((cw, w) => {
              const wordDone = vcLetters.every((_, l) => done.has(`${w}-${l}`));
              const active = currentWordIdx === w;
              return (
                <button
                  key={cw.word}
                  onClick={() => !wordDone && setCurrentWordIdx(w)}
                  disabled={wordDone}
                  className={[
                    'inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-black border-[4px] transition shadow-soft',
                    wordDone
                      ? 'bg-success/15 border-success text-success-700'
                      : active
                        ? 'bg-gradient-to-b from-coral-400 to-coral-600 border-coral-700 text-white shadow-pop scale-105'
                        : 'bg-white border-white text-ink-700 hover:shadow-pop',
                  ].join(' ')}
                  style={
                    wordDone || !active ? undefined : { textShadow: '0 2px 0 rgba(0,0,0,0.15)' }
                  }
                >
                  {wordDone && <span className="text-lg">✓</span>}
                  <span className="text-2xl sm:text-3xl">{cw.word}</span>
                </button>
              );
            })}
          </div>

          {allComplete ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="text-7xl">🎉</div>
              <p className="text-4xl sm:text-5xl font-black text-ink-900">잘했어!</p>
            </div>
          ) : currentWord ? (
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 sm:gap-4">
              {/* 단어 이미지 (위) */}
              {currentWord.imageUrl && (
                <img
                  src={currentWord.imageUrl}
                  alt={currentWord.word}
                  className="w-[clamp(5rem,16vh,9rem)] h-[clamp(5rem,16vh,9rem)] object-cover rounded-3xl border-[5px] border-white shadow-pop"
                />
              )}

              {/* 글자 행: [consonant][a canvas][n canvas] */}
              <div className="flex flex-row items-stretch justify-center gap-3 sm:gap-4">
                {/* 자음 — 디스플레이 (코랄 단색 셀) */}
                <ConsonantCell label={currentWord.consonantBefore} />

                {/* VC 글자들 — 통과 안 했으면 canvas, 통과 시 success 셀 */}
                {vcLetters.map((letter, l) => {
                  const letterDone = done.has(`${currentWordIdx}-${l}`);
                  if (letterDone) {
                    return <DoneCell key={l} label={letter} />;
                  }
                  return (
                    <div key={l} className="w-[clamp(8rem,28vh,18rem)] shrink-0">
                      <LetterWritingCanvas
                        key={`${currentWordIdx}-${l}-${letter}`}
                        letter={letter}
                        onResult={makeHandleLetter(currentWordIdx, l)}
                        autoCheck
                        threshold={20}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </>
      )}

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </div>
  );
}

/** 자음 디스플레이 셀 — 코랄 단색 (CvcPatternLearn 의 'left' tone 과 동일) */
function ConsonantCell({ label }: { label: string }) {
  return (
    <div
      className="h-[clamp(8rem,28vh,18rem)] w-[clamp(7rem,24vh,15rem)] rounded-[28px] border-[4px] flex items-center justify-center shadow-[0_8px_0_rgba(0,0,0,0.08),0_14px_28px_-8px_rgba(0,0,0,0.25)] bg-gradient-to-b from-coral-400 to-coral-500 border-coral-600 text-white"
      style={{
        textShadow: '0 3px 0 rgba(0,0,0,0.18)',
        WebkitTextStroke: '1.5px rgba(255,255,255,0.5)',
        paintOrder: 'stroke fill',
      }}
    >
      <span className="text-[clamp(4rem,18vh,11rem)] font-black leading-none whitespace-nowrap drop-shadow-[0_2px_3px_rgba(0,0,0,0.15)]">
        {label}
      </span>
    </div>
  );
}

/** VC 글자 통과 후 — 흰 success 톤 표시 셀 (canvas 자리 차지하는 폭) */
function DoneCell({ label }: { label: string }) {
  return (
    <div
      className="w-[clamp(8rem,28vh,18rem)] h-[clamp(8rem,28vh,18rem)] shrink-0 rounded-[28px] border-[4px] flex items-center justify-center shadow-pop bg-gradient-to-b from-mint-300 to-mint-400 border-mint-500 text-white relative"
      style={{ textShadow: '0 3px 0 rgba(0,0,0,0.18)' }}
    >
      <span className="text-[clamp(4rem,18vh,11rem)] font-black leading-none whitespace-nowrap">
        {label}
      </span>
      <span className="absolute -top-3 -right-3 inline-flex items-center justify-center w-10 h-10 rounded-full bg-success text-white text-2xl font-black shadow-pop ring-4 ring-white">
        ✓
      </span>
    </div>
  );
}
