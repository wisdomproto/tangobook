import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { WordFillCanvas } from '@/features/phonics/components/WordFillCanvas';
import { resolveTtsUrl } from '@/features/tts';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { ActivityShell } from '../components/ActivityShell';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';
import { patternHighlight } from '../lib/english-phonics-units';

interface Props {
  unitId: string;
  /** vowel + consonant → vc. 예: { vowel: 'a', consonant: 'n', vc: 'an' } */
  pattern: { vowel: string; consonant: string; vc: string };
  onMarkComplete: () => void;
  onBack: () => void;
}

interface CvcWord {
  word: string; // 'cat'
  consonantBefore: string; // 'c'
  imageUrl?: string;
  sentence?: string;
}

/**
 * 영어 CVC 패턴 학습 액티비티 (book2 unit1+).
 *
 * Phase A — VC 학습: 3행 [vowel][consonant][vc]. 각 셀 클릭 시 파닉스 음원.
 *   행 3셀 모두 클릭 → 띵동. 9셀 모두 → 칭찬 + "다음" 버튼.
 *
 * Phase B — CVC 단어 4개: 각 행 [consonantBefore][vc][word]+이미지.
 *   각 셀 클릭 시 파닉스 음원. 행 모두 클릭 → 띵동 + 예문 발음.
 *   4행 모두 → 칭찬 + onMarkComplete.
 *
 * 단어 source: storybook flashcards 중 `phonicPattern === '_${vc}'` 매치 4개.
 */
export function CvcPatternLearnActivity({ unitId, pattern, onMarkComplete, onBack }: Props) {
  const storybookQuery = useStorybook(unitId);
  const { playAudio, playCorrectSequence, praiseVisible } = useGameAudio();

  // ── Phase A: VC 학습 ──
  const [phaseAPressed, setPhaseAPressed] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<'A' | 'B' | 'C' | 'done'>('A');
  const PHASE_A_ROWS = 3;
  const totalPhaseA = PHASE_A_ROWS * 3;

  const playEnglish = useCallback(
    async (text: string, onEnded?: () => void) => {
      const url = await resolveTtsUrl({
        text,
        language: 'english',
        storybookId: unitId,
        identifierPrefix: 'en-cvc',
      });
      if (url) playAudio(url, onEnded);
      else onEnded?.();
    },
    [playAudio, unitId]
  );

  /**
   * 이 패턴(`_an`)을 쓰는 단어들 — Phase A 의 줄별 타겟이자 Phase B 의 행이다.
   * 🔴 Phase A 핸들러가 의존성 배열에서 이걸 읽으므로 **핸들러보다 위에** 있어야 한다
   *    (아래에 두면 렌더 시점에 TDZ 로 터진다).
   */
  const cvcWords = useMemo<CvcWord[]>(() => {
    const sb = storybookQuery.data;
    if (!sb) return [];
    const expectedPattern = `_${pattern.vc}`;
    const matches = (sb.flashcards ?? []).filter((f) => f.phonicPattern === expectedPattern);
    return matches.slice(0, 4).map((f) => {
      const word = f.word ?? '';
      const consonantBefore = word.slice(0, Math.max(0, word.length - pattern.vc.length));
      const out: CvcWord = { word, consonantBefore };
      if (f.imageUrl) out.imageUrl = f.imageUrl;
      if (f.sentence) out.sentence = f.sentence;
      return out;
    });
  }, [storybookQuery.data, pattern.vc]);

  /** Phase A 는 3줄이라 앞 3단어만 쓴다. */
  const phaseAWords = useMemo(() => cvcWords.slice(0, PHASE_A_ROWS), [cvcWords]);

  /**
   * 🔴 **낱말 전체를 쓴다 — 앞 자음까지**(2026-07-31 사용자: "A N 만 쓰지 말고 C 부터 쓰게").
   *    예전엔 앞 자음(`can` 의 `c`)을 주어진 셀로 두고 `an` 만 캔버스였다. 이제 낱말의 모든 글자가
   *    캔버스다. 글자는 낱말마다 다르므로(can/fan/man) **낱말별 글자 목록**으로 든다.
   */
  const wordLetters = useMemo(() => cvcWords.map((w) => w.word.split('')), [cvcWords]);

  /**
   * 🔴 **진입 시 발음 프리워밍**(2026-07-31 사용자: "버튼 누르면 소리가 늦게 나와"). 이 활동만 빠져 있어서
   *    셀을 처음 누를 때마다 서버 왕복을 기다렸다(다른 파닉스 활동엔 다 있는 RULE). 재생과 **같은
   *    prefix(`en-cvc`)·언어(english)** 로 데워야 탭 시 캐시가 맞는다 — Phase C 쓰기 소리도 같은
   *    prefix 로 통일했다(예전엔 `cvc-write-*` 라 같은 글자를 서버가 두 번 만들었다).
   * 🔴 순서 = 패턴 글자(a·n·an) → **낱말 전체(can·fan·man)** → 낱말 글자(c·f·m…). Phase A 는
   *    한 줄을 완성하면(3탭) 바로 낱말을 읽으므로 낱말이 큐 뒤에 있으면 늦는다(사용자: "can 이 너무
   *    늦게 나와"). 낱말을 패턴 바로 뒤로 올린다. 낱말 글자는 Phase C(쓰기)라 나중이라도 된다.
   */
  const warmTexts = useMemo(() => {
    const s = [pattern.vowel, pattern.consonant, pattern.vc];
    for (const w of cvcWords) s.push(w.word);
    for (const ls of wordLetters) s.push(...ls);
    return [...new Set(s)].filter(Boolean);
  }, [pattern, wordLetters, cvcWords]);
  usePhonicsTtsWarm(unitId, warmTexts, 'en-cvc', 'english');

  /**
   * 🔴 소리와 소리 사이엔 쉼 — 콜백만 이으면 1~3ms 간격으로 붙어 한 덩어리로 들린다.
   * 길이를 가정하는 setTimeout 이 아니라, 앞 소리가 **끝난 걸 확인한 뒤** 넣는 쉼이다.
   */
  const REST_MS = 420;
  const restRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (restRef.current) clearTimeout(restRef.current);
    },
    []
  );
  const rest = useCallback((fn: () => void) => {
    if (restRef.current) clearTimeout(restRef.current);
    restRef.current = setTimeout(fn, REST_MS);
  }, []);

  const handlePhaseACell = useCallback(
    (row: number, col: number) => {
      if (phase !== 'A') return;
      const key = `${row}-${col}`;
      // 셀 라벨: 0=vowel, 1=consonant, 2=vc
      const labels = [pattern.vowel, pattern.consonant, pattern.vc];
      const text = labels[col];

      let willRowComplete = false;
      let willAllComplete = false;
      setPhaseAPressed((prev) => {
        if (prev.has(key)) return prev;
        const next = new Set(prev);
        next.add(key);
        if ([0, 1, 2].every((c) => next.has(`${row}-${c}`))) willRowComplete = true;
        if (next.size >= totalPhaseA) willAllComplete = true;
        return next;
      });

      const afterTts = () => {
        if (!willRowComplete) return;
        // 행을 완성하면 그 줄의 타겟 단어가 오른쪽에 나타난다 — 띵동 뒤에 쉬고 그 단어를 읽는다.
        // 🔴 `an` 만 세 줄 반복하면 무엇을 배우는 건지 안 보인다. 줄마다 다른 단어가 붙어야
        //    "an 이 들어간 낱말"이 눈에 들어온다.
        const word = phaseAWords[row]?.word;
        // 🔴 글자 소리 끝 → **쉼** → 띵동. 실측 간격이 0ms 라 한 덩어리로 들렸다(띵동→낱말은 정상이었다).
        rest(() =>
          playAudio('/sounds/game/correct.mp3', () => {
            if (word) rest(() => playEnglish(word, willAllComplete ? afterWord : undefined));
            else if (willAllComplete) afterWord();
          })
        );
      };
      const afterWord = () => rest(() => playCorrectSequence({ language: 'en' }));
      playEnglish(text, afterTts);
    },
    [phase, pattern, totalPhaseA, phaseAWords, playEnglish, playAudio, playCorrectSequence, rest]
  );

  const phaseADone = phaseAPressed.size >= totalPhaseA;

  // ── Phase B: 4 단어 (`cvcWords` 는 위에서 만든다 — Phase A 도 쓴다) ──
  // 단어별 row 진척: Set<`${wordIdx}-${col}`> col: 0=c, 1=vc, 2=word
  const [phaseBPressed, setPhaseBPressed] = useState<Set<string>>(new Set());
  const totalPhaseB = cvcWords.length * 3;

  const handlePhaseBCell = useCallback(
    (wordIdx: number, col: number) => {
      if (phase !== 'B') return;
      const key = `${wordIdx}-${col}`;
      const cw = cvcWords[wordIdx];
      if (!cw) return;
      const text = [cw.consonantBefore, pattern.vc, cw.word][col];

      let willRowComplete = false;
      let willAllComplete = false;
      setPhaseBPressed((prev) => {
        if (prev.has(key)) return prev;
        const next = new Set(prev);
        next.add(key);
        if ([0, 1, 2].every((c) => next.has(`${wordIdx}-${c}`))) willRowComplete = true;
        if (next.size >= totalPhaseB) willAllComplete = true;
        return next;
      });

      const afterTts = () => {
        if (willRowComplete) {
          // 🔴 예문은 여기서 안 읽는다(2026-08-06 사용자) — 써보기에서 낱말을 완성하면 그때 예문
          //    (텍스트+소리)을 준다. 여기선 소리 끝 → 쉼 → 띵동 → (마지막 행이면) Phase C 로 자동 진입.
          rest(() =>
            playAudio('/sounds/game/correct.mp3', () => {
              if (willAllComplete) {
                setTimeout(() => setPhase('C'), 600);
              }
            })
          );
        }
      };
      playEnglish(text, afterTts);
    },
    [phase, cvcWords, pattern.vc, totalPhaseB, playEnglish, playAudio]
  );

  // ── Phase C: 낱말 써보기 — **패턴(라임) 먼저** 한 글자씩(WordFillCanvas, Book 3/4/5 와 통일) ──
  const [writeCurrentWordIdx, setWriteCurrentWordIdx] = useState(0);
  const currentWriteWord = cvcWords[writeCurrentWordIdx];
  const currentWriteLetters = wordLetters[writeCurrentWordIdx] ?? [];
  // 🔴 낱말을 다 쓰면 보여줄 예문(텍스트) — 2026-08-06 사용자: "예문은 써보기에서 맞추면, 텍스트도".
  const [shownSentence, setShownSentence] = useState<string | null>(null);

  /**
   * 🔴 **쓰는 순서 = 라임 먼저**(2026-08-06 사용자: "can 을 a,n,c 순서로"). 라임(`_an` = 위치 [1,2])을
   *    먼저, 그다음 앞 자음. 소리는 시각 순서로 쌓아 읽는다(a→애·an→앤·can→캔).
   */
  const writeOrder = useMemo(() => {
    if (!currentWriteWord) return [] as number[];
    const [s, e] = patternHighlight(currentWriteWord.word, `_${pattern.vc}`);
    const first: number[] = [];
    const rest: number[] = [];
    for (let i = 0; i < currentWriteLetters.length; i++) (i >= s && i < e ? first : rest).push(i);
    return first.length ? [...first, ...rest] : rest;
  }, [currentWriteWord, currentWriteLetters, pattern.vc]);
  const writtenRef = useRef<number[]>([]);
  const wordDoneRef = useRef(false);

  // 한 칸 쓸 때마다 지금까지 쓴 칸을 **시각 순서로** 이어읽는다(애 → 앤 / a → ak → ake).
  // 낱말을 완성하는 마지막 칸의 onSyllableDone 은 WordFillCanvas 가 생략한다(onComplete 가 낱말을 읽음).
  const handleWriteAccum = useCallback(
    (_letter: string, index: number) => {
      if (wordDoneRef.current) return;
      if (!writtenRef.current.includes(index)) writtenRef.current.push(index);
      const soFar = [...writtenRef.current]
        .sort((a, b) => a - b)
        .map((i) => currentWriteLetters[i])
        .join('');
      void (async () => {
        const url = await resolveTtsUrl({
          text: soFar,
          language: 'english',
          storybookId: unitId,
          identifierPrefix: 'en-cvc',
        });
        // 띵동 먼저, 끝나면 이어읽기(단일 채널이라 동시에 내면 앞소리가 잘린다).
        playAudio('/sounds/game/correct.mp3', () => {
          if (url) playAudio(url);
        });
      })();
    },
    [currentWriteLetters, unitId, playAudio]
  );

  // 낱말 완성 → 낱말 읽기 → (마지막이면 칭찬 + onMarkComplete / 아니면 쉼 → 다음 낱말).
  const handleWriteWordDone = useCallback(() => {
    if (wordDoneRef.current) return;
    wordDoneRef.current = true;
    const cw = cvcWords[writeCurrentWordIdx];
    if (!cw) return;
    const isLast = writeCurrentWordIdx + 1 >= cvcWords.length;
    void (async () => {
      const wordUrl = await resolveTtsUrl({
        text: cw.word,
        language: 'english',
        storybookId: unitId,
        identifierPrefix: 'en-cvc',
      });
      const sentenceUrl = cw.sentence
        ? await resolveTtsUrl({
            text: cw.sentence,
            language: 'english',
            storybookId: unitId,
            identifierPrefix: 'en-cvc',
          })
        : undefined;
      const advance = () => {
        if (isLast) {
          setPhase('done');
          onMarkComplete();
          setTimeout(() => playCorrectSequence({ language: 'en' }), 400);
        } else {
          setTimeout(() => {
            wordDoneRef.current = false;
            writtenRef.current = [];
            setShownSentence(null);
            setWriteCurrentWordIdx((i) => i + 1);
          }, 500);
        }
      };
      // 🔴 낱말 → 쉼 → (예문 텍스트 띄우고 + 예문 읽기) → 다음. 예문 없으면 바로 다음.
      const afterWord = () => {
        if (cw.sentence && sentenceUrl) {
          setShownSentence(cw.sentence);
          rest(() => playAudio(sentenceUrl, advance));
        } else {
          advance();
        }
      };
      if (wordUrl) playAudio(wordUrl, afterWord);
      else afterWord();
    })();
  }, [cvcWords, writeCurrentWordIdx, unitId, playAudio, playCorrectSequence, onMarkComplete, rest]);

  // 행별 다음 누를 칸 highlight (Phase B 용)
  const phaseBNextKey = useMemo(() => {
    for (let r = 0; r < cvcWords.length; r++) {
      for (let c = 0; c < 3; c++) {
        if (!phaseBPressed.has(`${r}-${c}`)) return `${r}-${c}`;
      }
    }
    return null;
  }, [cvcWords.length, phaseBPressed]);

  const phaseANextKey = useMemo(() => {
    for (let r = 0; r < PHASE_A_ROWS; r++) {
      for (let c = 0; c < 3; c++) {
        if (!phaseAPressed.has(`${r}-${c}`)) return `${r}-${c}`;
      }
    }
    return null;
  }, [phaseAPressed]);

  const restart = useCallback(() => {
    setPhaseAPressed(new Set());
    setPhaseBPressed(new Set());
    writtenRef.current = [];
    wordDoneRef.current = false;
    setShownSentence(null);
    setWriteCurrentWordIdx(0);
    setPhase('A');
  }, []);

  return (
    <ActivityShell onBack={onBack}>
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-6 sm:gap-10">
        <h2
          className="text-5xl sm:text-6xl md:text-7xl font-black font-display text-center"
          style={{
            color: '#FF7A3C',
            WebkitTextStroke: 'clamp(2px, 0.4vh, 4px) white',
            paintOrder: 'stroke fill',
            filter: 'drop-shadow(0 4px 0 rgba(0,0,0,0.06))',
          }}
        >
          {phase === 'A' && <>{pattern.vc} 배우기</>}
          {phase === 'B' && <>{pattern.vc} 낱말 익히기</>}
          {phase === 'C' && <>{pattern.vc} 써보기</>}
          {phase === 'done' && '잘했어!'}
        </h2>

        {/* Phase A: VC 학습 3행 */}
        {phase === 'A' && (
          <div className="flex flex-col gap-5 sm:gap-7 w-full max-w-3xl">
            {Array.from({ length: PHASE_A_ROWS }).map((_, r) => (
              <div key={r} className="flex flex-row items-center justify-center gap-4 sm:gap-6">
                <Cell
                  label={pattern.vowel}
                  pressed={phaseAPressed.has(`${r}-0`)}
                  isNext={phaseANextKey === `${r}-0`}
                  onClick={() => handlePhaseACell(r, 0)}
                  tone="left"
                />
                <Connector char="+" />
                <Cell
                  label={pattern.consonant}
                  pressed={phaseAPressed.has(`${r}-1`)}
                  isNext={phaseANextKey === `${r}-1`}
                  onClick={() => handlePhaseACell(r, 1)}
                  tone="middle"
                />
                <Connector char="→" />
                <Cell
                  label={pattern.vc}
                  pressed={phaseAPressed.has(`${r}-2`)}
                  isNext={phaseANextKey === `${r}-2`}
                  onClick={() => handlePhaseACell(r, 2)}
                  tone="right"
                />
                {/* 줄을 완성하면 그 줄의 타겟 단어가 여기 나타나며 읽어준다.
                    🔴 **자리는 항상 차지한다** — 나타날 때 생기면 세 줄이 통째로 밀린다. */}
                <PhaseAWordSlot
                  word={phaseAWords[r]}
                  revealed={[0, 1, 2].every((c) => phaseAPressed.has(`${r}-${c}`))}
                  onClick={() => {
                    const w = phaseAWords[r]?.word;
                    if (w) playEnglish(w);
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Phase A 완료 → 다시 / 다음 버튼 */}
        {phase === 'A' && phaseADone && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={restart}
              className="px-6 py-3 rounded-full bg-white border-2 border-coral-300 text-coral-600 font-black text-lg sm:text-xl shadow-soft hover:shadow-pop active:scale-[0.98] transition"
            >
              🔁 다시 해보기
            </button>
            <button
              onClick={() => setPhase('B')}
              className="px-8 py-4 rounded-full bg-coral-500 text-white font-black text-2xl sm:text-3xl shadow-pop hover:scale-[1.02] active:scale-[0.98] transition"
            >
              다음 →
            </button>
          </div>
        )}

        {/* Phase B: 4 CVC 단어 */}
        {phase === 'B' && (
          <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-4xl">
            {storybookQuery.isLoading ? (
              <p className="text-lg font-bold text-ink-500 text-center">불러오는 중…</p>
            ) : cvcWords.length === 0 ? (
              <p className="text-lg font-bold text-ink-500 text-center">
                저작도구에 {pattern.vc} 단어가 없어요.
              </p>
            ) : (
              cvcWords.map((cw, r) => (
                <div
                  key={cw.word}
                  className="flex flex-row items-center justify-center gap-3 sm:gap-4"
                >
                  <Cell
                    label={cw.consonantBefore}
                    pressed={phaseBPressed.has(`${r}-0`)}
                    isNext={phaseBNextKey === `${r}-0`}
                    onClick={() => handlePhaseBCell(r, 0)}
                    tone="left"
                  />
                  <Connector char="+" />
                  <Cell
                    label={pattern.vc}
                    pressed={phaseBPressed.has(`${r}-1`)}
                    isNext={phaseBNextKey === `${r}-1`}
                    onClick={() => handlePhaseBCell(r, 1)}
                    tone="middle"
                  />
                  <Connector char="→" />
                  <Cell
                    label={cw.word}
                    pressed={phaseBPressed.has(`${r}-2`)}
                    isNext={phaseBNextKey === `${r}-2`}
                    onClick={() => handlePhaseBCell(r, 2)}
                    tone="right"
                    wide
                  />
                  {/* 🔴 그림은 **행을 다 누른 뒤에** 나온다(사용자: "c an can 다 누르면 그때 캔 이미지").
                      자리는 미리 잡아(빈 슬롯) 완성 전후로 칸 정렬이 흔들리지 않게 한다. */}
                  {cw.imageUrl && (
                    <div className="w-[clamp(3.5rem,11vh,6rem)] h-[clamp(3.5rem,11vh,6rem)] shrink-0">
                      {phaseBPressed.has(`${r}-0`) &&
                        phaseBPressed.has(`${r}-1`) &&
                        phaseBPressed.has(`${r}-2`) && (
                          <motion.img
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                            src={cw.imageUrl}
                            alt={cw.word}
                            className="w-full h-full object-cover rounded-2xl border-[4px] border-white shadow-pop"
                          />
                        )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Phase C: 낱말 전체 쓰기 — 현재 단어 이미지 + 앞 자음부터 글자별 캔버스([c][a][n]) */}
        {phase === 'C' && currentWriteWord && (
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            {/* chip 줄 — 4 단어 진척 */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {cvcWords.map((cw, w) => {
                const wDone = w < writeCurrentWordIdx;
                const active = writeCurrentWordIdx === w;
                return (
                  <button
                    key={cw.word}
                    onClick={() => !wDone && setWriteCurrentWordIdx(w)}
                    disabled={wDone}
                    className={[
                      'inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl font-black border-[3px] transition shadow-soft',
                      wDone
                        ? 'bg-success/15 border-success text-success-700'
                        : active
                          ? 'bg-gradient-to-b from-coral-400 to-coral-600 border-coral-700 text-white shadow-pop scale-105'
                          : 'bg-white border-white text-ink-700',
                    ].join(' ')}
                  >
                    {wDone && <span>✓</span>}
                    <span className="text-xl sm:text-2xl">{cw.word}</span>
                  </button>
                );
              })}
            </div>
            {/* 🔴 라임 먼저 한 글자씩(WordFillCanvas order) — 지금 쓸 칸이 코랄로 밝고, 소리는 시각
                순서로 쌓여 읽힌다(애 → 앤 → 캔). Book 3/4/5 익히기 써보기와 같은 컴포넌트·규칙. */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 w-full">
              {currentWriteWord.imageUrl && (
                <img
                  src={currentWriteWord.imageUrl}
                  alt={currentWriteWord.word}
                  draggable={false}
                  className="w-[clamp(3.5rem,14vh,8rem)] h-[clamp(3.5rem,14vh,8rem)] object-cover rounded-3xl border-[6px] border-white shadow-pop shrink-0"
                />
              )}
              <div className="w-full max-w-2xl">
                <WordFillCanvas
                  key={writeCurrentWordIdx}
                  word={currentWriteWord.word}
                  syllables={currentWriteLetters}
                  order={writeOrder}
                  onSyllableDone={handleWriteAccum}
                  onComplete={handleWriteWordDone}
                />
              </div>
            </div>
            {/* 🔴 낱말을 다 쓰면 예문 텍스트 — 타겟 낱말은 코랄(소리도 같이 재생). */}
            {shownSentence && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl sm:text-3xl md:text-4xl font-black text-ink-800 text-center max-w-3xl break-keep px-4"
              >
                <SentenceText sentence={shownSentence} word={currentWriteWord.word} />
              </motion.p>
            )}
          </div>
        )}

        {/* Phase done — 다시 / 돌아가기 */}
        {phase === 'done' && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={restart}
              className="px-8 py-4 rounded-full bg-coral-500 text-white font-black text-2xl sm:text-3xl shadow-pop hover:scale-[1.02] active:scale-[0.98] transition"
            >
              🔁 다시 해보기
            </button>
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-full bg-white border-2 border-ink-200 text-ink-700 font-black text-lg sm:text-xl shadow-soft hover:shadow-pop active:scale-[0.98] transition"
            >
              ← 돌아가기
            </button>
          </div>
        )}
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </ActivityShell>
  );
}

/** 예문 텍스트 — 타겟 낱말만 코랄로 강조(대소문자 무시, 단어 경계). */
function SentenceText({ sentence, word }: { sentence: string; word: string }) {
  const parts = sentence.split(new RegExp(`(\\b${word}\\b)`, 'ig'));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === word.toLowerCase() ? (
          <span key={i} className="text-coral-500">
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

function Connector({ char }: { char: '+' | '→' }) {
  return (
    <span
      className="text-3xl sm:text-4xl md:text-5xl font-black select-none"
      style={{ color: '#A68155' }}
      aria-hidden
    >
      {char}
    </span>
  );
}

type CellTone = 'left' | 'middle' | 'right';

/**
 * Phase A 줄 끝의 타겟 단어 — 줄을 완성해야 보인다.
 * 🔴 안 보일 때도 **자리를 지킨다**(`invisible`) — 나타날 때 줄이 밀리면 방금 누른 칸이 움직인다.
 * 단어가 없는 줄(저작 데이터 부족)은 자리도 만들지 않는다.
 */
function PhaseAWordSlot({
  word,
  revealed,
  onClick,
}: {
  word?: CvcWord;
  revealed: boolean;
  onClick: () => void;
}) {
  if (!word) return null;
  return (
    <button
      type="button"
      onClick={revealed ? onClick : undefined}
      aria-hidden={!revealed}
      className={`flex flex-col items-center gap-1 shrink-0 transition-opacity duration-300 ${
        revealed ? 'opacity-100' : 'invisible opacity-0'
      }`}
    >
      {word.imageUrl ? (
        <img
          src={word.imageUrl}
          alt={word.word}
          draggable={false}
          className="h-[clamp(3.5rem,12vh,6.5rem)] w-[clamp(3.5rem,12vh,6.5rem)] rounded-3xl object-cover bg-white shadow-pop ring-4 ring-white"
        />
      ) : (
        <span className="h-[clamp(3.5rem,12vh,6.5rem)] w-[clamp(3.5rem,12vh,6.5rem)] rounded-3xl bg-white shadow-pop ring-4 ring-white flex items-center justify-center text-4xl">
          🔊
        </span>
      )}
      <span className="font-display font-black text-ink-800 text-xl sm:text-2xl leading-none">
        {word.word}
      </span>
    </button>
  );
}

function Cell({
  label,
  pressed,
  isNext,
  onClick,
  tone,
  wide,
}: {
  label: string;
  pressed: boolean;
  isNext: boolean;
  onClick: () => void;
  tone: CellTone;
  wide?: boolean;
}) {
  // 시안 매칭: 행 단위 색 (left=coral / middle=butter / right=mint). 흰 글자 + 흰 outline.
  const bgByTone: Record<CellTone, string> = {
    left: 'bg-gradient-to-b from-coral-400 to-coral-500 border-coral-600',
    middle: 'bg-gradient-to-b from-warn to-amber-400 border-amber-500',
    right: 'bg-gradient-to-b from-mint-300 to-mint-400 border-mint-500',
  };
  return (
    <motion.button
      onClick={onClick}
      animate={isNext ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={isNext ? { duration: 1.2, repeat: Infinity } : { duration: 0.3 }}
      className={[
        'relative h-[clamp(4rem,14vh,7.5rem)] rounded-[28px] border-[4px] flex items-center justify-center shadow-[0_8px_0_rgba(0,0,0,0.08),0_14px_28px_-8px_rgba(0,0,0,0.25)] text-white active:scale-[0.95] transition-shadow font-black',
        wide ? 'min-w-[clamp(6rem,18vh,11rem)] px-4' : 'w-[clamp(4.5rem,14vh,8rem)]',
        bgByTone[tone],
        pressed
          ? 'ring-4 ring-success/60'
          : isNext
            ? 'ring-[6px] ring-coral-300 shadow-[0_0_30px_rgba(255,94,58,0.5)]'
            : '',
      ].join(' ')}
      style={{
        textShadow: '0 3px 0 rgba(0,0,0,0.18)',
        WebkitTextStroke: '1.5px rgba(255,255,255,0.5)',
        paintOrder: 'stroke fill',
      }}
    >
      <span className="text-4xl sm:text-5xl md:text-6xl whitespace-nowrap drop-shadow-[0_2px_3px_rgba(0,0,0,0.15)]">
        {label}
      </span>
      {pressed && (
        <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-success text-white text-sm font-black shadow-pop ring-2 ring-white">
          ✓
        </span>
      )}
      {isNext && !pressed && (
        <span
          aria-hidden
          className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-3xl animate-bounce"
        >
          👆
        </span>
      )}
    </motion.button>
  );
}
