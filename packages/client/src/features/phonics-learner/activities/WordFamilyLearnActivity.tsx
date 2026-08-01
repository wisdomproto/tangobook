import { useCallback, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { ActivityShell } from '../components/ActivityShell';
import { useActivitySound } from '../hooks/useActivitySound';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';

export interface FamilyWord {
  word: string;
  imageUrl?: string;
}

interface Props {
  unitId: string;
  /** 표기 라벨 — `-ake` / `bl-` / `ee`. 헤더에 크게 띄운다. */
  patternLabel: string;
  /** 낱말 안에서 공통 철자가 앉는 자리 `[start, end)`. */
  highlightOf: (word: string) => [number, number];
  words: ReadonlyArray<FamilyWord>;
  onMarkComplete: () => void;
  onBack: () => void;
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
export function WordFamilyLearnActivity({
  unitId,
  patternLabel,
  highlightOf,
  words,
  onMarkComplete,
  onBack,
}: Props) {
  const { say, rest, playCorrectSequence, praiseVisible } = useActivitySound({
    unitId,
    language: 'english',
    prefix: 'en-family',
  });

  // 🔴 재생과 같은 prefix·언어로 데운다(탭이 resolveTtsUrl(word) 로 재생하므로 낱말을 데우면 맞는다).
  usePhonicsTtsWarm(
    unitId,
    useMemo(() => words.map((w) => w.word), [words]),
    'en-family',
    'english'
  );

  const [heard, setHeard] = useState<Set<string>>(new Set());
  const doneRef = useRef(false);

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
      // 낱말을 읽어주고, 마지막 하나가 채워지면(그리고 처음이면) 칭찬 → 완료.
      say(word, () => {
        if (willAll && !doneRef.current) {
          doneRef.current = true;
          rest(() => {
            playCorrectSequence({ language: 'en' });
            onMarkComplete();
          });
        }
      });
    },
    [say, rest, playCorrectSequence, onMarkComplete, words.length]
  );

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

  return (
    <ActivityShell onBack={onBack} headerRight={dots}>
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 sm:gap-6">
        <div className="text-center">
          <div
            className="text-5xl sm:text-6xl md:text-7xl font-black font-display"
            style={{
              color: '#FF7A3C',
              WebkitTextStroke: 'clamp(2px, 0.4vh, 4px) white',
              paintOrder: 'stroke fill',
            }}
          >
            {patternLabel}
          </div>
          <p className="mt-1 text-lg sm:text-xl font-black text-ink-600">낱말을 눌러 들어봐!</p>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-2xl">
          {words.map((w) => {
            const [s, e] = highlightOf(w.word);
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
                {/* 🔴 공통 철자만 코랄 — 나머지는 잉크. "같은 자리에 같은 글자" 가 눈에 들어온다. */}
                <span className="flex-1 text-left text-5xl sm:text-6xl font-black font-display lowercase tracking-tight">
                  <span className="text-ink-400">{w.word.slice(0, s)}</span>
                  <span className="text-coral-500">{w.word.slice(s, e)}</span>
                  <span className="text-ink-400">{w.word.slice(e)}</span>
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
