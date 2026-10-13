import { LEARNING_SOUNDS } from '@/features/games/effects/learning-sounds';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { LetterFillCanvas } from '@/features/phonics/components/LetterFillCanvas';
import { resolveTtsUrl } from '@/features/tts';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { useEntryGuide, ENTRY_GUIDE, praiseLang } from '../hooks/useEntryGuide';
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

/** 칸 폭 — 캔버스·대기 칸·완료 칸이 다 이걸 쓴다(한 글자로 읽히게 같은 크기). */
const TILE = 'min(32vw,28vh,18rem)';
/** 대기 칸 글자 크기 — `LetterFillCanvas` 가 캔버스에 `0.85em` 으로 그리므로 칸 폭×0.85 로 맞춘다. */
const TILE_FONT = `calc(${TILE} * 0.85)`;
/** 대기 칸 = 캔버스와 똑같이 생긴 판(흰 바탕 + 회색 글자). 차이는 색이 아니라 **반짝임**이다. */
const IDLE_TILE_CLASS =
  'shrink-0 aspect-square rounded-3xl border-2 border-ink-100 bg-white/70 flex items-center justify-center font-display font-black text-[#e5e7eb] shadow-soft leading-none';

/** 지금 쓸 칸 — 캔버스를 감싸고 **반짝이는 테두리**를 얹는다(정사각 영역에만). */
function WriteCell({ children }: { children: ReactNode }) {
  return (
    <div className="relative shrink-0" style={{ width: TILE }}>
      {children}
      <span className="pointer-events-none absolute inset-x-0 top-0 aspect-square rounded-xl ring-4 ring-coral-400 animate-pulse" />
    </div>
  );
}

/**
 * 영어 CVC 쓰기 액티비티 — VC 글자별 분리 canvas (book2 unit1+).
 *
 * 한 단어 화면: 위 단어 이미지 + 아래 [consonant 셀][VC 1 canvas][VC 2 canvas].
 * 각 VC canvas 통과 시: 띵동 → 음가. 단어의 모든 VC 통과 → 단어 전체 발음 → 다음 단어.
 * 4 단어 모두 통과 → 칭찬 + onMarkComplete.
 */
export function CvcPatternWriteActivity({ unitId, pattern, onMarkComplete, onBack }: Props) {
  const { t } = useTranslation('phonics');
  const storybookQuery = useStorybook(unitId);
  const { playAudio, playCorrectSequence, praiseVisible, scheduleTimer, stopAll } = useGameAudio();
  // 🔴 진입 안내 — 이제 **지금 쓸 칸만 반짝이고 순서대로**(C→A→N) 쓴다 → "반짝이는 칸에 써 봐!"(한글 자음 쓰기와 동일).
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
  const doneRef = useRef(new Set<string>());
  const speechGen = useRef(0);
  useEffect(
    () => () => {
      speechGen.current++;
    },
    []
  );
  const selectWord = useCallback(
    (index: number) => {
      speechGen.current++;
      stopAll();
      setCurrentWordIdx(index);
    },
    [stopAll]
  );

  const currentWordLetters = wordLetters[currentWordIdx] ?? [];
  // 🔴 지금 쓸 글자 = 앞에서부터 첫 미완 — 이 칸만 캔버스로 열어 순서(C→A→N)를 강제한다.
  const currentLetterIdx = currentWordLetters.findIndex(
    (_, l) => !done.has(`${currentWordIdx}-${l}`)
  );
  const allComplete = useMemo(
    () =>
      cvcWords.length > 0 &&
      wordLetters.every((ls, w) => ls.every((_, l) => done.has(`${w}-${l}`))),
    [cvcWords.length, wordLetters, done]
  );

  // 화면은 즉시 다음 칸을 연다. 확인음이 실제로 끝난 뒤 쉼 → 누적/완성 낱말.
  const makeHandleLetter = useCallback(
    (wordIdx: number, letterIdx: number) => (passed: boolean) => {
      const key = `${wordIdx}-${letterIdx}`;
      if (!passed || doneRef.current.has(key)) return;
      const word = cvcWords[wordIdx]?.word;
      if (!word) return;
      const nextDone = new Set(doneRef.current).add(key);
      doneRef.current = nextDone;
      setDone(nextDone);
      const gen = ++speechGen.current;
      const isLast = letterIdx === word.length - 1;
      const read = isLast ? word : word.slice(0, letterIdx + 1);
      const urlPromise = resolveTtsUrl({
        text: read,
        language: 'english',
        storybookId: unitId,
        identifierPrefix: 'en-cvc',
      });
      const advance = () => {
        if (gen !== speechGen.current) return;
        const finished = wordLetters.every((ls, w) =>
          ls.every((_, l) => nextDone.has(`${w}-${l}`))
        );
        if (finished) {
          scheduleTimer(
            () =>
              playCorrectSequence({
                language: praiseLang(),
                onDone: () => {
                  onMarkComplete();
                  onBack();
                },
              }),
            REST_MS
          );
        } else {
          const next = wordLetters.findIndex(
            (ls, w) => !ls.every((_, l) => nextDone.has(`${w}-${l}`))
          );
          if (next !== -1) selectWord(next);
        }
      };
      playAudio(LEARNING_SOUNDS.correct, () => {
        scheduleTimer(() => {
          void urlPromise.then((url) => {
            if (gen !== speechGen.current) return;
            playAudio(url, isLast ? advance : undefined);
          });
        }, REST_MS);
      });
    },
    [
      cvcWords,
      wordLetters,
      unitId,
      playAudio,
      scheduleTimer,
      playCorrectSequence,
      selectWord,
      onMarkComplete,
      onBack,
    ]
  );

  const currentWord = cvcWords[currentWordIdx];

  return (
    <ActivityShell unitId={unitId} kind="write" onBack={onBack}>
      {storybookQuery.isLoading ? (
        <div className="flex-1 flex items-center justify-center text-lg font-bold text-ink-500">
          {t('common.loading')}
        </div>
      ) : cvcWords.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-lg font-bold text-ink-500">
          {t('cvc.noWords', { pattern: pattern.vc })}
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
                  data-learning-fx="tap"
                  key={cw.word}
                  onClick={() => !wordDone && selectWord(w)}
                  disabled={wordDone}
                  className={[
                    'inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-black border-[4px] transition shadow-soft',
                    wordDone
                      ? 'bg-success/15 border-success text-success-700'
                      : active
                        ? 'bg-coral-700 border-coral-700 text-white shadow-soft scale-105'
                        : 'bg-white border-white text-ink-700 hover:shadow-soft',
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
              <div className="phonics-complete-mark" aria-hidden>
                ✓
              </div>
              <p className="text-4xl sm:text-5xl font-black text-ink-900">{t('common.wellDone')}</p>
            </div>
          ) : currentWord ? (
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 sm:gap-4">
              {/* 단어 이미지 (위) */}
              {currentWord.imageUrl && (
                <img
                  src={currentWord.imageUrl}
                  alt={currentWord.word}
                  className="w-[min(22vw,16vh,9rem)] h-[min(22vw,16vh,9rem)] object-cover rounded-3xl border-2 border-ink-100 shadow-soft"
                />
              )}

              {/* 글자 행 — 🔴 **앞부터 순서대로**(C→A→N) 쓴다(2026-08-02 사용자: "아무거나 시작할 수
                  있잖아"). 지금 쓸 칸만 반짝이는 캔버스, 이미 쓴 칸은 민트, 아직 차례 아닌 칸은 회색 대기 판.
                  `items-start` — 캔버스 아래 진척물로 래퍼가 자라도 옆 칸과 글자 높이가 안 어긋난다. */}
              <div className="flex flex-row items-start justify-center gap-3 sm:gap-4">
                {currentWordLetters.map((letter, l) => {
                  if (done.has(`${currentWordIdx}-${l}`)) {
                    return <DoneCell key={l} label={letter} />;
                  }
                  // 지금 쓸 칸 = 앞에서부터 첫 미완 글자. 그 뒤 칸은 아직 차례가 아니다(안 써진다).
                  if (l !== currentLetterIdx) {
                    return (
                      <div
                        key={l}
                        className={IDLE_TILE_CLASS}
                        style={{ width: TILE, fontSize: TILE_FONT }}
                      >
                        {letter}
                      </div>
                    );
                  }
                  return (
                    // 🔴 기준은 `LetterFillCanvas.DEFAULT_THRESHOLD`(99%) 한 곳 — 숫자 안 넘긴다.
                    <WriteCell key={l}>
                      <LetterFillCanvas
                        key={`${currentWordIdx}-${l}-${letter}`}
                        letter={letter}
                        guidance="none"
                        onResult={makeHandleLetter(currentWordIdx, l)}
                        autoCheck
                      />
                    </WriteCell>
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
      className="w-[min(32vw,28vh,18rem)] h-[min(32vw,28vh,18rem)] shrink-0 rounded-[28px] border-[4px] flex items-center justify-center shadow-soft bg-mint-100 border-mint-400 text-mint-700 relative"
      style={{ textShadow: 'none' }}
    >
      <span className="text-[clamp(4rem,18vh,11rem)] font-black leading-none whitespace-nowrap">
        {label}
      </span>
      <span className="absolute -top-3 -right-3 inline-flex items-center justify-center w-10 h-10 rounded-full bg-success text-white text-2xl font-black shadow-soft ring-4 ring-white">
        ✓
      </span>
    </div>
  );
}
