import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Mascot, Skeleton, Chip } from '@/design-system';
import { useStarBalance } from '@/features/rewards';
import { VocabSourceProvider } from '@/features/learning';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import type { GameTypeId, Lang, VocabularyUnit, VocabularyUnitWord } from '@tangobook/shared';
import { useVocabularyUnit } from '../hooks/useVocabularyUnits';
import { getAvailableGames, getGameData, type VocabGameOption } from '../lib/game-data-adapter';
import { LineMatchingPlayer } from '@/features/games/components/players/LineMatchingPlayer';
import { KoreanBlockPlayer } from '@/features/games/components/players/KoreanBlockPlayer';
import { EnglishBlockPlayer } from '@/features/games/components/players/EnglishBlockPlayer';
import { WordWritingPlayer } from '@/features/games/components/players/WordWritingPlayer';
import { ConnectTheDotsPlayer } from '@/features/games/components/players/ConnectTheDotsPlayer';
import { WordDetailModal } from './WordDetailModal';

const HANGUL_RE = /[가-힣]/;
const ENGLISH_RE = /^[a-zA-Z]+$/;

/** 단원 단어 목록에 lang 데이터가 충분한지 — 토글 disabled 결정용 */
function hasLangData(words: VocabularyUnitWord[], lang: Lang): boolean {
  if (lang === 'ko') {
    return words.some((w) => (w.korean && w.korean.trim()) || HANGUL_RE.test(w.word));
  }
  return words.some((w) => (w.nameEn && w.nameEn.trim()) || ENGLISH_RE.test(w.word));
}

function getDisplayWord(w: VocabularyUnitWord, lang: Lang): string | null {
  if (lang === 'ko')
    return (w.korean && w.korean.trim()) || (HANGUL_RE.test(w.word) ? w.word : null);
  return (w.nameEn && w.nameEn.trim()) || (ENGLISH_RE.test(w.word) ? w.word : null);
}

function getDisplayUnitName(unit: VocabularyUnit, lang: Lang): string {
  if (lang === 'ko') return unit.nameKo;
  return unit.nameEn ?? unit.nameKo;
}

export function VocabularyStudyPage() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const { data: unit, isLoading } = useVocabularyUnit(unitId);
  const { refetch: refetchBalance } = useStarBalance();

  const [activeGame, setActiveGame] = useState<GameTypeId | null>(null);
  const [completedGames, setCompletedGames] = useState<Set<GameTypeId>>(new Set());
  const [lang, setLang] = useState<Lang | null>(null); // null = 단원 default 따라감
  const [selectedWord, setSelectedWord] = useState<VocabularyUnitWord | null>(null);

  // 책 표지의 그림체 자동 매칭 — storybook source 단원만 fetch (custom 은 미사용)
  const { data: storybook } = useStorybook(unit?.storybookId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-100 via-yellow-50 to-cream-50">
        <Skeleton className="w-80 h-96 rounded-3xl" />
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-amber-100 via-yellow-50 to-cream-50 text-center">
        <Mascot state="thinking" size="lg" />
        <h2 className="mt-4 text-2xl font-black text-ink-900 font-display">
          단원을 찾을 수 없어요
        </h2>
        <button
          onClick={() => navigate('/vocabulary')}
          className="mt-6 px-5 py-3 rounded-full bg-amber-500 text-white font-black shadow-pop"
        >
          단원 목록으로
        </button>
      </div>
    );
  }

  const hasKo = hasLangData(unit.words, 'ko');
  const hasEn = hasLangData(unit.words, 'en');
  // effective lang = 사용자 토글 > 단원 default > ko 둘 다 있으면 ko
  const effectiveLang: Lang =
    lang ??
    (unit.language && hasLangData(unit.words, unit.language) ? unit.language : hasKo ? 'ko' : 'en');

  const games = getAvailableGames(unit, effectiveLang);
  const wordCount = unit.words.length;

  // 책 표지 — defaultStyle/artStyle 의 styleAssets[].coverImage 우선, 없으면 unit.coverImage
  const currentStyle = storybook?.defaultStyle ?? storybook?.artStyle;
  const styleCover =
    currentStyle && storybook?.styleAssets?.[currentStyle]?.coverImage
      ? storybook.styleAssets[currentStyle]!.coverImage
      : (storybook?.coverImage ?? unit.coverImage);

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
    <div className="min-h-screen bg-gradient-to-b from-amber-100 via-yellow-50 to-cream-50">
      <header className="px-6 pt-6 max-w-6xl mx-auto flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/vocabulary')}
          className="inline-flex items-center gap-2 px-5 py-3 text-lg rounded-full bg-white shadow-soft text-ink-700 font-bold hover:shadow-pop transition"
        >
          ← 단원 목록
        </button>

        {/* 언어 토글 — Library 의 필터 컨테이너와 같은 rhythm 으로 통일 (UX P2) */}
        <div className="bg-white rounded-2xl px-4 py-2 shadow-soft flex gap-2">
          <Chip
            variant="coral"
            active={effectiveLang === 'ko'}
            onClick={() => hasKo && setLang('ko')}
            disabled={!hasKo}
            aria-label="한국어"
          >
            한국어
          </Chip>
          <Chip
            variant="coral"
            active={effectiveLang === 'en'}
            onClick={() => hasEn && setLang('en')}
            disabled={!hasEn}
            aria-label="English"
          >
            English
          </Chip>
        </div>
      </header>

      <main className="px-6 pb-8 mt-4 max-w-6xl mx-auto space-y-8">
        {/* 1행 — 책 표지 hero + 호리/단원명 (수직 중앙 정렬). 표지는 컴팩트해서 게임 카드가 시선 wins (UX P1) */}
        <section className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-center">
          {styleCover ? (
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <img
                src={styleCover}
                alt={unit.nameKo}
                loading="lazy"
                className="max-h-48 lg:max-h-56 w-auto rounded-3xl shadow-pop border-4 border-white object-cover"
              />
            </div>
          ) : (
            <div className="lg:col-span-5 flex items-center justify-center text-7xl">
              {unit.emoji ?? '🌱'}
            </div>
          )}

          <div className="lg:col-span-7">
            {/* 호리 + 말풍선 */}
            <div className="flex items-end justify-center lg:justify-start gap-3 mt-4 lg:mt-0 mb-4">
              <Mascot state="reading" size="md" />
              <div className="relative bg-white rounded-2xl shadow-soft px-5 py-3">
                <p className="text-lg lg:text-xl font-black font-display text-ink-900">
                  오늘 어떤 게임 해볼까?
                </p>
                <span
                  aria-hidden
                  className="absolute left-[-10px] bottom-4 w-0 h-0 border-y-[10px] border-y-transparent border-r-[12px] border-r-white"
                />
              </div>
            </div>

            <div className="text-center lg:text-left">
              {/* 표지에 제목 박혀있으면 텍스트 제목 생략 (중복 방지). 없으면 fallback 표시. */}
              {!styleCover && (
                <h1 className="text-4xl lg:text-5xl font-black font-display text-ink-900 leading-tight mb-2">
                  {getDisplayUnitName(unit, effectiveLang)}
                </h1>
              )}
              <p className="text-lg lg:text-xl text-ink-700 font-black font-display">
                단어 {wordCount}개 · 게임 다 통과해보자!
              </p>
            </div>
          </div>
        </section>

        {/* 2행 — 풀 width 단어 미리보기 (가로 스크롤). 카드 클릭 → 단어 상세 팝업 */}
        <WordPreviewBanner words={unit.words} lang={effectiveLang} onWordClick={setSelectedWord} />

        {/* 3행 — 풀 width 게임 카드 4열 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {games.map((g) => (
            <GameCard
              key={g.id}
              game={g}
              done={completedGames.has(g.id)}
              onPlay={() => g.available && setActiveGame(g.id)}
            />
          ))}
        </div>

        {allDone && completedGames.size > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mt-6 mx-auto max-w-md bg-white rounded-3xl shadow-pop border-4 border-amber-200 p-6 text-center"
          >
            <Mascot state="celebrating" size="md" />
            <h2 className="mt-3 text-2xl font-black font-display text-ink-900">단원 완료!</h2>
            <p className="mt-1 text-sm text-ink-600 font-bold">모든 게임 통과 ✨ 잘했어!</p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={() => navigate('/vocabulary')}
                className="px-5 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white font-black shadow-pop"
              >
                다른 단원으로
              </button>
            </div>
          </motion.div>
        )}
      </main>

      {/* 게임 모달 (full screen, VocabSourceProvider 로 wrap) */}
      <AnimatePresence>
        {activeGame && (
          <GameOverlay
            key={activeGame}
            unitId={unit.id}
            game={activeGame}
            unit={unit}
            lang={effectiveLang}
            onComplete={() => handleGameComplete(activeGame)}
            onBack={handleGameBack}
          />
        )}
      </AnimatePresence>

      {/* 단어 상세 팝업 — 책 페이지 + 단어 듣기 + 예문 듣기 */}
      <AnimatePresence>
        {selectedWord && (
          <WordDetailModal
            key={selectedWord.word}
            word={selectedWord}
            storybook={storybook ?? undefined}
            currentStyle={currentStyle ?? undefined}
            lang={effectiveLang}
            onClose={() => setSelectedWord(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   단어 미리보기 배너 — 가로 스크롤 (5-8개 sneak peek)
   ───────────────────────────────────────────────────────────────────── */

interface WordPreviewBannerProps {
  words: VocabularyUnitWord[];
  lang: Lang;
  /** 카드 클릭 시 호출 — 단어 상세 팝업 트리거 */
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
      {/* 카드 탭 → 단어 상세 팝업 (책 페이지 + 듣기 + 예문) */}
      <div className="flex gap-3 pb-2 snap-x snap-mandatory">
        {items.map((it, i) => (
          <button
            key={`${it.label}-${i}`}
            onClick={() => onWordClick(it.word)}
            className="snap-start shrink-0 w-24 sm:w-28 bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-pop hover:-translate-y-0.5 active:scale-95 transition"
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
                <span className="text-3xl">📦</span>
              )}
            </div>
            <div className="p-2 text-center text-sm font-black text-ink-900 font-display truncate">
              {it.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   GameCard — 게임 1종 시작 버튼 카드
   ───────────────────────────────────────────────────────────────────── */

function GameCard({
  game,
  done,
  onPlay,
}: {
  game: VocabGameOption;
  done: boolean;
  onPlay: () => void;
}) {
  // 4 카드 통일된 톤 (coral) + state 별 강한 시각 차별화 — done/active/disabled 한눈에 구분
  if (done) {
    return (
      <button
        disabled
        className="relative rounded-3xl p-6 min-h-[180px] flex flex-col items-center justify-center gap-2 bg-cream-50 border-4 border-success shadow-soft cursor-default"
      >
        <span className="absolute top-3 right-3 text-3xl">✅</span>
        <span className="text-5xl opacity-60">{game.emoji}</span>
        <span className="text-2xl font-black text-ink-700 line-through decoration-success decoration-4">
          {game.label}
        </span>
        <span className="text-sm font-black text-success">완료!</span>
      </button>
    );
  }

  if (!game.available) {
    return (
      <button
        disabled
        className="relative rounded-3xl p-6 min-h-[180px] flex flex-col items-center justify-center gap-2 bg-slate-100 text-slate-400 cursor-not-allowed"
      >
        <span className="text-5xl opacity-40">{game.emoji}</span>
        <span className="text-2xl font-black">{game.label}</span>
        {game.unavailableReason && (
          <span className="text-xs font-bold text-center">{game.unavailableReason}</span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onPlay}
      className="relative rounded-3xl p-6 min-h-[180px] flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-coral-400 to-coral-600 text-white shadow-pop hover:brightness-110 active:scale-95 transition"
    >
      <span className="text-5xl">{game.emoji}</span>
      <span className="text-2xl font-black">{game.label}</span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   GameOverlay — 게임 모달 (VocabSourceProvider wrap)
   ───────────────────────────────────────────────────────────────────── */

function GameOverlay({
  unitId,
  game,
  unit,
  lang,
  onComplete,
  onBack,
}: {
  unitId: string;
  game: GameTypeId;
  unit: VocabularyUnit;
  lang: Lang;
  onComplete: () => void;
  onBack: () => void;
}) {
  const data = getGameData(unit, lang, game);
  // storybook source 단원이면 진짜 책 id (ConnectTheDotsPlayer 의 useStorybook lookup 등에 활용).
  // custom 단원은 landing 에서 disabled 라 도달 불가지만 안전망 placeholder.
  const effectiveStorybookId = unit.storybookId ?? `vocab-${unitId}`;

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
      <VocabSourceProvider unitId={unitId}>
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
