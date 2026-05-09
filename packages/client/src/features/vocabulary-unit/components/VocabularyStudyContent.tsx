import { useMemo, useState } from 'react';
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
import { LineMatchingPlayer } from '@/features/games/components/players/LineMatchingPlayer';
import { KoreanBlockPlayer } from '@/features/games/components/players/KoreanBlockPlayer';
import { EnglishBlockPlayer } from '@/features/games/components/players/EnglishBlockPlayer';
import { WordWritingPlayer } from '@/features/games/components/players/WordWritingPlayer';
import { ConnectTheDotsPlayer } from '@/features/games/components/players/ConnectTheDotsPlayer';
import { WordDetailModal } from './WordDetailModal';

const HANGUL_RE = /[가-힣]/;
const ENGLISH_RE = /^[a-zA-Z]+$/;

function getDisplayWord(w: VocabularyUnitWord, lang: Lang): string | null {
  if (lang === 'ko')
    return (w.korean && w.korean.trim()) || (HANGUL_RE.test(w.word) ? w.word : null);
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
  const [activeGame, setActiveGame] = useState<GameTypeId | null>(null);
  const [completedGames, setCompletedGames] = useState<Set<GameTypeId>>(new Set());
  const [selectedWord, setSelectedWord] = useState<VocabularyUnitWord | null>(null);
  const { refetch: refetchBalance } = useStarBalance();

  const games = getAvailableGames(unit, lang);

  const handleGameComplete = (gameType: GameTypeId) => {
    setActiveGame(null);
    setCompletedGames((prev) => new Set([...prev, gameType]));
    void refetchBalance();
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
  };

  const handleGameBack = () => {
    setActiveGame(null);
  };

  const allDone = games.filter((g) => g.available).every((g) => completedGames.has(g.id));

  return (
    <>
      {/* 단어 sub-section — boundary 명시. 탭하면 단어 상세 모달. */}
      <section className="bg-white/70 rounded-2xl px-4 py-3 shadow-soft">
        <h3 className="text-sm md:text-base font-black text-ink-700 mb-2 flex items-center gap-2">
          <span className="text-lg">📚</span>
          <span>단어 둘러보기</span>
          <span className="ml-auto text-xs font-bold text-ink-400">탭하면 자세히</span>
        </h3>
        <WordPreviewBanner words={unit.words} lang={lang} onWordClick={setSelectedWord} />
      </section>

      {/* 게임 sub-section — 다른 배경 톤으로 단어 영역과 명시 분리 */}
      <section className="bg-amber-50/80 rounded-2xl px-4 py-3 shadow-soft mt-3">
        <h3 className="text-sm md:text-base font-black text-ink-700 mb-2 flex items-center gap-2">
          <span className="text-lg">🎮</span>
          <span>게임으로 익히기</span>
          <span className="ml-auto text-xs font-bold text-ink-400">처음이면 1번부터</span>
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {games.map((g, i) => (
            <GameCard
              key={g.id}
              game={g}
              index={i}
              done={completedGames.has(g.id)}
              onPlay={() => g.available && setActiveGame(g.id)}
            />
          ))}
        </div>
      </section>

      {/* 단원 완료 */}
      {allDone && completedGames.size > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mt-6 mx-auto max-w-md bg-white rounded-3xl shadow-pop border-4 border-amber-200 p-6 text-center"
        >
          <Mascot state="celebrating" size="md" />
          <h2 className="mt-3 text-2xl font-black font-display text-ink-900">단원 완료!</h2>
          <p className="mt-1 text-sm text-ink-600 font-bold">모든 게임 통과 ✨ 잘했어!</p>
        </motion.div>
      )}

      {/* 게임 모달 — full screen, VocabSourceProvider wrap */}
      <AnimatePresence>
        {activeGame && (
          <GameOverlay
            key={activeGame}
            unit={unit}
            game={activeGame}
            lang={lang}
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
  const items = useMemo(
    () =>
      words
        .map((w) => {
          const label = getDisplayWord(w, lang);
          const img = w.images?.find((im) => im.isPrimary)?.imageUrl ?? w.images?.[0]?.imageUrl;
          if (!label) return null;
          return { label, img, word: w };
        })
        .filter(
          (x): x is { label: string; img: string | undefined; word: VocabularyUnitWord } =>
            x !== null
        ),
    [words, lang]
  );

  if (items.length === 0) return null;

  return (
    <div className="overflow-x-auto scrollbar-thin">
      {/* w-fit + mx-auto = 카드가 컨테이너 폭보다 좁으면 가운데 정렬, 넘치면 자동 좌측 시작 + 스크롤 */}
      <div className="flex gap-2 pb-2 snap-x snap-mandatory w-fit mx-auto">
        {items.map((it, i) => (
          <button
            key={`${it.label}-${i}`}
            onClick={() => onWordClick(it.word)}
            className="snap-start shrink-0 w-16 sm:w-20 bg-white rounded-xl overflow-hidden shadow-soft hover:shadow-pop hover:-translate-y-0.5 active:scale-95 transition"
            aria-label={`${it.label} 자세히 보기`}
          >
            <div className="aspect-square w-full bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
              {it.img ? (
                <img
                  src={it.img}
                  alt=""
                  aria-hidden
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="text-2xl">📦</span>
              )}
            </div>
            <div className="px-1 py-1 text-center text-xs font-black text-ink-900 font-display truncate">
              {it.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   GameCard — 게임 1종 시작 버튼 카드 (Duolingo 식 푸시 버튼 + 좌상단 번호)
   ───────────────────────────────────────────────────────────────────── */

function GameCard({
  game,
  index,
  done,
  onPlay,
}: {
  game: VocabGameOption;
  index: number;
  done: boolean;
  onPlay: () => void;
}) {
  // 좌상단 번호 배지 — "처음이면 1번부터" 결정 마비 해소. 모든 state 공통.
  const numberBadge = (
    <span
      aria-hidden
      className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white text-coral-600 text-base font-black flex items-center justify-center shadow-soft ring-2 ring-coral-200/50 z-10"
    >
      {index + 1}
    </span>
  );

  // 흰 동그라미 안에 이모지 — '버튼 위 아이콘' 어포던스
  const iconWash = (extraEmojiClass = '') => (
    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
      <span className={`text-5xl ${extraEmojiClass}`}>{game.emoji}</span>
    </div>
  );

  if (done) {
    // 완료 — success 톤 살짝 입체 + line-through 라벨
    return (
      <button
        disabled
        className="relative rounded-3xl p-5 min-h-[156px] flex flex-col items-center justify-center gap-2 bg-cream-50 border-4 border-success shadow-[0_4px_0_#3FA379,0_4px_12px_rgba(92,201,159,0.2)] cursor-default"
      >
        {numberBadge}
        <span className="absolute top-3 right-3 text-3xl">✅</span>
        {iconWash('opacity-70')}
        <span className="text-xl lg:text-2xl font-black text-ink-700 line-through decoration-success decoration-4">
          {game.label}
        </span>
        <span className="text-sm font-black text-success">완료!</span>
      </button>
    );
  }

  if (!game.available) {
    // 비활성 — 평면 회색 (시각 시그널 일부러 약하게 두는 게 의도)
    return (
      <button
        disabled
        className="relative rounded-3xl p-6 min-h-[156px] flex flex-col items-center justify-center gap-2 bg-slate-100 text-slate-400 cursor-not-allowed"
      >
        {numberBadge}
        <span className="text-5xl opacity-40">{game.emoji}</span>
        <span className="text-2xl font-black">{game.label}</span>
        {game.unavailableReason && (
          <span className="text-xs font-bold text-center">{game.unavailableReason}</span>
        )}
      </button>
    );
  }

  // 활성 — Duolingo 식 푸시 버튼: 하단 어두운 layer + glow. hover 시 떠오르고 누르면 가라앉음.
  return (
    <button
      onClick={onPlay}
      className="relative rounded-3xl p-5 min-h-[156px] flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-coral-400 to-coral-500 text-white shadow-[0_6px_0_#B73A1F,0_8px_20px_rgba(255,94,58,0.35)] hover:shadow-[0_9px_0_#B73A1F,0_12px_24px_rgba(255,94,58,0.45)] hover:-translate-y-0.5 active:shadow-[0_2px_0_#B73A1F,0_3px_6px_rgba(255,94,58,0.3)] active:translate-y-1 transition-all duration-100 ease-out"
    >
      {numberBadge}
      {iconWash()}
      <span
        className="text-xl lg:text-2xl font-black"
        style={{ textShadow: '0 2px 0 rgba(167, 50, 25, 0.4)' }}
      >
        {game.label}
      </span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   GameOverlay — 게임 모달 (VocabSourceProvider wrap)
   ───────────────────────────────────────────────────────────────────── */

function GameOverlay({
  unit,
  game,
  lang,
  onComplete,
  onBack,
}: {
  unit: VocabularyUnit;
  game: GameTypeId;
  lang: Lang;
  onComplete: () => void;
  onBack: () => void;
}) {
  const data = getGameData(unit, lang, game);
  // storybook source 단원이면 진짜 책 id (ConnectTheDotsPlayer 의 useStorybook lookup 등에 활용).
  // custom 단원은 게임 진입 disabled 라 도달 불가지만 안전망 placeholder.
  const effectiveStorybookId = unit.storybookId ?? `vocab-${unit.id}`;

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
          <p className="mt-3 text-lg text-ink-700 font-black font-display">다른 게임 해볼까?</p>
          <button
            onClick={onBack}
            className="mt-5 px-6 py-3 rounded-full bg-amber-500 text-white font-black shadow-pop text-lg"
          >
            ← 돌아가기
          </button>
        </div>
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
            difficulty="easy"
            onComplete={() => onComplete()}
            onBack={onBack}
            lang={game === 'korean-line-matching' ? 'ko' : 'en'}
          />
        )}
        {game === 'korean-block' && (
          <KoreanBlockPlayer
            storybookId={effectiveStorybookId}
            gameData={data}
            difficulty="easy"
            onComplete={() => onComplete()}
            onBack={onBack}
          />
        )}
        {game === 'english-block' && (
          <EnglishBlockPlayer
            storybookId={effectiveStorybookId}
            gameData={data}
            difficulty="easy"
            onComplete={() => onComplete()}
            onBack={onBack}
          />
        )}
        {game === 'connect-the-dots' && (
          <ConnectTheDotsPlayer
            storybookId={effectiveStorybookId}
            gameData={data}
            difficulty="easy"
            onComplete={() => onComplete()}
            onBack={onBack}
          />
        )}
        {(game === 'korean-word-writing' || game === 'english-word-writing') && (
          <WordWritingPlayer
            storybookId={effectiveStorybookId}
            gameData={data}
            difficulty="easy"
            onComplete={() => onComplete()}
            onBack={onBack}
          />
        )}
      </VocabSourceProvider>
    </motion.div>
  );
}
