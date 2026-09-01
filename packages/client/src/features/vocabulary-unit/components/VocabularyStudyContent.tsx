import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Mascot } from '@/design-system';
import { useStarBalance } from '@/features/rewards';
import { VocabSourceProvider } from '@/features/learning';
import type {
  GameTypeId,
  Lang,
  Storybook,
  VocabularyUnit,
  VocabularyUnitWord,
} from '@tangobook/shared';
import { getAvailableGames, getGameData, type VocabGameOption } from '../lib/game-data-adapter';
import { useGameAssetPreload } from '@/features/games/hooks/useGameAssetPreload';
import { usePhonicsMap } from '@/features/games/hooks/usePhonicsMap';
import { GameLoadingGate } from '@/features/games/components/GameLoadingGate';
import { LineMatchingPlayer } from '@/features/games/components/players/LineMatchingPlayer';
import { KoreanBlockPlayer } from '@/features/games/components/players/KoreanBlockPlayer';
import { EnglishBlockPlayer } from '@/features/games/components/players/EnglishBlockPlayer';
import { OrderBlockPlayer } from '@/features/games/components/players/OrderBlockPlayer';
import { LangWordWritingPlayer } from '@/features/games/components/players/LangWordWritingPlayer';
// paint 모드(LetterFillCanvas) 통일 플레이어 — 레거시 WordWritingPlayer(자유 획 픽셀 채점) 대체 (2026-07-02)
import { KoreanWordWritingPlayer } from '@/features/games/components/players/KoreanWordWritingPlayer';
import { EnglishWordWritingPlayer } from '@/features/games/components/players/EnglishWordWritingPlayer';
import { ConnectTheDotsPlayer } from '@/features/games/components/players/ConnectTheDotsPlayer';
import { StoryImagePlayer } from '@/features/games/components/players/StoryImagePlayer';
import { PageOrderPlayer } from '@/features/games/components/players/PageOrderPlayer';
import { WordDetailModal } from './WordDetailModal';

/**
 * 게임 카드 묶음 — 순서가 곧 화면 순서다. 낱말이 먼저, 책 내용이 다음.
 * 🔴 묶음마다 **자기 색**을 준다(디자인 시스템: 학습=coral/peach · 게임=mint). 예전엔 첫 카드만
 *    coral 이고 나머지가 흰색이었는데, 그건 게임 넷 중 「여기부터」를 고르라는 규칙이었다.
 *    **대등한 선택지 둘**에 그 규칙을 쓰면 둘째가 곁다리로 보인다(사용자 2026-09-01).
 *    묶음 안에 들어가서도 같은 색이 배경으로 깔려 「다른 방」이라는 게 읽힌다.
 */
const TONE = {
  coral: {
    fill: 'bg-gradient-to-b from-coral-400 to-coral-500 text-white',
    shadow: 'shadow-[0_6px_0_#B73A1F,0_8px_20px_rgba(255,94,58,0.35)]',
    textShadow: '0 2px 0 rgba(167, 50, 25, 0.4)',
    chip: 'bg-white/90 text-coral-600',
    arrow: 'bg-white/95 text-coral-600',
  },
  mint: {
    fill: 'bg-gradient-to-b from-mint-400 to-mint-500 text-white',
    shadow: 'shadow-[0_6px_0_#1F6749,0_8px_20px_rgba(58,168,126,0.35)]',
    textShadow: '0 2px 0 rgba(31, 103, 73, 0.4)',
    chip: 'bg-white/90 text-mint-600',
    arrow: 'bg-white/95 text-mint-600',
  },
} as const;

type Tone = keyof typeof TONE;

const GAME_GROUPS = [
  {
    key: 'word' as const,
    emoji: '🔤',
    headingKey: 'study.wordGamesHeading',
    hintKey: 'study.wordGamesHint',
    tone: 'coral' as const,
  },
  {
    key: 'story' as const,
    emoji: '📖',
    headingKey: 'study.storyGamesHeading',
    hintKey: 'study.storyGamesHint',
    tone: 'mint' as const,
  },
];

const HANGUL_RE = /[가-힣]/;
const ENGLISH_RE = /^[a-zA-Z]+$/;

function getDisplayWord(w: VocabularyUnitWord, lang: Lang): string | null {
  if (lang === 'ko')
    return (w.korean && w.korean.trim()) || (HANGUL_RE.test(w.word) ? w.word : null);
  if (lang !== 'en') {
    const tr = w.nameTranslations?.[lang]?.trim();
    if (tr) return tr;
  }
  return (w.nameEn && w.nameEn.trim()) || (ENGLISH_RE.test(w.word) ? w.word : null);
}

interface VocabularyStudyContentProps {
  unit: VocabularyUnit;
  /** storybook source 단원이면 책 데이터 — 페이지 일러스트 lookup 등에 활용 */
  storybook?: Storybook;
  /** 현재 활성 그림체 — 단어 상세 모달의 페이지 일러스트 변형 */
  currentStyle?: string;
  lang: Lang;
}

/**
 * 단원 학습 콘텐츠 — 단어 미리보기 + 게임 카드 grid + 게임/단어 상세 모달.
 *
 * 두 곳에서 사용:
 *  - VocabularyStudyPage (단원 학습 풀화면, /vocabulary/:unitId)
 *  - BookDetailPage (책 상세 inline 학습 섹션)
 *
 * 이번 통합으로 책 = 학습 단위 정체성 명확화. 사이드바 어휘 axis hide 와 align.
 */
export function VocabularyStudyContent({
  unit,
  storybook,
  currentStyle,
  lang,
}: VocabularyStudyContentProps) {
  const { t } = useTranslation('games');
  const [activeGame, setActiveGame] = useState<GameTypeId | null>(null);
  /**
   * 어느 묶음을 펼쳤나. `null` = 묶음 고르는 화면.
   * 🔴 게임 일곱 장을 한 화면에 늘어놓으니 무엇을 고르는 화면인지 안 읽혔다(사용자 2026-09-01).
   *    먼저 「무엇을 하고 놀까」를 고르고, 그 안에서 게임을 고른다.
   */
  const [openGroup, setOpenGroup] = useState<'word' | 'story' | null>(null);
  const [selectedWord, setSelectedWord] = useState<VocabularyUnitWord | null>(null);
  const { refetch: refetchBalance } = useStarBalance();

  const games = getAvailableGames(unit, lang, t, storybook, currentStyle);

  // 사용자 정책 (2026-05-10): 게임은 매번 랜덤 N개 단어라 "완료" 개념 X.
  // 게임 카드 done 표시 / 단원 완료 메시지 모두 제거. 게임 결과는 GameResultScreen 에서 호리/칭찬.
  const handleGameComplete = (_gameType: GameTypeId) => {
    setActiveGame(null);
    void refetchBalance();
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
  };

  const handleGameBack = () => {
    setActiveGame(null);
  };

  return (
    <>
      {/* 묶음 고르기 — 두 장뿐이라 무엇을 고르는 화면인지 한눈에 읽힌다.
          🔴 아래가 비므로 카드를 화면 높이에 맞춰 키운다(작은 카드 둘 + 여백 60% 는 미완성으로 보인다). */}
      {openGroup === null && (
        <section className="grid grid-cols-1 sm:grid-cols-2 auto-rows-fr gap-4 lg:gap-6 w-full max-w-4xl mx-auto">
          {GAME_GROUPS.map(({ key, emoji, headingKey, hintKey, tone }) => {
            const groupGames = games.filter((g) => g.group === key);
            const playable = groupGames.filter((g) => g.available);
            if (playable.length === 0) return null;
            return (
              <GroupCard
                key={key}
                emoji={emoji}
                label={t(headingKey)}
                sub={t(hintKey)}
                preview={playable}
                tone={tone}
                onOpen={() => setOpenGroup(key)}
              />
            );
          })}
        </section>
      )}

      {/* 묶음 안 — 색은 제목과 카드가 들고, 배경 판은 두지 않는다.
          🔴 큰 색판을 깔았더니 1600px 로 늘어나 카드 오른쪽이 통째로 비었고, 옅은 색 위의
             흰 카드가 흐릿해 보였다(사용자 2026-09-01). 폭은 고르는 화면과 같은 max-w-4xl. */}
      {openGroup !== null &&
        (() => {
          const group = GAME_GROUPS.find((g) => g.key === openGroup)!;
          const groupGames = games.filter((g) => g.group === openGroup);
          return (
            <section className="w-full max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <button
                  onClick={() => setOpenGroup(null)}
                  className="min-h-[44px] px-4 rounded-full bg-white text-ink-700 font-black shadow-soft hover:shadow-pop transition break-keep"
                >
                  ← {t('study.otherPlay')}
                </button>
                <h2
                  className={`text-2xl lg:text-3xl font-black font-display flex items-center gap-2 break-keep ${
                    group.tone === 'mint' ? 'text-mint-700' : 'text-coral-600'
                  }`}
                >
                  <span>{group.emoji}</span>
                  <span>{t(group.headingKey)}</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 auto-rows-fr gap-3 lg:gap-4">
                {groupGames.map((g, i) => (
                  <GameCard
                    key={g.id}
                    game={g}
                    index={i}
                    tone={group.tone}
                    onPlay={() => g.available && setActiveGame(g.id)}
                  />
                ))}
              </div>

              {/* 낱말 미리보기는 **낱말 묶음의 참고 자리**다 — 고르는 화면과 이야기 묶음엔 안 나온다. */}
              {openGroup === 'word' && (
                <div className="mt-6">
                  <div className="flex items-baseline gap-3 mb-2 px-1">
                    <h3 className="text-xl lg:text-2xl font-black font-display text-ink-900 flex items-center gap-2">
                      <span>📚</span>
                      <span>{t('study.wordsHeading')}</span>
                    </h3>
                    <span className="text-sm font-bold text-ink-700">{t('study.wordsHint')}</span>
                  </div>
                  <WordPreviewBanner words={unit.words} lang={lang} onWordClick={setSelectedWord} />
                </div>
              )}
            </section>
          );
        })()}

      {/* 게임 모달 — full screen, VocabSourceProvider wrap */}
      <AnimatePresence>
        {activeGame && (
          <GameOverlay
            key={activeGame}
            unit={unit}
            game={activeGame}
            lang={lang}
            storybook={storybook}
            currentStyle={currentStyle}
            onComplete={() => handleGameComplete(activeGame)}
            onBack={handleGameBack}
          />
        )}
      </AnimatePresence>

      {/* 단어 상세 모달 — 책 페이지 + 단어 듣기 + 예문 듣기 */}
      <AnimatePresence>
        {selectedWord && (
          <WordDetailModal
            key={selectedWord.word}
            word={selectedWord}
            storybook={storybook}
            currentStyle={currentStyle}
            lang={lang}
            onClose={() => setSelectedWord(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   단어 미리보기 배너 — 가로 스크롤 (sneak peek, 탭 → 단어 상세)
   ───────────────────────────────────────────────────────────────────── */

interface WordPreviewBannerProps {
  words: VocabularyUnitWord[];
  lang: Lang;
  onWordClick: (word: VocabularyUnitWord) => void;
}

function WordPreviewBanner({ words, lang, onWordClick }: WordPreviewBannerProps) {
  const { t } = useTranslation('games');
  // 단일 언어 정책 (2026-07-13): 재생 언어 단어 하나만 표시 — 반대 언어 보조 라벨(sub) 제거.
  const items = useMemo(
    () =>
      words
        .map((w) => {
          const main = getDisplayWord(w, lang);
          const img = w.images?.find((im) => im.isPrimary)?.imageUrl ?? w.images?.[0]?.imageUrl;
          if (!main) return null;
          return { main, img, word: w };
        })
        .filter(
          (
            x
          ): x is {
            main: string;
            img: string | undefined;
            word: VocabularyUnitWord;
          } => x !== null
        ),
    [words, lang]
  );

  if (items.length === 0) return null;

  return (
    <div className="overflow-x-auto scrollbar-thin">
      {/* w-fit + mx-auto = 카드가 컨테이너 폭보다 좁으면 가운데 정렬, 넘치면 자동 좌측 시작 + 스크롤 */}
      <div className="flex gap-3 pb-2 snap-x snap-mandatory w-fit mx-auto">
        {items.map((it, i) => (
          <button
            key={`${it.main}-${i}`}
            onClick={() => onWordClick(it.word)}
            className="snap-start shrink-0 w-24 sm:w-28 lg:w-32 bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-pop hover:-translate-y-0.5 active:scale-95 transition flex flex-col"
            aria-label={t('study.detailAria', { word: it.main })}
          >
            <div className="aspect-square w-full bg-gradient-to-b from-cream-50 to-white flex items-center justify-center">
              {it.img ? (
                <img
                  src={it.img}
                  alt=""
                  aria-hidden
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="text-4xl">📦</span>
              )}
            </div>
            <div className="px-2 py-1.5 text-center">
              <div className="text-lg lg:text-xl font-black text-ink-900 font-display truncate leading-tight">
                {it.main}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   GroupCard — 「무엇을 하고 놀까」 한 묶음. 게임 카드와 같은 푸시 버튼 톤.
   ───────────────────────────────────────────────────────────────────── */

function GroupCard({
  emoji,
  label,
  sub,
  preview,
  tone,
  onOpen,
}: {
  emoji: string;
  label: string;
  sub: string;
  /**
   * 이 묶음에서 **지금 할 수 있는** 게임들 — 카드 안에 작게 늘어놓는다.
   * 🔴 「N가지」라는 숫자만 있던 화면은 두 버튼짜리 메뉴라 한 페이지를 쓸 값어치가 없었다.
   *    무엇이 들었는지 보여야 고를 수 있고, 그림이 카드를 채운다.
   */
  preview: VocabGameOption[];
  tone: Tone;
  onOpen: () => void;
}) {
  const c = TONE[tone];
  return (
    <button
      onClick={onOpen}
      className={`relative rounded-3xl p-5 lg:p-6 pb-16 min-h-[clamp(13rem,36vh,22rem)] flex flex-col items-center justify-center text-center gap-2 hover:-translate-y-0.5 active:translate-y-1 transition-all duration-100 ease-out ${c.fill} ${c.shadow}`}
    >
      <span className="text-[clamp(2.5rem,8vh,4rem)] leading-none" aria-hidden>
        {emoji}
      </span>
      <span
        className="text-2xl lg:text-3xl font-black font-display break-keep"
        style={{ textShadow: c.textShadow }}
      >
        {label}
      </span>
      <span className="text-sm lg:text-base font-bold break-keep opacity-95">{sub}</span>

      {/* 안에 든 게임 — 그림 + 이름. 아이는 그림으로, 부모는 이름으로 읽는다. */}
      <ul className="mt-3 flex flex-wrap items-start justify-center gap-1.5 lg:gap-3">
        {preview.map((g) => (
          <li
            key={g.id}
            className={`w-16 lg:w-20 flex flex-col items-center gap-1 rounded-2xl px-1 py-2 ${c.chip}`}
          >
            {g.iconSrc ? (
              <img src={g.iconSrc} alt="" aria-hidden className="w-9 h-9 object-contain" />
            ) : (
              <span className="text-3xl leading-none" aria-hidden>
                {g.emoji}
              </span>
            )}
            <span className="text-[0.65rem] lg:text-xs font-black leading-tight break-keep">
              {g.label}
            </span>
          </li>
        ))}
      </ul>

      <span
        className={`absolute bottom-4 right-4 w-11 h-11 rounded-full flex items-center justify-center shadow-soft ${c.arrow}`}
        aria-hidden
      >
        <span className="text-2xl font-black">→</span>
      </span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   GameCard — 게임 1종 시작 버튼 카드 (Duolingo 식 푸시 버튼 + 좌상단 번호)
   ───────────────────────────────────────────────────────────────────── */

function GameCard({
  game,
  index,
  tone,
  onPlay,
}: {
  game: VocabGameOption;
  index: number;
  /** 이 카드가 속한 묶음 색 — 채움 카드와 배지가 그 색을 쓴다. */
  tone: Tone;
  onPlay: () => void;
}) {
  const accent = tone === 'mint' ? 'bg-mint-100 text-mint-600' : 'bg-coral-100 text-coral-600';
  // 좌상단 번호 배지 — 순서는 **번호가** 말한다.
  const numberBadge = (
    <span
      aria-hidden
      className={`absolute top-3 left-3 w-8 h-8 rounded-full text-sm font-black flex items-center justify-center shadow-soft z-10 ${accent}`}
    >
      {index + 1}
    </span>
  );

  // 좌측 큰 일러스트 — 카드 일러스트 그대로 (배경 X). emoji 는 fallback.
  const leftIllustration = (extraClass = '') => (
    <div className="w-24 h-24 lg:w-28 lg:h-28 flex-shrink-0 flex items-center justify-center">
      {game.iconSrc ? (
        <img
          src={game.iconSrc}
          alt={game.label}
          className={`w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)] ${extraClass}`}
        />
      ) : (
        <span className={`text-7xl ${extraClass}`}>{game.emoji}</span>
      )}
    </div>
  );

  // 우끝 → 화살표 동그라미 (묶음색 연한 원)
  const arrowCircle = (
    <div
      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${accent}`}
    >
      <span
        className={`text-2xl font-black ${tone === 'mint' ? 'text-mint-600' : 'text-coral-600'}`}
      >
        →
      </span>
    </div>
  );

  if (!game.available) {
    // 비활성 — 평면 회색 (시각 시그널 일부러 약하게 두는 게 의도)
    return (
      <button
        disabled
        className="relative rounded-3xl p-5 min-h-[120px] flex items-center gap-5 bg-slate-100 text-slate-400 cursor-not-allowed"
      >
        {numberBadge}
        {leftIllustration('opacity-40 grayscale')}
        <div className="flex-1 flex flex-col items-start gap-1 pr-2">
          <span className="text-2xl lg:text-3xl font-black">{game.label}</span>
          {game.unavailableReason && (
            <span className="text-sm font-bold text-left">{game.unavailableReason}</span>
          )}
        </div>
      </button>
    );
  }

  /**
   * Duolingo 식 푸시 버튼 (가로 layout): 좌 큰 일러스트 / 가운데 제목+부제 / 우 → 화살표.
   * 🔴 **카드 하나만 채우던 규칙을 없앴다**(2026-09-01 사용자, 두 번 지적). 그건 게임 넷을
   *    한 화면에 늘어놓던 시절 「여기부터」를 고르라는 장치였는데, 지금은 묶음 카드가 색을 들고
   *    카드마다 번호가 있다. 한 장만 색이 차 있으면 나머지가 꺼진 것처럼 보인다.
   */
  return (
    <button
      onClick={onPlay}
      className="relative rounded-3xl p-3 lg:p-4 min-h-[120px] flex items-center gap-3 lg:gap-4 hover:-translate-y-0.5 active:translate-y-1 transition-all duration-100 ease-out text-left bg-white text-ink-900 shadow-[0_5px_0_#EDE1D4,0_6px_14px_rgba(63,47,36,0.10)] hover:shadow-[0_7px_0_#EDE1D4,0_10px_18px_rgba(63,47,36,0.14)] active:shadow-[0_2px_0_#EDE1D4,0_3px_6px_rgba(63,47,36,0.10)]"
    >
      {numberBadge}
      {leftIllustration()}
      <div className="flex-1 flex flex-col items-start gap-1 min-w-0">
        <span className="text-xl lg:text-2xl font-black font-display">{game.label}</span>
        {game.subtitle && (
          <span className="text-xs lg:text-sm font-bold text-ink-600">{game.subtitle}</span>
        )}
      </div>
      {arrowCircle}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   GameOverlay — 게임 모달 (VocabSourceProvider wrap)
   ───────────────────────────────────────────────────────────────────── */

/**
 * 게임 한 판을 전체화면으로 띄우는 오버레이.
 * 🔴 `export` 인 이유 — 랜딩(`/hangul`)이 **게임을 하나씩 따로** 얹는다. 목록 화면(카드 넷)을
 *    보여주면 「무엇을 하는 게임인지」가 아니라 「메뉴」가 보인다(2026-08-02 사용자 요청).
 *    앱 안에서는 여전히 `VocabularyStudyContent` 가 카드 → 이 오버레이 순서로 쓴다.
 */
export function GameOverlay({
  unit,
  game,
  lang,
  storybook,
  currentStyle,
  onComplete,
  onBack,
}: {
  unit: VocabularyUnit;
  game: GameTypeId;
  lang: Lang;
  storybook?: Storybook;
  currentStyle?: string;
  onComplete: () => void;
  onBack: () => void;
}) {
  const { t } = useTranslation('games');
  // 🔴 getGameData 는 내부에서 shuffleInPlace 로 매 호출마다 items 순서를 바꾼다(비결정적).
  //    memo 없이 매 렌더 호출하면 프리로드 게이트의 coreKey 가 매 렌더 바뀌어 effect 가 무한 재시작
  //    (게이트가 0% 에서 안 넘어감) → unit/lang/game 별로 한 번만 생성해 안정화.
  const data = useMemo(
    () => getGameData(unit, lang, game, storybook, currentStyle),
    [unit, lang, game, storybook, currentStyle]
  );
  // storybook source 단원이면 진짜 책 id (ConnectTheDotsPlayer 의 useStorybook lookup 등에 활용).
  // custom 단원은 게임 진입 disabled 라 도달 불가지만 안전망 placeholder.
  const effectiveStorybookId = unit.storybookId ?? `vocab-${unit.id}`;

  // 🔴 hooks 규칙: early return 앞에서 모든 훅 호출.
  // 파닉스 음절맵은 **음절 mp3 를 직접 재생하는 게임만** 필요(한글 블록·그림짝). 따라쓰기·점잇기·영어
  // 게임은 concat 으로 발음하므로 맵 불필요 → enabled=false 로 ~8s list fetch + mp3 200개 prefetch 스킵.
  const needsSyllables = game === 'korean-block' || game === 'korean-line-matching';
  const { mapRef: phonicsMapRef, loading: phonicsLoading } = usePhonicsMap(
    ['mod_korean', 'mod_phonics'],
    needsSyllables
  );
  const preload = useGameAssetPreload({
    data: (data ?? { type: game, items: [] }) as {
      type: string;
      items?: Array<Record<string, unknown>>;
      rounds?: Array<{
        text?: string;
        ttsUrl?: string;
        correctImageUrl?: string;
        distractorImageUrls?: string[];
      }>;
    },
    game,
    lang,
    book: storybook,
    phonicsMap: phonicsMapRef.current,
    phonicsReady: !phonicsLoading,
    style: currentStyle,
    storybookId: effectiveStorybookId,
  });
  const [skipped, setSkipped] = useState(false);
  const gateReady = preload.ready || skipped;

  if (!data) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-3xl shadow-pop p-8 max-w-sm w-full text-center">
          <Mascot state="thinking" size="md" />
          <p className="mt-3 text-lg text-ink-700 font-black font-display">
            {t('study.otherGame')}
          </p>
          <button
            onClick={onBack}
            className="mt-5 px-6 py-3 rounded-full bg-amber-500 text-white font-black shadow-pop text-lg"
          >
            {t('study.back')}
          </button>
        </div>
      </motion.div>
    );
  }

  if (!gateReady) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-cream-50"
      >
        <GameLoadingGate
          loaded={preload.loaded}
          total={preload.total}
          onSkip={() => setSkipped(true)}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-cream-50 overflow-auto"
    >
      <VocabSourceProvider unitId={unit.id}>
        {(game === 'korean-line-matching' || game === 'english-line-matching') && (
          <LineMatchingPlayer
            storybookId={effectiveStorybookId}
            gameData={data}
            difficulty="medium"
            onComplete={() => onComplete()}
            onBack={onBack}
            lang={lang}
          />
        )}
        {game === 'korean-block' && (
          <KoreanBlockPlayer
            storybookId={effectiveStorybookId}
            gameData={data}
            difficulty="medium"
            onComplete={() => onComplete()}
            onBack={onBack}
          />
        )}
        {game === 'english-block' && (
          <EnglishBlockPlayer
            storybookId={effectiveStorybookId}
            gameData={data}
            difficulty="medium"
            onComplete={() => onComplete()}
            onBack={onBack}
          />
        )}
        {game === 'order-block' && (
          <OrderBlockPlayer
            storybookId={effectiveStorybookId}
            gameData={data}
            difficulty="medium"
            onComplete={() => onComplete()}
            onBack={onBack}
          />
        )}
        {game === 'order-writing' && (
          <LangWordWritingPlayer
            storybookId={effectiveStorybookId}
            gameData={data}
            difficulty="medium"
            onComplete={() => onComplete()}
            onBack={onBack}
          />
        )}
        {game === 'connect-the-dots' && (
          <ConnectTheDotsPlayer
            storybookId={effectiveStorybookId}
            gameData={data}
            difficulty="medium"
            onComplete={() => onComplete()}
            onBack={onBack}
            lang={lang}
          />
        )}
        {game === 'korean-word-writing' && (
          <KoreanWordWritingPlayer
            storybookId={effectiveStorybookId}
            gameData={data}
            difficulty="medium"
            onComplete={() => onComplete()}
            onBack={onBack}
          />
        )}
        {game === 'english-word-writing' && (
          <EnglishWordWritingPlayer
            storybookId={effectiveStorybookId}
            gameData={data}
            difficulty="medium"
            onComplete={() => onComplete()}
            onBack={onBack}
          />
        )}
        {game === 'korean-page-order' && (
          <PageOrderPlayer
            storybookId={effectiveStorybookId}
            gameData={data}
            difficulty="medium"
            onComplete={() => onComplete()}
            onBack={onBack}
          />
        )}
        {game === 'korean-object-scene' && (
          <StoryImagePlayer
            storybookId={effectiveStorybookId}
            gameData={data}
            difficulty="medium"
            onComplete={() => onComplete()}
            onBack={onBack}
            lang="ko"
            variant="object"
          />
        )}
        {(game === 'korean-story-image' || game === 'english-story-image') && (
          <StoryImagePlayer
            storybookId={effectiveStorybookId}
            gameData={data}
            difficulty="medium"
            onComplete={() => onComplete()}
            onBack={onBack}
            lang={lang === 'ko' ? 'ko' : 'en'}
          />
        )}
      </VocabSourceProvider>
    </motion.div>
  );
}
