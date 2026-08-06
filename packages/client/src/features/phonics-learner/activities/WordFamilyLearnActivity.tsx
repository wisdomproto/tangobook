import { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { usePreloadImages } from '@/features/games/hooks/useGamePrefetch';
import { ActivityShell } from '../components/ActivityShell';
import { useActivitySound } from '../hooks/useActivitySound';
import { useEntryGuide, ENTRY_GUIDE } from '../hooks/useEntryGuide';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';
import { WordFillCanvas } from '@/features/phonics/components/WordFillCanvas';
import { resolveTtsUrl } from '@/features/tts';
import {
  patternLabel as makePatternLabel,
  patternHighlight,
  patternHighlightRanges,
  isMagicEPattern,
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
 * 한 낱말을 **소리 조각**으로 쪼갠다 — Book 2 CVC 배우기와 같은 `[자음]+[운모]→[낱말]` 구조.
 * `patternHighlight` 이 낱말 안 패턴 자리(연속 구간)를 주므로 앞/패턴/뒤로 가른다.
 *   · 매직-e `_ake`: bake → `[b] [ake]` (뒤 없음)
 *   · 블렌드 `bl_`:  black → `[bl] [ack]`(앞 없음)
 *   · 모음팀 `ee`:   feet → `[f] [ee] [t]`
 * cells = 조각들 + **낱말 전체**(마지막 칸). 조각을 다 누르면 이미지가 오른쪽에 뜬다.
 */
type Row = {
  word: string;
  imageUrl?: string;
  segs: string[];
  patCellIdx: number; // 패턴 조각이 몇 번째 칸인지(색용)
  cells: string[]; // 조각들 + 낱말
  magicE: boolean; // 매직-e = 대비형(연결자 전부 →)
};
function splitRow(word: string, imageUrl: string | undefined, pattern: string): Row {
  // 🔴 매직-e = **대비형** `[ak] → [ake] → [word]`(2026-08-06 사용자: e 붙기 전/후 소리 비교).
  //    라이브러리(mod_phonics)에 짧은 rime(ak)·긴 rime(ake) 클립이 세트로 있어 각 칸이 그 소리를 낸다.
  //    'ak'(/æk/) 를 누르면 짧은 소리, 'ake'(/eɪk/) 를 누르면 e 가 바꾼 긴 소리 → 'bake' 낱말.
  if (isMagicEPattern(pattern)) {
    const [s, e] = patternHighlight(word, pattern);
    const rime = word.slice(s, e); // "ake"
    const rimeShort = rime.slice(0, -1); // "ak" (묵음 e 뺀 것)
    return { word, imageUrl, segs: [rimeShort, rime], patCellIdx: 1, cells: [rimeShort, rime, word], magicE: true }; // prettier-ignore
  }
  const [s, e] = patternHighlight(word, pattern);
  const pat = word.slice(s, e);
  if (!pat) return { word, imageUrl, segs: [word], patCellIdx: 0, cells: [word], magicE: false };
  const before = s > 0 ? word.slice(0, s) : '';
  const after = e < word.length ? word.slice(e) : '';
  const segs = [before, pat, after].filter(Boolean);
  return {
    word,
    imageUrl,
    segs,
    patCellIdx: before ? 1 : 0,
    cells: [...segs, word],
    magicE: false,
  };
}

/**
 * 🔊 낱말가족 배우기 — 이퓨처 「Learn: Listen and repeat」의 낱말가족 버전(2026-08-01).
 *
 * 🔴 **소리 조각으로 나눠 듣는다**(2026-08-06 사용자: "b 랑 ake, bake 따로 놓고 각각 눌러보게, 다 누르면
 *    이미지"). 예전엔 `[그림][낱말]` 한 줄이라 오른쪽이 비고, 낱말을 통째로만 들려줬다. 이제 Book 2 CVC
 *    배우기와 같은 `[b]+[ake]→[bake]` 구조 — 조각을 각각 눌러 듣고(자음 /b/·라임 /eɪk/·낱말 "A bake"),
 *    그 낱말 조각을 다 누르면 오른쪽에 그림이 튀어나온다. Book 2 `cvc-pattern-learn` 은 CVC 전용이라
 *    (`a+n→an` 격자) 못 쓰고, 여기선 `patternHighlight` 로 낱말을 앞/패턴/뒤로 갈라 어떤 유형이든 쪼갠다.
 *
 * 다 들으면 칭찬 → **써보기 단계**로 이어진다.
 */
export function WordFamilyLearnActivity({ unitId, pattern, words, onMarkComplete, onBack }: Props) {
  const label = makePatternLabel(pattern);
  const labelRanges = patternHighlightRanges(label, pattern);
  const { say, rest, chime, sayThenChime, playCorrectSequence, praiseVisible, playAudio } =
    useActivitySound({
      unitId,
      language: 'english',
      prefix: 'en-family',
    });
  // 진입 안내 — 화면의 "낱말을 눌러 들어봐!" 에 맞는 음성(사용자: 화면마다 멘트 통일).
  useEntryGuide(ENTRY_GUIDE.listenExplore, playAudio);

  const rows = useMemo(
    () => words.map((w) => splitRow(w.word, w.imageUrl, pattern)),
    [words, pattern]
  );

  // 🔴 낱말 칸은 **그냥 낱말**을 읽는다("bake" — 2026-08-06 사용자: "bake 누르면 그냥 베이크. 지금
  //    에이크 베이크라고 읽어 어색"). 매직-e 소리는 앞 조각([b][ake])이 이미 가르쳤다. wordFamilies 의
  //    저작 ttsUrl("A bake")은 **게임 성공음 전용**이라 이 화면에선 안 쓴다.
  //    → 조각 소리(concat)와 낱말(plain)을 텍스트로 데운다.
  const warmTexts = useMemo(
    () => [...new Set([...rows.flatMap((r) => r.segs), ...words.map((w) => w.word)])],
    [rows, words]
  );
  usePhonicsTtsWarm(unitId, warmTexts, 'en-family', 'english');
  // 낱말 그림(있는 것만) — 음원처럼 진입 시 데운다(게임과 동일 프리미티브).
  usePreloadImages(useMemo(() => words.map((w) => w.imageUrl), [words]));

  // 눌린 칸 — `${wordIdx}-${cellIdx}`. 한 낱말의 모든 칸이 눌리면 그림이 뜨고, 전부 눌리면 써보기로.
  const [pressed, setPressed] = useState<Set<string>>(new Set());
  const doneRef = useRef(false);
  /**
   * 🔴 배우기(Listen&repeat) 뒤에 **써보기**가 이어진다(2026-08-04 사용자: "배우기랑 써보기를 합치자").
   *    Book 2 의 cvc-pattern-learn 이 A→B→C 로 흐르는 것과 같은 모양 — 여기선 learn → write 두 단계.
   */
  const [phase, setPhase] = useState<'learn' | 'write'>('learn');
  const [writeIdx, setWriteIdx] = useState(0);
  const writeDoneRef = useRef(false);

  const wordDone = useCallback(
    (wi: number) => rows[wi]?.cells.every((_, ci) => pressed.has(`${wi}-${ci}`)) ?? false,
    [rows, pressed]
  );

  const nextKey = useMemo(() => {
    for (let wi = 0; wi < rows.length; wi++) {
      for (let ci = 0; ci < rows[wi].cells.length; ci++) {
        if (!pressed.has(`${wi}-${ci}`)) return `${wi}-${ci}`;
      }
    }
    return null;
  }, [rows, pressed]);

  const handleCell = useCallback(
    (wi: number, ci: number) => {
      const row = rows[wi];
      if (!row) return;
      const key = `${wi}-${ci}`;

      let willWord = false;
      let willAll = false;
      setPressed((prev) => {
        if (prev.has(key)) return prev; // 재탭은 소리만(완료 재발동 X)
        const next = new Set(prev);
        next.add(key);
        if (row.cells.every((_, c) => next.has(`${wi}-${c}`))) willWord = true;
        if (rows.every((r, w) => r.cells.every((_, c) => next.has(`${w}-${c}`)))) willAll = true;
        return next;
      });

      // 조각/낱말 소리(낱말 칸도 그냥 낱말 — directUrl 없이 resolve) → (전부 끝나면 칭찬→써보기 /
      //  그 낱말이 끝나면 띵동, 그림은 상태로 이미 떴다)
      say(row.cells[ci], () => {
        if (willAll && !doneRef.current) {
          doneRef.current = true;
          rest(() => playCorrectSequence({ language: 'en', onDone: () => setPhase('write') }));
        } else if (willWord) {
          rest(() => chime());
        }
      });
    },
    [rows, say, rest, chime, playCorrectSequence]
  );

  // ── 써보기 단계 — 낱말 전체를 한 글자씩 쓰고, 다 쓰면 그 낱말을 읽어준 뒤 다음 낱말 ──
  const writeWord = words[writeIdx];
  const writeLetters = useMemo(() => (writeWord ? [...writeWord.word] : []), [writeWord]);

  // 🔴 한 글자 쓸 때마다 **지금까지 이어읽기**(f → fl → fla) — 사용자: "쓸 때마다 안 읽어줘?".
  //    마지막 글자는 handleWriteComplete 가 낱말 전체를 읽으므로 여기서 건너뛴다(소리 겹침 방지).
  const handleWriteLetter = useCallback(
    (letter: string, index: number) => {
      if (writeDoneRef.current || index + 1 >= writeLetters.length) return;
      void (async () => {
        const blend = writeLetters.slice(0, index + 1).join('');
        const url =
          (await resolveTtsUrl({
            text: blend,
            language: 'english',
            storybookId: unitId,
            identifierPrefix: 'en-family',
          })) ??
          (await resolveTtsUrl({
            text: letter,
            language: 'english',
            storybookId: unitId,
            identifierPrefix: 'en-family',
          }));
        // 띵동 먼저, 끝나면 이어읽기(한 채널이라 동시에 내면 앞소리가 잘린다).
        chime(() => {
          if (url) playAudio(url);
        });
      })();
    },
    [writeLetters, unitId, chime, playAudio]
  );

  const handleWriteComplete = useCallback(() => {
    if (writeDoneRef.current) return;
    writeDoneRef.current = true;
    const w = words[writeIdx];
    if (!w) return;
    const isLast = writeIdx + 1 >= words.length;
    // 🔴 다 쓰면 **그냥 낱말**을 읽고(매직-e 소리는 조각이 가르쳤다) → **띵동/칭찬** → 다음 낱말.
    //    sayThenChime = 읽기→쉼→(띵동 or 칭찬)→쉼→onDone. 예전엔 낱말만 읽고 조용히 넘어가
    //    다음 단어로 갈 때 효과음이 없었다(2026-08-06 사용자 지적).
    sayThenChime(w.word, {
      praise: isLast,
      onDone: () => {
        if (isLast) {
          onMarkComplete();
        } else {
          writeDoneRef.current = false;
          setWriteIdx((i) => i + 1);
        }
      },
    });
  }, [words, writeIdx, sayThenChime, onMarkComplete]);

  const dots = (
    <div className="flex items-center gap-1.5">
      {rows.map((r, wi) => (
        <span
          key={r.word}
          className={`w-3 h-3 rounded-full ${wordDone(wi) ? 'bg-mint-400' : 'bg-white/70 ring-2 ring-white'}`}
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
                onSyllableDone={handleWriteLetter}
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
          <p className="mt-1 text-lg sm:text-xl font-black text-ink-600">
            소리 조각을 눌러 들어봐!
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-4xl">
          {rows.map((row, wi) => (
            <div
              key={row.word}
              className="flex flex-row items-center justify-center gap-2 sm:gap-3"
            >
              {row.cells.map((cell, ci) => {
                const isWordCell = ci === row.cells.length - 1;
                const tone: CellTone = isWordCell
                  ? 'right'
                  : row.segs.length > 1 && ci === row.patCellIdx
                    ? 'middle'
                    : 'left';
                return (
                  <Fragment key={ci}>
                    {ci > 0 && <Connector char={row.magicE || isWordCell ? '→' : '+'} />}
                    <Cell
                      label={cell}
                      pressed={pressed.has(`${wi}-${ci}`)}
                      isNext={nextKey === `${wi}-${ci}`}
                      onClick={() => handleCell(wi, ci)}
                      tone={tone}
                      wide={isWordCell}
                    />
                  </Fragment>
                );
              })}
              {/* 🔴 그림은 그 낱말 조각을 **다 누른 뒤**에 나온다(사용자: "다 누르면 이미지").
                  자리는 미리 잡아(빈 슬롯) 완성 전후로 칸 정렬이 흔들리지 않게 한다. */}
              {row.imageUrl && (
                <div className="w-[clamp(3rem,11vh,5.5rem)] h-[clamp(3rem,11vh,5.5rem)] shrink-0">
                  {wordDone(wi) && (
                    <motion.img
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                      src={row.imageUrl}
                      alt={row.word}
                      draggable={false}
                      className="w-full h-full object-cover rounded-2xl border-[4px] border-white shadow-pop"
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </ActivityShell>
  );
}

function Connector({ char }: { char: '+' | '→' }) {
  return (
    <span
      className="text-2xl sm:text-3xl md:text-4xl font-black select-none shrink-0"
      style={{ color: '#A68155' }}
      aria-hidden
    >
      {char}
    </span>
  );
}

type CellTone = 'left' | 'middle' | 'right';

/** Book 2 배우기와 같은 소리 조각 칸(색=자리, 흰 글자+outline, 다음 칸은 펄스+👆). */
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
        'relative h-[clamp(3.5rem,12vh,6.5rem)] rounded-[24px] border-[4px] flex items-center justify-center shadow-[0_8px_0_rgba(0,0,0,0.08),0_14px_28px_-8px_rgba(0,0,0,0.25)] text-white active:scale-[0.95] transition-shadow font-black',
        wide ? 'min-w-[clamp(6rem,20vh,12rem)] px-4' : 'px-[clamp(0.75rem,2vh,1.5rem)]',
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
      <span className="text-3xl sm:text-4xl md:text-5xl whitespace-nowrap lowercase drop-shadow-[0_2px_3px_rgba(0,0,0,0.15)]">
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
