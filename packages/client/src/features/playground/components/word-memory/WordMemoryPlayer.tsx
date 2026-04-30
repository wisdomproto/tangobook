import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { type Lang, type SrPoolItem } from '@tangobook/shared';
import { Mascot, Skeleton } from '@/design-system';
import { StarCounter, useStarBalance } from '@/features/rewards';
import { useLogEventsBatch } from '@/features/learning';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useSrWordPool } from '../../hooks/useSrWordPool';

type CardSide = 'word' | 'image';

interface MemoryCard {
  uid: string; // 'wordA' / 'imageA' (pair 식별용)
  pairId: string; // word
  side: CardSide;
  display: string; // 단어 텍스트 또는 이미지 URL
}

const PAIR_COUNT = 6; // 6쌍 = 12장

export function WordMemoryPlayer() {
  const navigate = useNavigate();
  const { activeProfile } = useAuth();
  const { refetch: refetchBalance } = useStarBalance();
  const logBatch = useLogEventsBatch();

  // 언어: 활성 프로필의 마지막 언어 (기본 ko)
  const [lang] = useState<Lang>('ko');
  const { data: pool, isLoading } = useSrWordPool({ language: lang, count: PAIR_COUNT * 2 });

  // 매칭 가능한 단어 (이미지 있는 것만) 필터 + PAIR_COUNT 만큼 선택
  const usablePairs = useMemo(() => {
    if (!pool) return [];
    return pool.filter((p) => !!p.imageUrl).slice(0, PAIR_COUNT);
  }, [pool]);

  // 카드 deck (12장 셔플)
  const [deck, setDeck] = useState<MemoryCard[]>([]);
  const [flipped, setFlipped] = useState<Set<string>>(new Set()); // uid set
  const [matched, setMatched] = useState<Set<string>>(new Set()); // pairId set
  const [score, setScore] = useState(0);
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(false);

  // pool 로드 후 deck 구성
  useEffect(() => {
    if (usablePairs.length < 2) return;
    const cards: MemoryCard[] = [];
    for (const p of usablePairs) {
      cards.push({
        uid: `${p.word}__word`,
        pairId: p.word,
        side: 'word',
        display: p.korean || p.word,
      });
      cards.push({ uid: `${p.word}__image`, pairId: p.word, side: 'image', display: p.imageUrl! });
    }
    cards.sort(() => Math.random() - 0.5);
    setDeck(cards);
    setFlipped(new Set());
    setMatched(new Set());
    setScore(0);
    setFinished(false);
  }, [usablePairs]);

  // 모든 매칭 끝
  useEffect(() => {
    if (deck.length > 0 && matched.size === usablePairs.length) {
      setFinished(true);
      void refetchBalance();
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
    }
  }, [matched, usablePairs.length, deck.length, refetchBalance]);

  const handleFlip = (card: MemoryCard) => {
    if (busy) return;
    if (matched.has(card.pairId)) return;
    if (flipped.has(card.uid)) return;

    const next = new Set(flipped);
    next.add(card.uid);
    setFlipped(next);

    if (next.size === 2) {
      setBusy(true);
      const [a, b] = Array.from(next).map((uid) => deck.find((c) => c.uid === uid)!);
      const isMatch = a.pairId === b.pairId && a.side !== b.side;
      const word = a.pairId;

      // 학습 이벤트 emit (correct/wrong)
      if (activeProfile?.id) {
        logBatch([
          {
            event_type: isMatch ? 'word_correct' : 'word_wrong',
            game_type: 'word-memory',
            word,
            metadata: { lang, source: 'storybook' },
          },
        ]);
      }

      setTimeout(() => {
        if (isMatch) {
          setMatched((prev) => new Set(prev).add(word));
          setScore((s) => s + 1);
        }
        setFlipped(new Set());
        setBusy(false);
      }, 800);
    }
  };

  const handleRestart = () => {
    // deck 재셔플
    const cards = deck.slice().sort(() => Math.random() - 0.5);
    setDeck(cards);
    setFlipped(new Set());
    setMatched(new Set());
    setScore(0);
    setFinished(false);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (usablePairs.length < 2) {
    return <NotEnoughWordsScreen onBack={() => navigate('/playground')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-coral-100 via-peach-100 to-cream-50">
      <header className="px-6 pt-6 max-w-5xl mx-auto flex items-center justify-between">
        <button
          onClick={() => navigate('/playground')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold hover:shadow-pop transition"
        >
          ← 놀이터
        </button>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-full bg-white shadow-soft text-coral-600 font-black">
            {matched.size} / {usablePairs.length}
          </div>
          <StarCounter />
        </div>
      </header>

      <main className="px-6 pb-12 mt-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-black font-display text-ink-900 mb-2 text-center">
          🃏 메모리 카드
        </h1>
        <p className="text-center text-ink-700 font-bold mb-6">그림과 단어를 짝 맞춰봐!</p>

        <div className="grid grid-cols-3 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
          {deck.map((card) => {
            const isFlipped = flipped.has(card.uid) || matched.has(card.pairId);
            const isMatched = matched.has(card.pairId);
            return (
              <Card
                key={card.uid}
                card={card}
                isFlipped={isFlipped}
                isMatched={isMatched}
                onClick={() => handleFlip(card)}
              />
            );
          })}
        </div>
      </main>

      <AnimatePresence>
        {finished && (
          <ResultOverlay
            score={score}
            total={usablePairs.length}
            onRestart={handleRestart}
            onBack={() => navigate('/playground')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Card({
  card,
  isFlipped,
  isMatched,
  onClick,
}: {
  card: MemoryCard;
  isFlipped: boolean;
  isMatched: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={isMatched}
      whileTap={!isFlipped ? { scale: 0.95 } : undefined}
      className={`relative aspect-[3/4] rounded-2xl overflow-hidden shadow-soft transition
        ${isMatched ? 'opacity-60 ring-2 ring-success' : 'hover:shadow-pop'}
      `}
      style={{ perspective: 800 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* back (closed) */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-coral-400 to-coral-500 text-white"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-5xl drop-shadow-md">⭐</span>
        </div>
        {/* front (open) */}
        <div
          className="absolute inset-0 bg-white flex items-center justify-center p-2"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {card.side === 'image' ? (
            <img
              src={card.display}
              alt=""
              aria-hidden
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <div className="text-2xl md:text-3xl font-black text-ink-900 font-display text-center break-words">
              {card.display}
            </div>
          )}
        </div>
      </motion.div>
    </motion.button>
  );
}

function ResultOverlay({
  score,
  total,
  onRestart,
  onBack,
}: {
  score: number;
  total: number;
  onRestart: () => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.7, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        className="bg-white rounded-3xl shadow-pop p-8 max-w-sm w-full text-center"
      >
        <Mascot state="celebrating" size="lg" />
        <h2 className="mt-4 text-3xl font-black font-display text-ink-900">완성!</h2>
        <p className="mt-2 text-lg font-bold text-ink-700">
          <span className="text-coral-500">{score}</span>
          <span> / {total} 짝</span>
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={onRestart}
            className="px-5 py-3 rounded-full bg-gradient-to-r from-coral-400 to-coral-500 text-white font-black shadow-pop"
          >
            🔄 다시
          </button>
          <button
            onClick={onBack}
            className="px-5 py-3 rounded-full bg-white border-2 border-ink-100 text-ink-700 font-black"
          >
            🏠 놀이터
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50">
      <div className="text-center">
        <Mascot state="thinking" size="lg" />
        <p className="mt-4 text-ink-700 font-bold">단어를 모으고 있어요...</p>
        <div className="mt-6 grid grid-cols-3 gap-2 max-w-xs">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

function NotEnoughWordsScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-cream-50 text-center">
      <Mascot state="thinking" size="lg" />
      <h2 className="mt-4 text-2xl font-black text-ink-900 font-display">단어가 더 필요해요!</h2>
      <p className="mt-2 text-ink-700">동화책을 좀 읽고 오면 카드가 나타나요</p>
      <button
        onClick={onBack}
        className="mt-6 px-5 py-3 rounded-full bg-coral-500 text-white font-black shadow-pop"
      >
        놀이터로
      </button>
    </div>
  );
}
