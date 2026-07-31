import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { LetterFillCanvas } from '@/features/phonics/components/LetterFillCanvas';
import { resolveTtsUrl } from '@/features/tts';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { useEntryGuide, ENTRY_GUIDE } from '../hooks/useEntryGuide';
import { REST_MS } from '../hooks/useActivitySound';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { ActivityShell } from '../components/ActivityShell';

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
  const { playAudio, playCorrectSequence, praiseVisible, scheduleTimer } = useGameAudio();
  // 🔴 진입 안내 — 지시가 텍스트뿐이라 글 못 읽는 아이엔 통째로 무음이었다(쓰기 6종 공통).
  useEntryGuide(ENTRY_GUIDE.write, playAudio);

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

  /**
   * 🔴 **낱말 전체를 쓴다 — 앞 자음부터**(2026-07-31 사용자: "A N 만 쓰지 말고 C 부터"). CvcPatternLearn
   *    Phase C 와 같은 규칙 — 앞 자음(`fan` 의 `f`)도 캔버스다. 글자는 낱말마다 다르다.
   */
  const wordLetters = useMemo(() => cvcWords.map((w) => w.word.split('')), [cvcWords]);

  /**
   * 🔴 **진입 시 발음 프리워밍**(2026-07-31). 이 활동만 빠져 있어 쓸 때마다 서버 왕복을 기다렸다.
   *    재생하는 건 **누적 블렌드**(f→fa→fan)라 그 조각들을 데운다. prefix 는 CvcPatternLearn 과 같은
   *    `en-cvc` 로 통일 — 같은 낱말/글자를 서버가 두 번 만들지 않는다.
   */
  const warmTexts = useMemo(() => {
    const s = new Set<string>();
    for (const w of cvcWords) for (let k = 1; k <= w.word.length; k++) s.add(w.word.slice(0, k));
    return [...s].filter(Boolean);
  }, [cvcWords]);
  usePhonicsTtsWarm(unitId, warmTexts, 'en-cvc', 'english');

  // 진척: `${wordIdx}-${letterIdx}` 완료 set
  const [done, setDone] = useState<Set<string>>(new Set());
  const [currentWordIdx, setCurrentWordIdx] = useState(0);

  const currentWordLetters = wordLetters[currentWordIdx] ?? [];
  // 현재 단어의 모든 글자 완료 여부
  const currentWordDone = useMemo(
    () =>
      currentWordLetters.length > 0 &&
      currentWordLetters.every((_, l) => done.has(`${currentWordIdx}-${l}`)),
    [currentWordIdx, currentWordLetters, done]
  );
  const allComplete = useMemo(
    () =>
      cvcWords.length > 0 &&
      wordLetters.every((ls, w) => ls.every((_, l) => done.has(`${w}-${l}`))),
    [cvcWords.length, wordLetters, done]
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
        identifierPrefix: 'en-cvc',
      });
      const after = () => {
        if (cancelled) return;
        if (allComplete) {
          // 🔴 끝나면 **단원으로 돌아간다** — 예전엔 진척만 기록하고 화면이 그대로 멈춰서,
          //    남은 건 「← 돌아가기」뿐이었다(형제 화면 `letters-write` 는 복귀한다).
          scheduleTimer(
            () =>
              playCorrectSequence({
                language: 'en',
                onDone: () => {
                  onMarkComplete();
                  onBack();
                },
              }),
            REST_MS
          );
        } else {
          // 다음 미완료 단어로
          const next = wordLetters.findIndex((ls, w) => !ls.every((_, l) => done.has(`${w}-${l}`)));
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
    wordLetters,
    done,
    allComplete,
    unitId,
    playAudio,
    playCorrectSequence,
    onMarkComplete,
  ]);

  /**
   * 한 글자 통과 — 띵동 → **거기까지 쌓인 소리**.
   *
   * 🔴 낱글자(`a`·`n`)가 아니라 **블렌딩**을 들려준다: f 다음 a 를 쓰면 `fa`, n 을 쓰면 `fan`.
   *    파닉스는 글자를 따로 아는 게 아니라 **이어 붙여 읽는 것**이 목표라, 쓸 때마다 그 순간까지의
   *    소리가 자라야 한다.
   * 🔴 마지막 글자는 여기서 읽지 않는다 — 단어 완료 effect 가 단어 전체를 읽으므로 겹친다.
   */
  const makeHandleLetter = useCallback(
    (wordIdx: number, letterIdx: number) => async (passed: boolean) => {
      if (!passed) return;
      if (done.has(`${wordIdx}-${letterIdx}`)) return;
      // 🔴 앞 자음부터 낱말 전체를 쓰므로, 여기까지 이어 읽기는 낱말의 앞부분이다(f → fa → fan).
      const word = cvcWords[wordIdx]?.word ?? '';
      const isLast = letterIdx === word.length - 1;
      const blend = isLast ? undefined : word.slice(0, letterIdx + 1);

      // 사운드: 띵동 → 여기까지 이어 읽기
      const blendUrl = blend
        ? await resolveTtsUrl({
            text: blend,
            language: 'english',
            storybookId: unitId,
            identifierPrefix: 'en-cvc',
          })
        : undefined;
      // 🔴 띵동 → **쉼** → 이어읽기. 붙여 내면 한 덩어리로 들린다(공용 규칙, `useActivitySound`).
      playAudio('/sounds/game/correct.mp3', () => {
        if (blendUrl) scheduleTimer(() => playAudio(blendUrl), REST_MS);
      });

      setDone((prev) => {
        if (prev.has(`${wordIdx}-${letterIdx}`)) return prev;
        const next = new Set(prev);
        next.add(`${wordIdx}-${letterIdx}`);
        return next;
      });
    },
    [done, cvcWords, unitId, playAudio, scheduleTimer]
  );

  const currentWord = cvcWords[currentWordIdx];

  return (
    <ActivityShell onBack={onBack}>
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
              const wordDone = (wordLetters[w] ?? []).every((_, l) => done.has(`${w}-${l}`));
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
                  className="w-[min(22vw,16vh,9rem)] h-[min(22vw,16vh,9rem)] object-cover rounded-3xl border-[5px] border-white shadow-pop"
                />
              )}

              {/* 글자 행 — 🔴 앞 자음부터 낱말 전체를 쓴다(예전엔 자음이 주어진 셀이었다) */}
              <div className="flex flex-row items-stretch justify-center gap-3 sm:gap-4">
                {/* 통과 안 했으면 canvas, 통과 시 success 셀 */}
                {currentWordLetters.map((letter, l) => {
                  const letterDone = done.has(`${currentWordIdx}-${l}`);
                  if (letterDone) {
                    return <DoneCell key={l} label={letter} />;
                  }
                  return (
                    <div key={l} className="w-[min(32vw,28vh,18rem)] shrink-0">
                      {/* 🔴 이 화면만 `LetterWritingCanvas` + `threshold={20}` 이었다 — 세로 직선 두 개만
                          그어도 `n` 이 통과했다(실측). 나머지 쓰기 12곳은 전부 `LetterFillCanvas` 99% 다.
                          plan 에 키가 없어 아무도 못 열던 화면이라 기준 통일에서 빠져 있었다.
                          🔴 숫자는 넘기지 않는다 — 기준은 `LetterFillCanvas.DEFAULT_THRESHOLD` 한 곳에만. */}
                      <LetterFillCanvas
                        key={`${currentWordIdx}-${l}-${letter}`}
                        letter={letter}
                        onResult={makeHandleLetter(currentWordIdx, l)}
                        autoCheck
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
    </ActivityShell>
  );
}

/** 글자 통과 후 — 흰 success 톤 표시 셀 (canvas 자리 차지하는 폭) */
function DoneCell({ label }: { label: string }) {
  return (
    <div
      className="w-[min(32vw,28vh,18rem)] h-[min(32vw,28vh,18rem)] shrink-0 rounded-[28px] border-[4px] flex items-center justify-center shadow-pop bg-gradient-to-b from-mint-300 to-mint-400 border-mint-500 text-white relative"
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
