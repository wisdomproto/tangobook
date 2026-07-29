import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { resolveTtsUrl } from '@/features/tts';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';
import { buildHuntBoard } from '../lib/letter-lookalikes';
import type { ReviewCard } from '../lib/korean-phonics-units';
import { ActivityShell } from '../components/ActivityShell';

interface Props {
  unitId: string;
  cards: ReadonlyArray<ReviewCard>;
  language?: 'korean' | 'english';
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
  onComplete,
  onBack,
}: Props) {
  const { playAudio, playFeedbackSound, playCorrectSequence, praiseVisible, scheduleTimer } =
    useGameAudio();
  const [round, setRound] = useState(0);
  const [found, setFound] = useState<number[]>([]);
  const foundRef = useRef<number[]>([]);
  const [missed, setMissed] = useState<number | null>(null);
  const [done, setDone] = useState(false);

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
    'letter-hunt'
  );

  const card = hunt[round];
  // 🔴 판은 라운드가 바뀔 때만 새로 짠다 — 렌더마다 만들면 누를 때마다 글자가 춤춘다.
  const board = useMemo(() => {
    const list = cardsRef.current.slice(0, MAX_ROUNDS);
    const target = list[round];
    if (!target) return [];
    return buildHuntBoard({
      target: target.letter,
      others: list.filter((c) => c.letter !== target.letter).map((c) => c.letter),
      size: SIZE,
      targets: TARGETS,
    });
  }, [round, lettersKey]);

  const say = useCallback(
    async (text: string, onEnded?: () => void) => {
      const url = await resolveTtsUrl({
        text,
        language,
        storybookId: unitId,
        identifierPrefix: 'letter-hunt',
      });
      playAudio(url, onEnded);
    },
    [language, unitId, playAudio]
  );

  // 라운드가 열리면 찾을 글자를 한 번 읽어준다 — 소리와 모양을 같이 붙잡게.
  const sayRef = useRef(say);
  sayRef.current = say;
  const soundKey = card?.sound ?? '';
  useEffect(() => {
    if (!soundKey || done) return;
    sayRef.current(soundKey);
  }, [soundKey, round, done]);

  const handleTap = useCallback(
    (idx: number) => {
      if (done || !card || foundRef.current.includes(idx)) return;
      if (board[idx] !== card.letter) {
        setMissed(idx);
        scheduleTimer(() => setMissed(null), 500);
        playFeedbackSound(false);
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

      if (!isRoundDone) {
        say(card.sound);
        return;
      }
      // 🔴 글자 소리 → 쉼 → (마지막이면 칭찬 / 아니면 딩동 → 쉼 → 다음 라운드)
      //    라운드가 넘어가면 위 effect 가 새 글자를 읽는다.
      if (isLast) setDone(true);
      say(card.sound, () =>
        scheduleTimer(() => {
          if (isLast) {
            playCorrectSequence({
              language: language === 'english' ? 'en' : 'ko',
              onDone: onComplete,
            });
            return;
          }
          playAudio('/sounds/game/correct.mp3', () =>
            scheduleTimer(() => {
              foundRef.current = [];
              setFound([]);
              setRound((r) => r + 1);
            }, REST_MS)
          );
        }, REST_MS)
      );
    },
    [
      done,
      card,
      board,
      round,
      hunt.length,
      say,
      playAudio,
      playFeedbackSound,
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
                  'w-[min(14vw,13vh)] h-[min(14vw,13vh)] rounded-2xl border-[4px] flex items-center justify-center font-black transition',
                  'text-[min(8vw,7vh)] leading-none',
                  got
                    ? 'bg-mint-500 border-mint-500 text-white scale-95'
                    : missed === idx
                      ? 'bg-danger/10 border-danger text-ink-700 animate-shake'
                      : 'bg-white border-white text-ink-900 active:scale-95',
                ].join(' ')}
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
