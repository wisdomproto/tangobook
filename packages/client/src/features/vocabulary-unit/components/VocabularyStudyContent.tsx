import { VocabularyGameMenu } from './VocabularyGameMenu';
import { LEARNING_REPORT_V2 } from '@/features/learning/config';
import { PostActivityPhonics } from '@/features/learning/components/PostActivityPhonics';
import { recommendPhonics } from '@/features/learning/lib/phonics-recommendation';
import { summarizeWords, type PhonicsTarget } from '@/features/learning/lib/word-learning';
import { readLocalReportEvents } from '@/features/learning/lib/event-outbox';
import { readGuestEvents } from '@/features/learning/lib/guest-events';
import { useLearningEvents } from '@/features/learning/hooks/useLearningEvents';
import { useAuth } from '@/features/auth/context/AuthContext';
import type { LearningEvent } from '@tangobook/shared';
import { useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Mascot } from '@/design-system';
import { useStarBalance } from '@/features/rewards';
import { VocabSourceProvider } from '@/features/learning';
import type { GameTypeId, Lang, Storybook, VocabularyUnit } from '@tangobook/shared';
import { getAvailableGames, getGameData } from '../lib/game-data-adapter';
import { useGameAssetPreload } from '@/features/games/hooks/useGameAssetPreload';
import { usePhonicsMap } from '@/features/games/hooks/usePhonicsMap';
import { GameLoadingGate } from '@/features/games/components/GameLoadingGate';
import { LineMatchingPlayer } from '@/features/games/components/players/LineMatchingPlayer';
import { KoreanBlockPlayer } from '@/features/games/components/players/KoreanBlockPlayer';
import { EnglishBlockPlayer } from '@/features/games/components/players/EnglishBlockPlayer';
import { OrderBlockPlayer } from '@/features/games/components/players/OrderBlockPlayer';
import { useGameExit } from '@/features/games/hooks/useGameExit';
import { LangWordWritingPlayer } from '@/features/games/components/players/LangWordWritingPlayer';
// paint 모드(LetterFillCanvas) 통일 플레이어 — 레거시 WordWritingPlayer(자유 획 픽셀 채점) 대체 (2026-07-02)
import { KoreanWordWritingPlayer } from '@/features/games/components/players/KoreanWordWritingPlayer';
import { EnglishWordWritingPlayer } from '@/features/games/components/players/EnglishWordWritingPlayer';
import { ConnectTheDotsPlayer } from '@/features/games/components/players/ConnectTheDotsPlayer';
import { ColoringPlayer } from '@/features/games/components/players/ColoringPlayer';
import {
  countColoringSheets,
  coloringBookId,
  useColoringBookIndex,
  useColoringItems,
} from '@/features/games/hooks/useColoringSheets';
import { HiddenObjectPlayer } from '@/features/games/components/players/HiddenObjectPlayer';
import { StoryImagePlayer } from '@/features/games/components/players/StoryImagePlayer';
import { PageOrderPlayer } from '@/features/games/components/players/PageOrderPlayer';

interface VocabularyStudyContentProps {
  unit: VocabularyUnit;
  /** storybook source 단원이면 책 데이터 — 페이지 일러스트 lookup 등에 활용 */
  storybook?: Storybook;
  /** 현재 활성 그림체 — 게임에 책의 그림체 전달 */
  currentStyle?: string;
  lang: Lang;
}

/** 책/어휘 단원의 게임 선택. 어휘 게임만 바로 제공하며 실제 플레이/학습 기록은 공유한다. */
export function VocabularyStudyContent({
  unit,
  storybook,
  currentStyle,
  lang,
}: VocabularyStudyContentProps) {
  const { t } = useTranslation('games');
  const [activeGame, setActiveGame] = useState<GameTypeId | null>(null);
  const { activeProfile } = useAuth();
  const history = useLearningEvents(activeProfile?.id, activeGame !== null);
  const activityStart = useRef<string | null>(null);
  const [phonicsSuggestion, setPhonicsSuggestion] = useState<{
    word: string;
    target: PhonicsTarget;
    reason: 'needs-review' | 'not-practiced';
  } | null>(null);
  const { refetch: refetchBalance } = useStarBalance();

  // 🔴 장수가 아니라 **이 언어로 라벨을 붙일 수 있는 도안 수** — 카드를 내 놓고 빈 화면을 열지 않게.
  const coloringIndex = useColoringBookIndex();
  const coloringCount = countColoringSheets(
    coloringIndex[storybook ? coloringBookId(storybook) : ''],
    storybook,
    lang
  );
  const games = getAvailableGames(unit, lang, t, storybook, currentStyle, coloringCount, 'word');
  // 사용자 정책 (2026-05-10): 게임은 매번 랜덤 N개 단어라 "완료" 개념 X.
  // 게임 카드 done 표시 / 단원 완료 메시지 모두 제거. 게임 결과는 GameResultScreen 에서 호리/칭찬.
  const handleGameComplete = (_gameType: GameTypeId) => {
    setActiveGame(null);
    if (
      LEARNING_REPORT_V2 &&
      storybook &&
      activityStart.current &&
      !history.isError &&
      (!activeProfile || history.isSuccess)
    ) {
      const local = activeProfile
        ? readLocalReportEvents().filter((event) => event.profile_id === activeProfile.id)
        : readGuestEvents().filter((event) => !event.profile_id);
      const records = [...(history.data ?? []), ...local] as LearningEvent[];
      const suggestion = recommendPhonics(
        summarizeWords(records, lang).filter((word) =>
          word.events.some(
            (event) =>
              event.game_type === _gameType &&
              event.storybook_id === storybook.id &&
              Date.parse(event.created_at) >= Date.parse(activityStart.current!) &&
              (event.event_type === 'word_correct' || event.event_type === 'word_wrong')
          )
        )
      );
      if (suggestion)
        setPhonicsSuggestion({
          word: suggestion.word.word,
          target: suggestion.target,
          reason: suggestion.reason,
        });
    }
    void refetchBalance();
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
  };

  const handleGameBack = () => {
    setActiveGame(null);
  };

  return (
    <>
      <VocabularyGameMenu
        games={games}
        onPlay={(game) => {
          activityStart.current = new Date().toISOString();
          setActiveGame(game);
        }}
      />

      {phonicsSuggestion && (
        <PostActivityPhonics
          word={phonicsSuggestion.word}
          target={phonicsSuggestion.target}
          reason={phonicsSuggestion.reason}
          onClose={() => setPhonicsSuggestion(null)}
        />
      )}

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
    </>
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
  onComplete: reportComplete,
  onBack: exitGame,
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
  const { onComplete, onBack } = useGameExit({
    keepsResult: [
      'korean-page-order',
      'hidden-object',
      'korean-object-scene',
      'korean-story-image',
      'english-story-image',
    ].includes(game),
    onComplete: reportComplete,
    onBack: exitGame,
  });
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
      <VocabSourceProvider unitId={unit.id} source={storybook ? 'storybook' : 'vocabulary'}>
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
        {game === 'coloring' && <ColoringGame book={storybook} lang={lang} onBack={onBack} />}
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
        {game === 'hidden-object' && (
          <HiddenObjectPlayer
            lang={lang === 'en' ? 'en' : 'ko'}
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

/**
 * 색칠 — 도안 목록은 **열 때만** 받는다(920KB manifest). 판정이 없는 활동이라 `onComplete` 이
 * 없고, 아이가 그만두면 `onBack` 으로 나간다.
 * 🔴 라벨·음원·칭찬은 **보고 있는 언어**로 붙인다 — 도안 그림은 언어와 무관하다.
 */
function ColoringGame({
  book,
  lang,
  onBack,
}: {
  book: Parameters<typeof useColoringItems>[0];
  lang: Parameters<typeof useColoringItems>[1];
  onBack: () => void;
}) {
  const { items, loading } = useColoringItems(book, lang, true);
  if (!items.length) {
    // 받는 중이면 붓만 · 받았는데 비었으면(카드 판정과 데이터가 어긋난 드문 경우) 막다른 길이 되지 않게.
    return (
      <div className="fixed inset-0 z-[70] grid place-items-center bg-cream-50">
        {loading ? (
          <p className="font-display text-lg text-ink-500">🎨</p>
        ) : (
          <button
            onClick={onBack}
            className="min-h-[44px] px-5 rounded-full bg-white shadow-soft text-ink-700 font-bold"
          >
            ←
          </button>
        )}
      </div>
    );
  }
  return <ColoringPlayer items={items} onBack={onBack} />;
}
