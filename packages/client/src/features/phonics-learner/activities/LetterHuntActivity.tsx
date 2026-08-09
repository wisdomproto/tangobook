import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { composeHangul } from '@tangobook/shared';
import { resolveTtsUrl } from '@/features/tts';
import { playUi } from '@/lib/uiSound';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';
import { useEntryGuide, ENTRY_GUIDE } from '../hooks/useEntryGuide';
import { buildHuntBoard } from '../lib/letter-lookalikes';
import type { ReviewCard } from '../lib/korean-phonics-units';
import { ActivityShell } from '../components/ActivityShell';

interface Props {
  unitId: string;
  cards: ReadonlyArray<ReviewCard>;
  // 'zh' = 병음 — 목표 글자 소리는 `card.sound`(ā·ō) 를 `mod_chinese` 직행으로 읽는다.
  language?: 'korean' | 'english' | 'zh';
  /**
   * 🔴 방해꾼을 **이 풀에서만** 뽑는다(2026-08-09 사용자) — `lookalikesOf` 의 가짜 조합(oe·ae) 대신
   * 실제로 배우는 rime(ee·ea·oa…). 넘기면 lookalikes 를 안 섞는다. 미지정이면 기존 lookalikes 동작.
   */
  distractors?: readonly string[];
  onComplete: () => void;
  onBack: () => void;
}

const SIZE = 18; // 6 × 3
const TARGETS = 5;
const MAX_ROUNDS = 4;
/** 🔴 소리 사이 쉼 — 콜백만 걸면 앞소리 끝과 1~3ms 로 붙어 한 덩어리로 들린다. */
const REST_MS = 430;

/**
 * 🔎 복습 — 글자 사냥.
 *
 * 목표 글자가 **헷갈리는 짝**(ㄱ/ㅋ/ㄲ, b/d/p, at/et/an) 사이에 숨어 있고, 그것만 전부 찾는다.
 *
 * 🔴 이 활동이 있는 이유 = **글자 모양 변별**. 복습 6종 중 나머지 다섯은 소리↔그림↔낱말을 다루고
 *    모양을 직접 겨루는 활동이 없었다(앞선 「길 따라가기」는 반짝이는 칸을 누르는 게 전부라
 *    아이가 하는 판단이 하나도 없었다 — 그래서 이걸로 갈아치웠다).
 * 🔴 판에 그림·낱말을 두지 않는다 — 글자만 있는 화면이라야 모양을 본다.
 *    (그림을 두면 낱말을 읽어줘야 하고, 그러면 이 활동이 또 「짝 찾기」가 된다.)
 * 🔴 자산 의존이 없다 — 단어 그림이 없는 단원에서도 돈다.
 */
export function LetterHuntActivity({
  unitId,
  cards,
  language = 'korean',
  distractors,
  onComplete,
  onBack,
}: Props) {
  // 오답음(`playFeedbackSound`)은 쓰지 않는다 — 틀린 칸도 그냥 읽어준다(아래 `handleTap`).
  const { playAudio, playCorrectSequence, praiseVisible, scheduleTimer } = useGameAudio();
  const [round, setRound] = useState(0);
  const [found, setFound] = useState<number[]>([]);
  const foundRef = useRef<number[]>([]);
  const [done, setDone] = useState(false);
  /**
   * 진입 안내가 나오는 중 — 끝나야 첫 글자를 읽고 판이 열린다.
   *
   * 🔴 예전엔 들어가자마자 목표 글자부터 읽었다(사용자: "들어가자 마자 바로 문제가 나오는데? ㅋㅋㅋ").
   *    글을 못 읽는 아이에겐 화면의 「이 글자를 다 찾아봐!」 가 안 보이므로, 무엇을 하라는 말이
   *    **소리로** 먼저 와야 한다(「퀴즈 시작」·「ABC 배우기」와 같은 규칙).
   */

  /**
   * 🔴 라운드는 **네 개까지**. 영어 복습은 카드가 6~8장이라 그대로 돌면 한 활동에 40번을 눌러야 한다
   *    — 복습 여섯 개 중 하나일 뿐인 활동이 그만큼 길면 아이가 중간에 나간다.
   *    (방해꾼에는 잘린 글자도 계속 섞이므로 나머지 글자를 안 보는 건 아니다.)
   */
  const hunt = useMemo(() => cards.slice(0, MAX_ROUNDS), [cards]);
  // 🔴 `cards` 는 부모가 매 렌더 새로 만들 수 있어 의존성으로 쓰면 프리워밍이 끝없이 돈다 — 내용으로 본다.
  const lettersKey = cards.map((c) => c.letter).join('|');
  const cardsRef = useRef(cards);
  cardsRef.current = cards;
  usePhonicsTtsWarm(
    unitId,
    useMemo(() => cardsRef.current.map((c) => c.sound), [lettersKey]),
    'letter-hunt',
    language
  );

  const card = hunt[round];
  const distractorsKey = (distractors ?? []).join('|');
  const distractorsRef = useRef(distractors);
  distractorsRef.current = distractors;
  // 🔴 판은 라운드가 바뀔 때만 새로 짠다 — 렌더마다 만들면 누를 때마다 글자가 춤춘다.
  const board = useMemo(() => {
    const list = cardsRef.current.slice(0, MAX_ROUNDS);
    const target = list[round];
    if (!target) return [];
    const pool = distractorsRef.current;
    // 🔴 방해꾼 풀이 오면 그것만(진짜 배우는 rime) — 가짜 조합(oe·ae)을 안 섞는다.
    const others = pool
      ? pool.filter((c) => c !== target.letter)
      : list.filter((c) => c.letter !== target.letter).map((c) => c.letter);
    return buildHuntBoard({
      target: target.letter,
      others,
      size: SIZE,
      targets: TARGETS,
      noLookalikes: !!pool,
    });
  }, [round, lettersKey, distractorsKey]);
  // 🔴 칸 글자 크기 = 판에서 가장 긴 토큰 기준. 한 글자(Book 2)는 크게, 3~4글자 패턴(Book 3~5)은 줄여
  //    칸(14vw/13vh)을 안 넘게. 폭 usable≈12vw·11vh, 글자폭≈0.6em → font ≤ usable/(len×0.6).
  const cellFont = useMemo(() => {
    // 0.7 = 굵은 글자 넓은 글립(m·w) 여유. usable 폭 ≈ 11vw·10vh(테두리 8px 뺀 값).
    const maxLen = Math.max(1, ...board.map((t) => t.length));
    const fVw = Math.min(8, 11 / (maxLen * 0.7));
    const fVh = Math.min(7, 10 / (maxLen * 0.7));
    return `min(${fVw.toFixed(1)}vw, ${fVh.toFixed(1)}vh)`;
  }, [board]);

  /**
   * 칸에 적힌 글자 → **읽을 소리**. 목표 칸은 카드가 소리를 갖고 있지만(모음 `ㅏ`→`아`),
   * 방해꾼은 사전에서 온 글자라 카드에 없다.
   * 🔴 모음 홑글자는 그대로 읽으면 자모 이름이 나온다 — `ㅇ` 을 붙여 음절로 읽는다(ㅐ→애).
   *    이 단원이 "모음은 홀로 소리가 없다"로 가르치는 것과 같은 규칙이다.
   */
  const soundOf = useCallback(
    (ch: string) => {
      const known = cardsRef.current.find((c) => c.letter === ch);
      if (known) return known.sound;
      if (/^[ㅏ-ㅣ]$/.test(ch)) return composeHangul('ㅇ', ch, null) || ch;
      // 🔴 영어 방해꾼 낱글자(I·L…)는 **소문자로** 읽는다(2026-07-30 사용자: "안 읽어주고 효과음만").
      //    board 엔 대문자로 깔리는데(`lookalikesOf` 가 대문자 변환) 음원 키는 소문자(`en-letter` 가
      //    `lower` 로 만든다)라, 대문자 그대로 읽으려다 **무음**이 됐다. 그러면 버튼 탭음만 들린다.
      //    카드에 있는 글자는 `known.sound`(이미 맞는 소리)로 빠지므로 여기 오는 건 방해꾼뿐이다.
      if (/^[A-Za-z]$/.test(ch)) return ch.toLowerCase();
      return ch;
    },
    // cardsRef 는 ref 라 신원이 안 바뀐다 — 내용이 바뀌면 lettersKey 로 다시 만든다.
    [lettersKey]
  );

  const say = useCallback(
    async (text: string, onEnded?: () => void) => {
      const url = await resolveTtsUrl({
        text,
        language,
        storybookId: unitId,
        identifierPrefix: 'letter-hunt',
      });
      // 🔴 라이브러리에 없는 방해꾼(oe·eck·eb…)은 무음이라 "왜 얜 소리가 안 나?" 가 된다
      //    (2026-08-09 사용자). 읽을 게 없으면 가벼운 뾱(tap)이라도 내고 체인은 이어간다.
      if (url) playAudio(url, onEnded);
      else {
        playUi('tap');
        onEnded?.();
      }
    },
    [language, unitId, playAudio]
  );

  /** 진입 안내 — 「같은 글자를 모두 찾아봐!」. 끝나야 첫 글자를 읽고 판이 열린다. */
  const starting = useEntryGuide(ENTRY_GUIDE.hunt, playAudio);

  // 라운드가 열리면 찾을 글자를 한 번 읽어준다 — 소리와 모양을 같이 붙잡게.
  const sayRef = useRef(say);
  sayRef.current = say;
  const soundKey = card?.sound ?? '';
  /** 안내 다음 첫 글자만 쉼을 두고 읽는다 — 라운드 넘어갈 땐 앞 체인이 이미 쉬었다. */
  const firstLetterRef = useRef(true);
  useEffect(() => {
    if (!soundKey || done || starting) return;
    if (firstLetterRef.current) {
      firstLetterRef.current = false;
      scheduleTimer(() => sayRef.current(soundKey), REST_MS);
      return;
    }
    sayRef.current(soundKey);
  }, [soundKey, round, done, starting, scheduleTimer]);

  /**
   * 진입 안내 → 쉼 → 첫 글자. 🔴 안내는 **영어 단원에서도 한국어**다 — 무엇을 하라는 말은
   * 아이가 알아듣는 말이어야 한다(파닉스 화면 글자도 전부 한국어다).
   */

  const handleTap = useCallback(
    (idx: number) => {
      if (done || starting || !card || foundRef.current.includes(idx)) return;
      /**
       * 🔴 **틀렸다고 하지 않는다 — 그냥 그 글자를 읽어준다**(2026-07-30 사용자).
       *    사냥은 모양을 훑다가 짚어 보는 활동이라, 짚을 때마다 빨갛게 흔들리면 **눌러보는 것 자체가
       *    벌**이 된다. 아이가 알아야 할 건 "틀렸다"가 아니라 **그 칸이 무슨 소리인가**이고,
       *    그걸 들으면 목표와 다르다는 걸 스스로 안다.
       */
      if (board[idx] !== card.letter) {
        say(soundOf(board[idx]));
        return;
      }
      /**
       * 🔴 찾은 칸은 **ref 로 센다** — state 만 보면 한 프레임 안에 두 칸을 누를 때(연타·양손)
       *    두 핸들러가 같은 옛 `found` 를 읽어 하나가 사라진다. 마지막 칸을 그렇게 놓치면
       *    라운드가 영영 안 끝난다.
       */
      const next = [...foundRef.current, idx];
      foundRef.current = next;
      setFound(next);
      const isRoundDone = next.length >= TARGETS;
      const isLast = round + 1 >= hunt.length;

      if (isLast && isRoundDone) setDone(true);
      /**
       * 🔴 **띵동 먼저, 그 다음 글자**(2026-07-30 사용자: "맞추면 맞췄다고 효과음 내주고").
       *    잘 찾았다는 건 **즉시** 와야 하고, 글자 소리는 그 뒤에 온다 — 반대로 두면 아이가
       *    소리를 다 들을 때까지 맞았는지 모른다(낱말 쓰기가 이미 이 순서다).
       *    한 칸마다 울리므로 라운드 끝에서 따로 울리지 않는다 — 그러면 띵동이 두 번이다.
       */
      playAudio('/sounds/game/correct.mp3', () =>
        scheduleTimer(() => {
          if (!isRoundDone) {
            say(card.sound);
            return;
          }
          say(card.sound, () =>
            scheduleTimer(() => {
              // 🔴 글자를 다 찾으면 **칭찬** — 마지막이면 그 뒤 완료, 아니면 다음 글자로(2026-08-09 사용자:
              //    "다 찾고 넘어갈 때 효과음/칭찬이 없어"). 예전엔 조용히 넘어가 라운드를 끝낸 티가 안 났다.
              playCorrectSequence({
                language: language === 'english' ? 'en' : 'ko',
                onDone: isLast
                  ? onComplete
                  : () => {
                      // 라운드가 넘어가면 위 effect 가 새 글자를 읽는다.
                      foundRef.current = [];
                      setFound([]);
                      setRound((r) => r + 1);
                    },
              });
            }, REST_MS)
          );
        }, REST_MS)
      );
    },
    [
      done,
      // 🔴 `starting`·`soundOf` 를 빼먹으면 **판이 통째로 죽는다** — 나머지 deps 는 안내가 끝나도
      //    안 바뀌므로 `handleTap` 이 첫 렌더의 `starting === true` 를 붙잡은 채 남아 모든 탭이
      //    첫 줄에서 return 한다. 이 저장소는 `react-hooks/exhaustive-deps` 가 꺼져 있어
      //    **아무도 경고해주지 않는다** — 훅에 상태를 추가하면 deps 를 직접 확인할 것.
      starting,
      soundOf,
      card,
      board,
      round,
      hunt.length,
      say,
      playAudio,
      playCorrectSequence,
      scheduleTimer,
      language,
      onComplete,
    ]
  );

  if (!card) return null;

  return (
    <ActivityShell
      onBack={onBack}
      // 몇 개 남았는지 = 이 게임의 유일한 진행 표시. 뒤로가기와 한 줄에 양끝으로 선다.
      headerRight={
        <div className="flex gap-1.5">
          {Array.from({ length: TARGETS }).map((_, i) => (
            <span
              key={i}
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full ${
                i < found.length ? 'bg-mint-500' : 'bg-white/70'
              }`}
            />
          ))}
        </div>
      }
    >
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4">
        {/* 🔴 제목에 글자를 끼워 넣지 않는다 — 'ㄱ 을' / 'A 을' 처럼 조사가 언어마다 어긋난다.
            찾을 글자는 눌러 소리를 듣는 큰 칩으로 따로 세운다. */}
        <h2 className="text-2xl sm:text-4xl font-black text-ink-900 text-center break-keep">
          {done ? '다 찾았어!' : '이 글자를 다 찾아봐!'}
        </h2>
        <button
          onClick={() => say(card.sound)}
          className="px-6 py-2 rounded-3xl bg-coral-500 text-white shadow-pop font-black text-[min(9vw,8vh)] leading-none flex items-center gap-3"
          aria-label={`${card.letter} 소리 듣기`}
        >
          {card.letter}
          <span className="text-[0.5em]">🔊</span>
        </button>

        <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
          {board.map((ch, idx) => {
            const got = found.includes(idx);
            return (
              <button
                key={idx}
                onClick={() => handleTap(idx)}
                disabled={got || done}
                aria-label={ch}
                className={[
                  // 🔴 칸은 vw 만 보면 안 된다 — 전체화면이라 높이가 먼저 모자란다.
                  'w-[min(14vw,13vh)] h-[min(14vw,13vh)] rounded-2xl border-[4px] flex items-center justify-center font-black transition leading-none overflow-hidden',
                  got
                    ? 'bg-mint-500 border-mint-500 text-white scale-95'
                    : 'bg-white border-white text-ink-900 active:scale-95',
                ].join(' ')}
                // 🔴 칸 글자 크기는 **판에서 가장 긴 토큰**에 맞춘다 — Book 2 는 한 글자(an/at)라 크게,
                //    Book 3~5 는 3~4글자 패턴(ane·ack)이라 그대로 두면 칸을 넘친다(사용자 2026-08-09).
                style={{ fontSize: cellFont }}
              >
                {ch}
              </button>
            );
          })}
        </div>

        {/* 지나온 라운드 = 이미 사냥한 글자 */}
        <div className="flex flex-wrap justify-center gap-2">
          {hunt.map((c, i) => (
            <span
              key={c.unitId + c.letter}
              className={[
                'w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black shadow-soft',
                i < round || done ? 'bg-mint-500 text-white' : 'bg-white/70 text-ink-300',
              ].join(' ')}
            >
              {c.letter}
            </span>
          ))}
        </div>
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </ActivityShell>
  );
}
