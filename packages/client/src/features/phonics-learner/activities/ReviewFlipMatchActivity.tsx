import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { resolveTtsUrl } from '@/features/tts';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';
import type { ReviewCardSource } from '../hooks/useReviewCardSources';

interface Props {
  unitId: string;
  sources: ReadonlyArray<ReviewCardSource>;
  language?: 'korean' | 'english';
  onComplete: () => void;
  onBack: () => void;
}

/** 짝 개수 — 4쌍(8장)이 4~7세가 한 화면에서 기억할 수 있는 한계다. */
const PAIRS = 4;
/** 안 맞았을 때 다시 덮이기까지. 너무 짧으면 못 보고, 길면 지루하다. */
const FLIP_BACK_MS = 900;

interface Tile {
  id: string;
  card: ReviewCardSource;
  face: 'letter' | 'image';
}

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 🎴 복습 — 뒤집기 짝 맞추기 (글자 ↔ 그림).
 *
 * 🔴 「짝 찾기」와 과제가 다르다. 짝 찾기는 화면에 다 보이는 걸 **알아보는** 일이고,
 *    이건 덮인 카드를 **기억해서** 맞추는 일이다. 복습에 기억 인출이 하나는 있어야 한다.
 * 🔴 그림↔그림이 아니라 **글자↔그림**으로 짝을 짓는다 — 순수 기억력 게임이 아니라 파닉스 복습이다.
 */
export function ReviewFlipMatchActivity({
  unitId,
  sources,
  language = 'korean',
  onComplete,
  onBack,
}: Props) {
  const { playAudio, playFeedbackSound, playCorrectSequence, praiseVisible } = useGameAudio();

  const picked = useMemo(() => sources.slice(0, PAIRS), [sources]);

  // 🔴 짝을 맞추면 **낱말**을 읽어준다 — 카드에 보이는 게 '고기'인데 'ㄱ' 이 나오면 방금 맞춘 것과
  //    들리는 것이 어긋난다. 음소는 학습 단원이 맡고, 여기선 맞춘 것을 그대로 읽어 확인시킨다.
  const wordOf = useCallback((c: ReviewCardSource) => c.word || c.sound, []);

  usePhonicsTtsWarm(
    unitId,
    useMemo(() => picked.map(wordOf), [picked, wordOf]),
    'review-flip'
  );

  const tiles = useMemo<Tile[]>(
    () =>
      shuffle(
        picked.flatMap((card) => [
          { id: `${card.unitId}-${card.letter}-L`, card, face: 'letter' as const },
          { id: `${card.unitId}-${card.letter}-I`, card, face: 'image' as const },
        ])
      ),
    [picked]
  );

  const [open, setOpen] = useState<string[]>([]); // 지금 뒤집힌 카드 (최대 2)
  const [matched, setMatched] = useState<ReadonlySet<string>>(() => new Set());
  const [locked, setLocked] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const say = useCallback(
    async (card: ReviewCardSource, onEnded?: () => void) => {
      const url = await resolveTtsUrl({
        text: wordOf(card),
        language,
        storybookId: unitId,
        identifierPrefix: 'review-flip',
      });
      if (url) playAudio(url, onEnded);
      else onEnded?.();
    },
    [language, unitId, playAudio, wordOf]
  );

  const handleTap = useCallback(
    (tile: Tile) => {
      if (locked || open.includes(tile.id) || matched.has(tile.card.letter)) return;
      const next = [...open, tile.id];
      setOpen(next);
      if (next.length < 2) return;

      const [a, b] = next.map((id) => tiles.find((t) => t.id === id)!);
      if (a.card.letter === b.card.letter && a.face !== b.face) {
        const done = new Set(matched).add(a.card.letter);
        setMatched(done);
        setOpen([]);
        // 🔴 TTS 끝난 뒤에 다음 단계 — setTimeout 으로 길이를 가정하지 않는다.
        say(a.card, () => {
          if (done.size >= picked.length) {
            playCorrectSequence({
              language: language === 'english' ? 'en' : 'ko',
              onDone: onComplete,
            });
          } else {
            playFeedbackSound(true);
          }
        });
        return;
      }
      // 안 맞음 — 잠깐 보여주고 덮는다. 소리로 혼내지 않는다.
      setLocked(true);
      timer.current = window.setTimeout(() => {
        setOpen([]);
        setLocked(false);
      }, FLIP_BACK_MS);
    },
    [
      locked,
      open,
      matched,
      tiles,
      say,
      picked.length,
      playCorrectSequence,
      playFeedbackSound,
      language,
      onComplete,
    ]
  );

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

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl sm:text-4xl font-black text-ink-900 text-center break-keep">
          {matched.size >= picked.length ? '다 맞췄어!' : '같은 짝을 찾아봐!'}
        </h2>

        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {tiles.map((tile) => {
            const isMatched = matched.has(tile.card.letter);
            const isOpen = open.includes(tile.id) || isMatched;
            const showWord = isOpen && tile.face === 'image' && !!tile.card.imageUrl;
            return (
              // 낱말 줄은 **항상 자리를 차지한다** — 뒤집을 때만 생기면 격자가 통째로 흔들린다.
              <div key={tile.id} className="flex flex-col items-center">
                <button
                  onClick={() => handleTap(tile)}
                  aria-label={isOpen ? tile.card.word || tile.card.letter : '뒤집기'}
                  className={[
                    // 🔴 칸 크기는 vw 만 보면 안 된다 — 전체화면 활동이라 **높이가 먼저 남는다/모자란다**.
                    //    `min(vw, vh)` 로 잡아야 큰 화면에서 카드가 좁쌀만 해지지 않는다(1370px 에서 112px 였다).
                    'relative w-[min(20vw,18vh)] h-[min(20vw,18vh)] rounded-2xl border-[4px] overflow-hidden shadow-soft transition active:scale-[0.97] flex items-center justify-center',
                    isMatched
                      ? 'bg-mint-100 border-mint-500'
                      : isOpen
                        ? 'bg-white border-coral-400'
                        : 'bg-gradient-to-br from-coral-400 to-coral-600 border-white',
                  ].join(' ')}
                >
                  {isOpen ? (
                    tile.face === 'image' && tile.card.imageUrl ? (
                      <img src={tile.card.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      // 🔴 글자 면은 **음소(ㄱ)가 아니라 낱말(고기)** — 음소만 덜렁 있으면 무엇의 짝인지
                      //    떠올릴 실마리가 없다. 이 활동은 낱말↔그림 기억 인출을 맡고, 음소 자체는
                      //    같은 복습 묶음의 듣기·글자쓰기 활동이 맡는다.
                      //    크기는 라벨 길이로 분기 — 3글자를 큰 글꼴로 두면 좁은 칸(75px)에서 넘친다.
                      <span
                        className={[
                          'font-black break-keep px-1 leading-none',
                          (tile.card.word || tile.card.letter).length >= 3
                            ? 'text-xl sm:text-3xl'
                            : 'text-2xl sm:text-4xl',
                          isMatched ? 'text-mint-600' : 'text-coral-600',
                        ].join(' ')}
                      >
                        {tile.card.word || tile.card.letter}
                      </span>
                    )
                  ) : (
                    // 뒷면 — 아이가 "누르면 뒤집힌다"를 그림으로 알게
                    <span className="text-3xl sm:text-4xl">❓</span>
                  )}
                </button>
                {/* 그림이 애매하면 무엇인지 알 수가 없어 짝을 못 짓는다 — 낱말을 칸 아래에 */}
                <span className="h-5 sm:h-6 text-xs sm:text-base font-black text-ink-700 leading-5 sm:leading-6 break-keep">
                  {showWord ? tile.card.word : ''}
                </span>
              </div>
            );
          })}
        </div>

        {/* 모은 것 — 맞춘 짝은 **낱말**로 남는다(카드·소리와 같게). 아직이면 '?'.
            🔴 낱말은 3글자까지 오므로 원이 아니라 알약 모양이어야 한다. */}
        <div className="flex flex-wrap justify-center gap-2">
          {picked.map((s) => (
            <span
              key={`${s.unitId}-${s.letter}`}
              className={[
                'h-10 sm:h-12 min-w-[2.5rem] sm:min-w-[3rem] px-3 rounded-full flex items-center justify-center text-lg sm:text-xl font-black shadow-soft transition break-keep',
                matched.has(s.letter) ? 'bg-mint-500 text-white' : 'bg-white/70 text-ink-300',
              ].join(' ')}
            >
              {matched.has(s.letter) ? wordOf(s) : '?'}
            </span>
          ))}
        </div>
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </div>
  );
}
