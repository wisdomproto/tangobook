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
import { useGameAssetPreload } from '@/features/games/hooks/useGameAssetPreload';
import { usePhonicsMap } from '@/features/games/hooks/usePhonicsMap';
import { GameLoadingGate } from '@/features/games/components/GameLoadingGate';
import { LineMatchingPlayer } from '@/features/games/components/players/LineMatchingPlayer';
import { KoreanBlockPlayer } from '@/features/games/components/players/KoreanBlockPlayer';
import { EnglishBlockPlayer } from '@/features/games/components/players/EnglishBlockPlayer';
// paint 모드(LetterFillCanvas) 통일 플레이어 — 레거시 WordWritingPlayer(자유 획 픽셀 채점) 대체 (2026-07-02)
import { KoreanWordWritingPlayer } from '@/features/games/components/players/KoreanWordWritingPlayer';
import { EnglishWordWritingPlayer } from '@/features/games/components/players/EnglishWordWritingPlayer';
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
  const [selectedWord, setSelectedWord] = useState<VocabularyUnitWord | null>(null);
  const { refetch: refetchBalance } = useStarBalance();

  const games = getAvailableGames(unit, lang);

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
      {/* 단어 sub-section — 시안 따라 큰 헤딩 + 큰 카드. 탭하면 단어 상세 모달. */}
      <section className="mb-4">
        <div className="flex items-baseline gap-3 mb-2 px-1">
          <h2 className="text-2xl lg:text-3xl font-black font-display text-ink-900 flex items-center gap-2">
            <span>📚</span>
            <span>단어 둘러보기</span>
          </h2>
          <span className="text-sm font-bold text-ink-500">탭하면 자세히</span>
        </div>
        <WordPreviewBanner words={unit.words} lang={lang} onWordClick={setSelectedWord} />
      </section>

      {/* 게임 sub-section — 시안 따라 큰 헤딩 + 큰 카드 grid 2x2 */}
      <section>
        <div className="flex items-baseline gap-3 mb-2 px-1">
          <h2 className="text-2xl lg:text-3xl font-black font-display text-ink-900 flex items-center gap-2">
            <span>🎮</span>
            <span>게임으로 익히기</span>
          </h2>
          <span className="text-sm font-bold text-ink-500">처음이면 1번부터</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
          {games.map((g, i) => (
            <GameCard
              key={g.id}
              game={g}
              index={i}
              done={false}
              onPlay={() => g.available && setActiveGame(g.id)}
            />
          ))}
        </div>
      </section>

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
  // 시안 따라 한글+영어 양쪽 표시 — 메인 라벨은 lang 우선, sub 라벨은 반대 언어
  const items = useMemo(
    () =>
      words
        .map((w) => {
          const main = getDisplayWord(w, lang);
          // sub = 반대 언어 (있으면). lang=ko 면 영어, lang=en 면 한글
          const sub =
            lang === 'ko' ? (w.nameEn ?? (w.word !== main ? w.word : '')) : (w.korean ?? '');
          const img = w.images?.find((im) => im.isPrimary)?.imageUrl ?? w.images?.[0]?.imageUrl;
          if (!main) return null;
          return { main, sub, img, word: w };
        })
        .filter(
          (
            x
          ): x is {
            main: string;
            sub: string;
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
            aria-label={`${it.main} 자세히 보기`}
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
              {it.sub && (
                <div className="text-xs font-bold text-ink-500 truncate leading-tight">
                  {it.sub}
                </div>
              )}
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
      className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white text-coral-600 text-sm font-black flex items-center justify-center shadow-soft ring-2 ring-coral-200/50 z-10"
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

  // 우끝 → 화살표 흰 동그라미
  const arrowCircle = (
    <div className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center flex-shrink-0 shadow-soft">
      <span className="text-2xl text-coral-600 font-black">→</span>
    </div>
  );

  if (done) {
    // 완료 — success 톤 살짝 입체 + line-through 라벨
    return (
      <button
        disabled
        className="relative rounded-3xl p-5 min-h-[120px] flex items-center gap-5 bg-cream-50 border-4 border-success shadow-[0_4px_0_#3FA379,0_4px_12px_rgba(92,201,159,0.2)] cursor-default"
      >
        {numberBadge}
        <span className="absolute top-3 right-3 text-3xl">✅</span>
        {leftIllustration('opacity-70')}
        <div className="flex-1 flex flex-col items-start gap-1 pr-2">
          <span className="text-2xl lg:text-3xl font-black text-ink-700 line-through decoration-success decoration-4">
            {game.label}
          </span>
          <span className="text-base font-black text-success">완료!</span>
        </div>
      </button>
    );
  }

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

  // 활성 — Duolingo 식 푸시 버튼 (가로 layout): 좌 큰 일러스트 / 가운데 제목+부제 / 우 → 화살표.
  return (
    <button
      onClick={onPlay}
      className="relative rounded-3xl p-3 lg:p-4 min-h-[120px] flex items-center gap-3 lg:gap-4 bg-gradient-to-b from-coral-400 to-coral-500 text-white shadow-[0_6px_0_#B73A1F,0_8px_20px_rgba(255,94,58,0.35)] hover:shadow-[0_9px_0_#B73A1F,0_12px_24px_rgba(255,94,58,0.45)] hover:-translate-y-0.5 active:shadow-[0_2px_0_#B73A1F,0_3px_6px_rgba(255,94,58,0.3)] active:translate-y-1 transition-all duration-100 ease-out text-left"
    >
      {numberBadge}
      {leftIllustration()}
      <div className="flex-1 flex flex-col items-start gap-1 min-w-0">
        <span
          className="text-xl lg:text-2xl font-black font-display"
          style={{ textShadow: '0 2px 0 rgba(167, 50, 25, 0.4)' }}
        >
          {game.label}
        </span>
        {game.subtitle && (
          <span className="text-xs lg:text-sm font-bold text-white/90">{game.subtitle}</span>
        )}
      </div>
      {arrowCircle}
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
  // 🔴 getGameData 는 내부에서 shuffleInPlace 로 매 호출마다 items 순서를 바꾼다(비결정적).
  //    memo 없이 매 렌더 호출하면 프리로드 게이트의 coreKey 가 매 렌더 바뀌어 effect 가 무한 재시작
  //    (게이트가 0% 에서 안 넘어감) → unit/lang/game 별로 한 번만 생성해 안정화.
  const data = useMemo(() => getGameData(unit, lang, game), [unit, lang, game]);
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
            lang={game === 'korean-line-matching' ? 'ko' : 'en'}
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
        {game === 'connect-the-dots' && (
          <ConnectTheDotsPlayer
            storybookId={effectiveStorybookId}
            gameData={data}
            difficulty="medium"
            onComplete={() => onComplete()}
            onBack={onBack}
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
      </VocabSourceProvider>
    </motion.div>
  );
}
