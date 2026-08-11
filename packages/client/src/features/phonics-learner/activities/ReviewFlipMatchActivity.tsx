import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useActivitySound } from '../hooks/useActivitySound';
import { useEntryGuide, ENTRY_GUIDE } from '../hooks/useEntryGuide';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';
import type { ReviewCardSource } from '../hooks/useReviewCardSources';
import { ActivityShell } from '../components/ActivityShell';

interface Props {
  unitId: string;
  sources: ReadonlyArray<ReviewCardSource>;
  language?: 'korean' | 'english' | 'zh';
  /**
   * 카드 앞면을 **낱말이 아니라 글자**로 — 영어 Book 1 처럼 **글자가 목표**인 권.
   * 🔴 낱말↔그림으로 짝을 지으면 알파벳을 한 번도 안 거치고 통과할 수 있다(사용자 지적:
   *    "알파벳 공부가 중요한건 알지?"). 글자↔그림이면 기억해야 할 것이 곧 글자다.
   *    낱말은 그림 칸 **아래 라벨**로 남아 있어 무엇의 그림인지는 여전히 알 수 있고,
   *    맞히면 낱말을 읽어준다(보상은 낱말, 과제는 글자).
   */
  letterFace?: boolean;
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

/**
 * 글자면 라벨 — 영어는 **대·소문자 쌍**(`Dd`). 복습 안 다른 활동(듣고 단어 `Aa`, 학습 단원 탭)이
 * 전부 쌍이라 여기만 대문자 하나면 같은 글자가 화면마다 다른 꼴로 보인다(2026-07-29 검수).
 * 🔴 `syllable` 은 영어에서 소문자다(`{letter:'A', syllable:'a'}`) — 한글은 `가` 라 쌍이 성립 안 하므로
 *    이 함수는 `letterFace`(= Book 1)에서만 쓴다.
 */
function faceLabel(card: { letter: string; syllable?: string }): string {
  const lower = card.syllable ?? '';
  return /^[a-z]$/i.test(lower) && lower.toLowerCase() !== card.letter.toLowerCase()
    ? card.letter
    : `${card.letter}${lower}`;
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
  letterFace = false,
  onComplete,
  onBack,
}: Props) {
  const { t } = useTranslation('phonics');
  const {
    say: speak,
    rest,
    playFeedbackSound,
    playCorrectSequence,
    praiseVisible,
    playAudio,
  } = useActivitySound({ unitId, language, prefix: 'review-flip' });
  // 진입 안내 — 화면의 "같은 짝을 찾아봐!" 에 맞는 음성.
  useEntryGuide(ENTRY_GUIDE.flipMatch, playAudio);

  const picked = useMemo(() => sources.slice(0, PAIRS), [sources]);

  // 🔴 짝을 맞추면 **낱말**을 읽어준다 — 카드에 보이는 게 '고기'인데 'ㄱ' 이 나오면 방금 맞춘 것과
  //    들리는 것이 어긋난다. 음소는 학습 단원이 맡고, 여기선 맞춘 것을 그대로 읽어 확인시킨다.
  const wordOf = useCallback((c: ReviewCardSource) => c.word || c.sound, []);

  usePhonicsTtsWarm(
    unitId,
    useMemo(() => picked.map(wordOf), [picked, wordOf]),
    'review-flip',
    language
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
  /** 방금 안 맞은 두 장 — 덮이기 전까지 흔들린다. */
  const [wrong, setWrong] = useState<string[]>([]);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  // 🔴 맞히면 **저작 녹음**("c c cup")을 읽는다 — Book 1 은 낱말 텍스트를 concat 하면 밋밋한 "cup" 이
  //    되므로, wordFamilies 의 「글자 글자 낱말」 mp3(`card.ttsUrl`)를 directUrl 로 그대로 재생한다.
  const say = useCallback(
    (card: ReviewCardSource, onEnded?: () => void) =>
      void speak(wordOf(card), onEnded, card.ttsUrl),
    [speak, wordOf]
  );

  const handleTap = useCallback(
    (tile: Tile) => {
      if (locked || open.includes(tile.id) || matched.has(tile.card.letter)) return;
      const next = [...open, tile.id];
      setOpen(next);
      // 🔴 **맞히기 전엔 아무 소리도 안 낸다**(2026-08-02 사용자: "정답 맞추기 전까지는 알파벳 읽어주지마").
      //    예전엔 글자를 뒤집을 때마다 그 글자 소리를 냈는데, 맞혔을 때 나는 "c c cup" 안에 글자 소리가
      //    이미 들어 있어 중복이었다. 소리는 **성공의 보상**으로만 낸다(다른 복습 활동과 통일).
      if (next.length < 2) return;

      const [a, b] = next.map((id) => tiles.find((t) => t.id === id)!);
      if (a.card.letter === b.card.letter && a.face !== b.face) {
        const done = new Set(matched).add(a.card.letter);
        setMatched(done);
        setOpen([]);
        // 🔴 낱말 끝 → **쉼** → 칭찬/띵동. 끝나자마자 붙이면 한 덩어리로 들린다.
        say(a.card, () =>
          rest(() => {
            if (done.size >= picked.length) {
              playCorrectSequence({
                language: language === 'english' ? 'en' : 'ko',
                onDone: onComplete,
              });
            } else {
              playFeedbackSound(true);
            }
          })
        );
        return;
      }
      /**
       * 안 맞음 — 잠깐 보여주고 덮는다.
       * 🔴 **틀렸다는 걸 알려준다**(2026-07-29 사용자 지시). 예전엔 소리도 표시도 없이 그냥 덮여서,
       *    아이 눈엔 카드가 저절로 닫힌 것과 구분이 안 됐다("내가 뭘 잘못했지?"가 아니라 "왜 닫히지?").
       *    다른 게임과 같은 오답음 + 두 장 흔들기 — 벌이 아니라 **무슨 일이 일어났는지**를 말해준다.
       */
      setLocked(true);
      setWrong(next);
      playFeedbackSound(false);
      timer.current = window.setTimeout(() => {
        setOpen([]);
        setWrong([]);
        setLocked(false);
      }, FLIP_BACK_MS);
    },
    [
      locked,
      open,
      matched,
      tiles,
      say,
      rest,
      picked.length,
      playCorrectSequence,
      playFeedbackSound,
      language,
      onComplete,
    ]
  );

  return (
    <ActivityShell onBack={onBack}>
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl sm:text-4xl font-black text-ink-900 text-center break-keep">
          {matched.size >= picked.length ? t('flip.allMatched') : t('flip.prompt')}
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
                  aria-label={isOpen ? tile.card.word || tile.card.letter : t('flip.flip')}
                  className={[
                    // 🔴 칸 크기는 vw 만 보면 안 된다 — 전체화면 활동이라 **높이가 먼저 남는다/모자란다**.
                    //    `min(vw, vh)` 로 잡아야 큰 화면에서 카드가 좁쌀만 해지지 않는다(1370px 에서 112px 였다).
                    'relative w-[min(20vw,18vh)] h-[min(20vw,18vh)] rounded-2xl border-[4px] overflow-hidden shadow-soft transition active:scale-[0.97] flex items-center justify-center',
                    isMatched
                      ? 'bg-mint-100 border-mint-500'
                      : wrong.includes(tile.id)
                        ? 'bg-danger/10 border-danger animate-shake'
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
                          letterFace
                            ? 'text-4xl sm:text-6xl font-display'
                            : (tile.card.word || tile.card.letter).length >= 3
                              ? 'text-xl sm:text-3xl'
                              : 'text-2xl sm:text-4xl',
                          isMatched ? 'text-mint-600' : 'text-coral-600',
                        ].join(' ')}
                      >
                        {letterFace ? faceLabel(tile.card) : tile.card.word || tile.card.letter}
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

        {/* 모은 것 — 맞춘 짝은 **글자**로 남는다.
            🔴 여기가 이 활동의 **유일한 글자 자리**다(2026-07-29). 카드 앞면은 낱말, 그림면은 그림,
               읽어주는 것도 낱말이라, 칩까지 낱말로 두면 파닉스 복습인데 **화면 어디에도 글자가 없다**.
               받침 복습에서 ㅇ·ㄱ·ㄴ·ㄹ 이 한 번도 안 보였다(검수로 잡힘). 모듈 문서도 원래
               "칩이 음소를 맡으므로 파닉스가 유지된다"고 적어둔 자리다 — 코드만 어긋나 있었다. */}
        <div className="flex flex-wrap justify-center gap-2">
          {picked.map((s) => (
            <span
              key={`${s.unitId}-${s.letter}`}
              className={[
                'h-10 sm:h-12 min-w-[2.5rem] sm:min-w-[3rem] px-3 rounded-full flex items-center justify-center text-lg sm:text-xl font-black shadow-soft transition break-keep',
                matched.has(s.letter) ? 'bg-mint-500 text-white' : 'bg-white/70 text-ink-300',
              ].join(' ')}
            >
              {matched.has(s.letter) ? s.letter : '?'}
            </span>
          ))}
        </div>
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </ActivityShell>
  );
}
