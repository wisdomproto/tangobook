import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { LetterFillCanvas } from '@/features/phonics/components/LetterFillCanvas';
import { resolveTtsUrl } from '@/features/tts';
import { useLogSyllable } from '../hooks/useLogSyllable';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { useEntryGuide, ENTRY_GUIDE } from '../hooks/useEntryGuide';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { buildBlendPairs, stacksVertically } from '../lib/blend-pairs';
import { ActivityShell } from '../components/ActivityShell';

interface Props {
  unitId: string;
  consonant: string;
  /** 발음할 텍스트. 미지정이면 `consonant`. 받침은 홀로 소리 못 내 예시 음절('앙')을 읽는다. */
  soundText?: string;
  /** 자음 모드 — 붙일 모음들. 없으면 글자만 세 번 쓰는 옛 화면. */
  blendVowels?: ReadonlyArray<string>;
  /** 받침 모드 — 학습 받침과 붙일 초성들. */
  coda?: string;
  codaOnsets?: ReadonlyArray<string>;
  onComplete: () => void;
  onBack: () => void;
}

/** 두 글자가 붙기까지의 거리 — 멀리 → 가까이 → 붙음. (음절 만들기와 같은 규칙) */
const GAPS = ['min(7vw, 8rem)', 'min(2vw, 2rem)', '0px'] as const;
/** 받침은 위·아래로 모인다(아+ㅇ=앙) — 세로라 높이 기준 값이 따로 필요하다. */
const CODA_GAPS = ['min(9vh, 5rem)', 'min(3vh, 1.5rem)', '0px'] as const;
/**
 * 두 칸의 **공통 폭**. 대기 칸과 캔버스가 같은 크기여야 한 글자로 읽힌다.
 *
 * 🔴 캔버스는 자체 `max-w-sm`(384px)이라 그냥 두면 대기 칸(176px)의 두 배가 된다.
 *    받침(세로)만 고쳐놨더니 자음(가로)에 그대로 남아 있었다 — 두 모드 다 묶는다.
 * 가로로 나란한 자음은 두 칸이 한 줄에 들어가야 해서 세로보다 좁다.
 */
const CODA_TILE = 'min(46vw, 26vh, 13rem)';
const ROW_TILE = 'min(38vw, 24vh, 11rem)';
/**
 * 🔴 **대기 칸 글자는 캔버스가 그리는 글자와 같은 크기여야 한다** — `LetterFillCanvas` 는 400px
 * 캔버스에 `0.85em` 으로 그린 뒤 칸 폭에 맞춰 늘리므로, 화면에 보이는 em 크기는 **칸 폭 × 0.85** 다.
 * 예전엔 대기 칸이 `text-5xl sm:text-7xl` 고정이라 쓰는 글자와 옆 글자의 크기가 달랐다(사용자 지적).
 * 글꼴도 캔버스와 같은 NanumSquareRound(`font-display`)로 맞춘다 — 예전엔 Pretendard 였다.
 */
const tileFont = (tile: string) => `calc(${tile} * 0.85)`;
/**
 * 대기 칸 = **캔버스와 똑같이 생긴 판**. 흰 바탕에 회색 글자(`LetterFillCanvas` 의 `GUIDE_COLOR`).
 *
 * 🔴 두 칸의 차이는 **색이 아니라 반짝임**이어야 한다(2026-07-29 사용자 지적) — 예전엔 대기 칸
 *    글자가 코랄이라 「반짝이는 칸에 ㄱ 써봐!」 를 읽고 **주황색인 옆 칸**을 쓰려 했다. 정작
 *    쓸 칸(캔버스)은 회색이라 아무 표시가 없었고, 문구가 약속한 반짝임은 화면에 없었다.
 */
const IDLE_TILE_CLASS =
  'shrink-0 aspect-square rounded-3xl border-[5px] border-white bg-white/70 flex items-center justify-center font-display font-black text-[#e5e7eb] shadow-soft leading-none';
/** 두 글자가 미끄러져 붙는 시간. CSS `duration-500` 과 맞춘다 — 어긋나면 붙기 전에 합쳐진 글자가 뜬다. */
const CLOSE_MS = 500;
/** 합쳐진 글자가 뜬 뒤 읽기까지의 쉼 — 붙자마자 소리가 나면 눈이 따라가기 전에 지나간다. */
const MERGE_REST_MS = 550;
/**
 * 쓰는 라운드 수 — **한 번**(2026-07-30 사용자: "2번씩 쓰게 하는데, 1번만 쓰게 하는 게 낫겠다").
 *
 * 🔴 「음절 만들기」는 탭이라 [멀리·가까이] 두 라운드가 리듬이 되지만, 쓰기는 한 글자에 몇 초가
 *    걸려서 같은 두 글자를 두 번 쓰면 음절 하나에 네 번이다. 음절 10개를 다 열어 준 지금은
 *    두 글자를 한 번씩만 쓰고 붙는 걸 본다(10음절 × 2 = 20번).
 */
const WRITE_ROUNDS = 1;

/**
 * 지금 쓸 칸 — 캔버스를 감싸고 **반짝이는 테두리**를 얹는다.
 *
 * 🔴 테두리는 캔버스 래퍼가 아니라 **정사각 영역에만** 건다. 래퍼 높이는 진척 바·결과가 나타나며
 *    늘어나므로(그래서 가로 정렬이 `items-start` 다) 래퍼에 걸면 쓰는 도중 테두리가 아래로 자란다.
 *    캔버스는 `aspect-square` 라 `top-0` + `aspect-square` 로 그 칸에 딱 맞는다.
 */
function WriteCell({ tile, children }: { tile: string; children: ReactNode }) {
  return (
    <div className="relative shrink-0" style={{ width: tile }}>
      {children}
      <span className="pointer-events-none absolute inset-x-0 top-0 aspect-square rounded-xl ring-4 ring-coral-400 animate-pulse" />
    </div>
  );
}

/**
 * 음절 써보기 액티비티 — 「음절 만들기」와 **같은 흐름을 손으로** 한다(2026-07-26 개편).
 *
 *   ① 멀리 떨어진 ㄱ · ㅏ — 반짝이는 칸에 ㄱ 을 쓰고, 다음 칸에 ㅏ 를 쓴다
 *   ② 가까워진 상태로 같은 두 번
 *   ③ 쓰지 않아도 스르륵 붙으며 `ㄱ ㅏ 가` 를 이어 읽는다
 *
 * 🔴 음절은 **그 단원 것을 다 보여준다**(2026-07-30) — 자음 10개(가갸거겨고교구규그기)·받침 14개.
 *    예전엔 자음만 무작위 3개로 줄였는데, 바로 앞 「ㄱ+모음」이 만든 음절 중 셋만 써 보게 됐다.
 *    다 쓰라고 강요하진 않는다 — 위 목록에서 아무거나 골라 하고 언제든 나갈 수 있다.
 * 🔴 받침 단원도 같은 데이터(`buildBlendPairs`)를 쓰고 **두 칸 다 쓴다** — `가` 를 쓰고 `ㅇ` 을 써서
 *    `강` 을 만든다. 라운드만 한 번(자음은 멀리·가까이 두 번).
 * 🔴 TTS 는 콜백 체인 — 합쳐질 때 이어읽기 → 띵동 → 다음 음절.
 */
export function ConsonantWriteActivity({
  unitId,
  consonant,
  soundText,
  blendVowels,
  coda,
  codaOnsets,
  onComplete,
  onBack,
}: Props) {
  const { playAudio, playCorrectSequence, praiseVisible } = useGameAudio();
  // 🔴 진입 안내 — 지시가 텍스트뿐이라 글 못 읽는 아이엔 통째로 무음이었다(쓰기 6종 공통).
  useEntryGuide(ENTRY_GUIDE.write, playAudio);
  const prefix = 'consonant-write';

  const isCoda = !!coda;
  /**
   * 🔴 **음절을 다 보여준다**(2026-07-30 사용자: "ㄱ 써보기에서 왜 규 기 거 만 있지? 다 있어야지").
   *    예전엔 무작위 3개만 뽑았다 — 두 글자를 두 번씩 쓰느라 길어진다는 이유였는데, 그러면
   *    **바로 앞 「ㄱ+모음」이 만든 음절 10개 중 셋만** 써 보게 되고 목록도 단원마다 달라 보인다.
   *    ㄱ 단원이 가르치는 건 `가갸거겨고교구규그기` 전부다.
   * 🔴 대신 **다 쓰라고 강요하지 않는다** — 위 목록에서 아무거나 눌러 그것부터 할 수 있고,
   *    끝내지 않고 나가도 된다(칭찬은 다 만들었을 때).
   */
  const pairs = useMemo(
    () => buildBlendPairs({ consonant, blendVowels, coda, codaOnsets }),
    [consonant, blendVowels, coda, codaOnsets]
  );

  const [idx, setIdx] = useState(0);
  const [round, setRound] = useState(0);
  const [step, setStep] = useState<0 | 1>(0); // 지금 쓸 칸
  const logSyllable = useLogSyllable(unitId);
  const [madeSet, setMade] = useState<ReadonlySet<number>>(() => new Set());
  const [completed, setCompleted] = useState(false);
  // 붙는 애니메이션·쉼 타이머 — 도중에 나가면 빈 화면에서 소리가 울린다.
  const closeTimer = useRef<number | null>(null);
  const restTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      if (restTimer.current) clearTimeout(restTimer.current);
    },
    []
  );

  const pair = pairs[idx];
  const writeRounds = WRITE_ROUNDS;
  /**
   * 라운드 = `0..writeRounds-1` 쓰는 중 · `writeRounds` 두 글자가 **미끄러져 붙는 중** ·
   * 그 다음 합쳐진 음절.
   *
   * 🔴 붙는 단계를 건너뛰면 다 칠하자마자 `강` 으로 갈아치워져 **가까워지는 게 아예 안 보인다** —
   *    글자가 "어디에 어떻게 붙는지"가 이 활동의 전부인데 그 순간이 사라진다.
   * 🔴 예전엔 이 단계가 **받침 모드에만** 있었다(자음은 두 라운드의 거리 변화가 그 역할을 했다).
   *    쓰기를 한 번으로 줄이면서 자음도 같은 단계를 쓴다 — 두 모드가 한 흐름이 됐다.
   */
  const closing = round === writeRounds;
  const merging = round > writeRounds;
  /**
   * 위·아래로 모이는가 — 받침이거나 수직 모음(ㅗㅛㅜㅠㅡ)이면 세로. 방향은 글자가 정한다.
   * 🔴 **칸 크기뿐 아니라 배치 방향까지** 이 값이 정해야 한다 — 예전엔 방향만 `coda` 로 갈라져서
   *    `구`·`꼬` 를 옆으로 나란히 쓰게 했다(사용자 지적). 음절 만들기는 진작 이 값으로 갈리고
   *    있었으므로 두 화면이 어긋나 있던 것이다(규칙 SSOT = `stacksVertically`).
   */
  const vertical = isCoda || stacksVertically(pair);
  const tile = vertical ? CODA_TILE : ROW_TILE;
  /**
   * 🔴 가로로 나란할 땐 **위를 맞춘다**(`items-start`) — 캔버스 아래엔 진척 바처럼 나타났다 사라지는
   *    것이 붙어서 그 래퍼만 키가 커진다. `items-center` 로 묶으면 그만큼 **캔버스가 위로 밀려**
   *    옆 대기 칸과 글자 높이가 어긋난다(사용자 지적: "ㄱ 이랑 ㅓ 가 수평이 맞아야지").
   *    두 칸이 같은 정사각이라 위만 맞추면 글자끼리 맞고, 아래에 뭐가 붙든 안 흔들린다.
   * 세로로 쌓을 땐 교차축이 가로라 가운데 정렬이 맞다.
   */
  const align = vertical ? 'flex-col items-center' : 'items-start';

  const goTo = useCallback((i: number) => {
    setIdx(i);
    setRound(0);
    setStep(0);
  }, []);
  const say = soundText ?? consonant;

  usePhonicsTtsWarm(
    unitId,
    useMemo(
      () =>
        pairs.length
          ? pairs.flatMap((p) => [
              p.first,
              p.secondSound,
              `${p.first} ${p.secondSound} ${p.syllable}`,
            ])
          : [say],
      [pairs, say]
    ),
    prefix
  );

  const speak = useCallback(
    async (text: string, onEnded?: () => void) => {
      const url = await resolveTtsUrl({
        text,
        language: 'korean',
        storybookId: unitId,
        identifierPrefix: prefix,
      });
      if (url) playAudio(url, onEnded);
      else onEnded?.();
    },
    [unitId, playAudio]
  );

  const handleResult = useCallback(
    (passed: boolean) => {
      // 붙는 중(closing)에도 막는다 — 캔버스가 아직 살아 있으면 한 번 더 통과가 들어온다.
      if (!passed || completed || merging || closing || !pair) return;

      // 만든 음절을 기록하고 아직 안 만든 다음 것으로 (목록에서 건너뛰며 골랐을 수 있다).
      const finishSyllable = (read: string) => {
        // 🔴 손으로 쓴 음절 — 부모 리포트 표가 이 이벤트로 칸을 채운다. 받침 모드의 `pair.first` 는
        //    자음이 아니라 음절(`가`)이라, 만든 글자(`강`)를 쪼개 넘긴다.
        logSyllable(pair.syllable);
        const made = new Set(madeSet).add(idx);
        setMade(made);
        const isLast = made.size >= pairs.length;
        if (isLast) setCompleted(true);
        const advance = () => {
          if (isLast) {
            playCorrectSequence({ language: 'ko', onDone: onComplete });
            return;
          }
          const after = pairs.findIndex((_, i) => i > idx && !made.has(i));
          goTo(after >= 0 ? after : pairs.findIndex((_, i) => !made.has(i)));
        };
        speak(read, () => playAudio('/sounds/game/correct.mp3', advance));
      };

      /**
       * 🔴 **두 칸 다 쓴다 — 받침 모드도**(2026-07-30 사용자: "받침에서 써보기도 받침만 써보기로
       *    하는데, 다 써보게 하자. 위에 글자도"). 예전엔 앞 음절(`가`)을 주어진 판으로 두고 받침만
       *    쓰게 했다("이 단원이 가르치는 건 받침"). 하지만 아이가 손으로 만드는 건 **음절 하나**(`강`)라
       *    앞 글자를 안 써 보면 그게 어떻게 한 글자가 되는지 손에 안 남는다. 두 모드가 같은 흐름이다.
       */
      if (step === 0) {
        setStep(1);
        speak(pair.first);
        return;
      }

      const nextRound = round + 1;
      setStep(0);
      setRound(nextRound);
      // 아직 쓸 라운드가 남았으면 다음 라운드로 (지금은 한 라운드라 자음·받침 모두 바로 붙는다).
      if (nextRound < writeRounds) {
        speak(pair.secondSound);
        return;
      }
      /**
       * 다 썼다 → 미끄러져 붙고(`closing`) → 합쳐진 글자 → 쉼 → 이어 읽기.
       * 🔴 소리를 **붙는 도중에 내지 않는다** — 눈으로 붙는 걸 보고 나서 그 소리를 들어야 이어진다.
       * 🔴 합쳐진 음절만이 아니라 **이어 읽는다**(가 · 으 · 강 / ㄱ · ㅏ · 가) — 어떻게 붙어 그 소리가
       *    됐는지가 들려야 한다. 「음절 만들기」와 같은 형식.
       */
      closeTimer.current = window.setTimeout(() => {
        setRound(nextRound + 1);
        restTimer.current = window.setTimeout(
          () => finishSyllable(`${pair.first} ${pair.secondSound} ${pair.syllable}`),
          MERGE_REST_MS
        );
      }, CLOSE_MS);
    },
    [
      completed,
      merging,
      closing,
      pair,
      step,
      round,
      idx,
      pairs,
      madeSet,
      logSyllable,
      isCoda,
      writeRounds,
      goTo,
      speak,
      playAudio,
      playCorrectSequence,
      onComplete,
    ]
  );

  return (
    <ActivityShell onBack={onBack}>
      {/* 오늘 써볼 음절 — 다 쓴 건 민트 + ✓. 아무거나 눌러 그것부터 할 수 있다(음절 만들기와 같다).
          🔴 진척은 `idx` 가 아니라 `madeSet` 으로 판단한다 — 건너뛰며 골랐을 때 앞의 안 한 것이
             '완료'로 보이면 안 된다. */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {pairs.map((p, i) => {
          const done = madeSet.has(i);
          return (
            <button
              key={p.syllable}
              onClick={() => !done && goTo(i)}
              disabled={done}
              aria-label={`${p.syllable} 쓰기`}
              className={[
                'w-11 h-11 sm:w-14 sm:h-14 rounded-2xl border-[3px] border-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-soft transition',
                done
                  ? 'bg-mint-500 text-white'
                  : i === idx
                    ? 'bg-coral-500 text-white ring-4 ring-coral-200'
                    : 'bg-white/80 text-ink-500 hover:shadow-pop active:scale-[0.97]',
              ].join(' ')}
            >
              {done ? '✓' : p.syllable}
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-display text-ink-900 text-center break-keep">
          {!pair ? (
            <>
              ✏️ <span className="text-coral-600">{consonant}</span> 을 세 번 따라써봐!
            </>
          ) : merging ? (
            <>
              두 글자가 만나서 <span className="text-coral-600">{pair.syllable}</span>!
            </>
          ) : isCoda && step === 1 ? (
            // 받침 차례 — 무엇을 만드는 중인지 같이 말해준다(앞 글자는 이미 썼다).
            <>
              ✏️ 받침 <span className="text-coral-600">{pair.second}</span> 을 써서{' '}
              <span className="text-coral-600">{pair.syllable}</span> 을 만들어봐!
            </>
          ) : (
            <>
              ✏️ 반짝이는 칸에{' '}
              <span className="text-coral-600">{step === 0 ? pair.first : pair.second}</span> 써봐!
            </>
          )}
        </h2>

        {/* 짝이 없으면(모음·초성 정보 없는 단원) 예전처럼 글자 하나만 반복해서 쓴다. */}
        {!pair ? (
          <LetterFillCanvas
            key={`single-${round}`}
            letter={consonant}
            onResult={(ok) => {
              if (!ok) return;
              const next = round + 1;
              setRound(next);
              const done = next >= 3;
              if (done) setCompleted(true);
              speak(say, () =>
                playAudio('/sounds/game/correct.mp3', () => {
                  if (done) playCorrectSequence({ language: 'ko', onDone: onComplete });
                })
              );
            }}
            autoCheck
          />
        ) : (
          <div
            className={`flex justify-center transition-all duration-500 ease-out ${align}`}
            style={
              vertical
                ? { rowGap: CODA_GAPS[Math.min(round, CODA_GAPS.length - 1)] }
                : { columnGap: GAPS[Math.min(round, GAPS.length - 1)] }
            }
          >
            {/* 🔴 대기 칸에 `shrink-0` 필수 — 없으면 캔버스가 자리를 차지하며 눌려 정사각이 깨진다(375px 에서 65×98). */}
            {merging ? (
              <div className="w-[60vw] h-[30vw] max-w-96 max-h-48 sm:w-96 sm:h-48 rounded-3xl border-[5px] border-mint-500 bg-mint-100 flex items-center justify-center font-black text-mint-700 text-6xl sm:text-8xl shadow-pop">
                {pair.syllable}
              </div>
            ) : closing ? (
              /* 붙는 동안(받침 모드 round 1) — 🔴 **두 칸 다 판으로 바꾼다.** 캔버스를 남겨 두면
                 미끄러지는 중에도 칠할 수 있고, 다 칠한 글자가 아니라 빈 가이드가 붙는 것처럼 보인다. */
              <>
                <div className={IDLE_TILE_CLASS} style={{ width: tile, fontSize: tileFont(tile) }}>
                  {pair.first}
                </div>
                <div
                  className="shrink-0 aspect-square rounded-3xl border-[5px] border-mint-500 bg-mint-100 flex items-center justify-center font-display font-black text-mint-700 shadow-pop leading-none"
                  style={{ width: tile, fontSize: tileFont(tile) }}
                >
                  {pair.second}
                </div>
              </>
            ) : (
              // 🔴 지금 쓸 칸만 캔버스로 살아 있고, 옆 칸은 글자를 보여주는 판이다.
              //    두 캔버스를 동시에 띄우면 375px 에서 한 칸이 140px 밑으로 내려가 쓸 수가 없다.
              [0, 1].map((which) => {
                const letter = which === 0 ? pair.first : pair.second;
                if (which === step) {
                  return (
                    // 🔴 캔버스도 대기 칸과 **같은 폭**으로 묶는다 — 안 묶으면 자체 max-w-sm(384px)이라
                    //    대기 칸(176px)의 두 배가 되어 두 글자 크기가 제각각으로 보인다.
                    <WriteCell key={`${pair.syllable}-${round}-${which}`} tile={tile}>
                      <LetterFillCanvas letter={letter} onResult={handleResult} autoCheck />
                    </WriteCell>
                  );
                }
                return (
                  <div
                    key={`${pair.syllable}-${which}-idle`}
                    className={IDLE_TILE_CLASS}
                    style={{ width: tile, fontSize: tileFont(tile) }}
                  >
                    {letter}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </ActivityShell>
  );
}
