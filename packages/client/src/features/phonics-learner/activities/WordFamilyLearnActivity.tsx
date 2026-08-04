import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { warmAudioUrl, usePreloadImages } from '@/features/games/hooks/useGamePrefetch';
import { ActivityShell } from '../components/ActivityShell';
import { useActivitySound } from '../hooks/useActivitySound';
import { useEntryGuide, ENTRY_GUIDE } from '../hooks/useEntryGuide';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';
import { WordFillCanvas } from '@/features/phonics/components/WordFillCanvas';
import {
  patternLabel as makePatternLabel,
  patternHighlightRanges,
} from '../lib/english-phonics-units';

export interface FamilyWord {
  word: string;
  imageUrl?: string;
  /** 저작 녹음(R2). 🔴 영어는 이게 있으면 이걸 그대로 읽는다 — 서버 concat 은 라이브러리에 없으면 무음이다. */
  ttsUrl?: string;
}

interface Props {
  unitId: string;
  /** 철자 패턴 — `_ame`·`bl_`·`ee`. 라벨·강조를 이걸로 파생한다. */
  pattern: string;
  words: ReadonlyArray<FamilyWord>;
  onMarkComplete: () => void;
  onBack: () => void;
}

/** 글자별로 강조 — 범위 안이면 코랄, 밖이면 회색. 🔴 매직 e 는 모음·끝 e 두 곳이 떨어져 있어 범위가 둘이다. */
function Highlighted({
  text,
  ranges,
}: {
  text: string;
  ranges: ReadonlyArray<readonly [number, number]>;
}) {
  const on = (i: number) => ranges.some(([s, e]) => i >= s && i < e);
  return (
    <>
      {[...text].map((ch, i) => (
        <span key={i} className={on(i) ? 'text-coral-500' : 'text-ink-400'}>
          {ch}
        </span>
      ))}
    </>
  );
}

/**
 * 🔊 낱말가족 배우기 — 이퓨처 「Learn: Listen and repeat」의 낱말가족 버전(2026-08-01).
 *
 * 🔴 Book 2 의 `cvc-pattern-learn` 은 CVC 전용(자음+라임)이라 Magic-e(`-ake`)·앞 블렌드(`bl-`)·
 *    모음팀(`ee`)에 안 맞는다. 그래서 세 유형을 **한 화면**으로: 낱말들을 나란히 놓고 **공통 철자만
 *    코랄로 강조**해 "같은 자리에 같은 글자" 를 눈으로 보여주고, 눌러서 그 낱말을 듣는다.
 *    (예전엔 이 자리에 듣고 고르기 퀴즈를 뒀는데 그건 배우기가 아니라 시험이었다 — 사용자 지적.)
 *
 * 다 들으면 칭찬 + 완료. 그 뒤엔 아무 낱말이나 눌러 다시 듣는다(자유놀이).
 */
export function WordFamilyLearnActivity({ unitId, pattern, words, onMarkComplete, onBack }: Props) {
  const label = makePatternLabel(pattern);
  const labelRanges = patternHighlightRanges(label, pattern);
  const { say, rest, playCorrectSequence, praiseVisible, playAudio } = useActivitySound({
    unitId,
    language: 'english',
    prefix: 'en-family',
  });
  // 진입 안내 — 화면의 "낱말을 눌러 들어봐!" 에 맞는 음성(사용자: 화면마다 멘트 통일).
  useEntryGuide(ENTRY_GUIDE.listenExplore, playAudio);

  /** 낱말별 저작 녹음 — 탭이 이걸 directUrl 로 그대로 재생한다(있을 때). */
  const ttsByWord = useMemo(() => {
    const m = new Map<string, string>();
    for (const w of words) if (w.ttsUrl) m.set(w.word, w.ttsUrl);
    return m;
  }, [words]);

  // 🔴 탭은 authored ttsUrl 을 그대로 읽으므로 **그 mp3 URL 을** 데운다(첫 탭 즉시 재생).
  //    ttsUrl 없는 낱말만 concat 폴백이라, 그건 usePhonicsTtsWarm 이 낱말 텍스트로 데운다(가드도 만족).
  const ttsUrls = useMemo(
    () => words.map((w) => w.ttsUrl).filter((u): u is string => !!u),
    [words]
  );
  useEffect(() => {
    let alive = true;
    void (async () => {
      for (const url of ttsUrls) {
        if (!alive) return;
        try {
          await warmAudioUrl(url);
        } catch {
          /* 한 건 실패가 나머지를 막지 않는다 */
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [ttsUrls]);
  usePhonicsTtsWarm(
    unitId,
    useMemo(() => words.filter((w) => !w.ttsUrl).map((w) => w.word), [words]),
    'en-family',
    'english'
  );
  // 낱말 그림(있는 것만) — 음원처럼 진입 시 데운다(게임과 동일 프리미티브).
  usePreloadImages(useMemo(() => words.map((w) => w.imageUrl), [words]));

  const [heard, setHeard] = useState<Set<string>>(new Set());
  const doneRef = useRef(false);
  /**
   * 🔴 배우기(Listen&repeat) 뒤에 **써보기**가 이어진다(2026-08-04 사용자: "배우기랑 써보기를 합치자").
   *    Book 2 의 cvc-pattern-learn 이 A→B→C 로 흐르는 것과 같은 모양 — 여기선 learn → write 두 단계.
   */
  const [phase, setPhase] = useState<'learn' | 'write'>('learn');
  const [writeIdx, setWriteIdx] = useState(0);
  const writeDoneRef = useRef(false);

  const handleTap = useCallback(
    (word: string) => {
      let willAll = false;
      setHeard((prev) => {
        if (prev.has(word)) return prev;
        const next = new Set(prev);
        next.add(word);
        if (next.size >= words.length) willAll = true;
        return next;
      });
      // 낱말을 읽어주고(저작 녹음 우선), 마지막 하나가 채워지면 칭찬 → **써보기 단계로**.
      say(
        word,
        () => {
          if (willAll && !doneRef.current) {
            doneRef.current = true;
            rest(() => playCorrectSequence({ language: 'en', onDone: () => setPhase('write') }));
          }
        },
        ttsByWord.get(word)
      );
    },
    [say, rest, playCorrectSequence, words.length, ttsByWord]
  );

  // ── 써보기 단계 — 낱말 전체를 한 글자씩 쓰고, 다 쓰면 그 낱말을 읽어준 뒤 다음 낱말 ──
  const writeWord = words[writeIdx];
  const writeLetters = useMemo(() => (writeWord ? [...writeWord.word] : []), [writeWord]);

  const handleWriteComplete = useCallback(() => {
    if (writeDoneRef.current) return;
    writeDoneRef.current = true;
    const w = words[writeIdx];
    if (!w) return;
    const isLast = writeIdx + 1 >= words.length;
    // 🔴 다 쓰면 낱말 읽기 → (마지막이면 칭찬 → 완료 / 아니면 쉼 → 다음 낱말). onEnded 체인이라 안 잘린다.
    say(
      w.word,
      () => {
        if (isLast) {
          playCorrectSequence({ language: 'en', onDone: onMarkComplete });
        } else {
          rest(() => {
            writeDoneRef.current = false;
            setWriteIdx((i) => i + 1);
          });
        }
      },
      ttsByWord.get(w.word)
    );
  }, [words, writeIdx, say, rest, playCorrectSequence, onMarkComplete, ttsByWord]);

  const dots = (
    <div className="flex items-center gap-1.5">
      {words.map((w) => (
        <span
          key={w.word}
          className={`w-3 h-3 rounded-full ${heard.has(w.word) ? 'bg-mint-400' : 'bg-white/70 ring-2 ring-white'}`}
        />
      ))}
    </div>
  );

  // ── 써보기 화면 — 낱말 전체를 한 글자씩 쓴다(매직 e 는 모음·끝 e 가 코랄로 남는다) ──
  if (phase === 'write' && writeWord) {
    const writeDots = (
      <div className="flex items-center gap-1.5">
        {words.map((w, i) => (
          <span
            key={w.word}
            className={`w-3 h-3 rounded-full ${i < writeIdx ? 'bg-mint-400' : i === writeIdx ? 'bg-coral-400 ring-2 ring-coral-200' : 'bg-white/70 ring-2 ring-white'}`}
          />
        ))}
      </div>
    );
    return (
      <ActivityShell onBack={onBack} headerRight={writeDots}>
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 sm:gap-4">
          <div
            className="text-3xl sm:text-4xl font-black font-display"
            style={{
              WebkitTextStroke: 'clamp(1.5px, 0.3vh, 3px) white',
              paintOrder: 'stroke fill',
            }}
          >
            <Highlighted text={label} ranges={labelRanges} />
          </div>
          <p className="text-lg sm:text-xl font-black text-ink-600">따라 써봐!</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 w-full">
            {writeWord.imageUrl && (
              <img
                src={writeWord.imageUrl}
                alt={writeWord.word}
                draggable={false}
                className="w-[clamp(3.5rem,14vh,8rem)] h-[clamp(3.5rem,14vh,8rem)] object-cover rounded-3xl border-[6px] border-white shadow-pop shrink-0"
              />
            )}
            <div className="w-full max-w-2xl">
              <WordFillCanvas
                key={writeIdx}
                word={writeWord.word}
                syllables={writeLetters}
                onComplete={handleWriteComplete}
              />
            </div>
          </div>
        </div>
        <FeedbackOverlay kind="correct" visible={praiseVisible} />
      </ActivityShell>
    );
  }

  return (
    <ActivityShell onBack={onBack} headerRight={dots}>
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 sm:gap-6">
        <div className="text-center">
          <div
            className="text-5xl sm:text-6xl md:text-7xl font-black font-display"
            style={{
              WebkitTextStroke: 'clamp(2px, 0.4vh, 4px) white',
              paintOrder: 'stroke fill',
            }}
          >
            <Highlighted text={label} ranges={labelRanges} />
          </div>
          <p className="mt-1 text-lg sm:text-xl font-black text-ink-600">낱말을 눌러 들어봐!</p>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-2xl">
          {words.map((w) => {
            const ranges = patternHighlightRanges(w.word, pattern);
            const done = heard.has(w.word);
            return (
              <motion.button
                key={w.word}
                onClick={() => handleTap(w.word)}
                whileTap={{ scale: 0.97 }}
                className={[
                  'relative flex items-center gap-4 sm:gap-6 min-h-[44px] px-4 sm:px-6 py-3 rounded-[28px] border-[4px] shadow-pop transition',
                  done ? 'bg-mint-100 border-mint-400' : 'bg-white border-white',
                ].join(' ')}
              >
                {w.imageUrl ? (
                  <img
                    src={w.imageUrl}
                    alt={w.word}
                    draggable={false}
                    className="w-[clamp(3.5rem,10vh,6rem)] h-[clamp(3.5rem,10vh,6rem)] object-cover rounded-2xl bg-cream-50 shrink-0"
                  />
                ) : (
                  <span className="w-[clamp(3.5rem,10vh,6rem)] h-[clamp(3.5rem,10vh,6rem)] rounded-2xl bg-cream-50 shrink-0 flex items-center justify-center text-4xl">
                    🔊
                  </span>
                )}
                {/* 🔴 강조 글자만 코랄 — 매직 e 는 모음·끝 e 두 곳(가운데 자음은 회색), 그 외는 패턴 한 덩어리. */}
                <span className="flex-1 text-left text-5xl sm:text-6xl font-black font-display lowercase tracking-tight">
                  <Highlighted text={w.word} ranges={ranges} />
                </span>
                {done && (
                  <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-8 h-8 rounded-full bg-success text-white text-lg font-black shadow-pop ring-2 ring-white">
                    ✓
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </ActivityShell>
  );
}
