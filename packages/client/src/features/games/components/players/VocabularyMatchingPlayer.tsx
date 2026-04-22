import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { VocabularyMatchingData, VocabularyMatchingItem } from '@tangobook/shared';
import { shuffle } from '../../utils/shuffle';
import { useGameAudio } from '../../hooks/useGameAudio';
import { FeedbackOverlay } from '../FeedbackOverlay';
import { GamePlayerLayout } from '../GamePlayerLayout';

interface CardState {
  id: string;
  content: string;
  imageUrl?: string;
  pairId: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface FlipCardProps {
  flipped: boolean;
  matched: boolean;
  frontContent: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

function FlipCard({ flipped, matched, frontContent, onClick, disabled }: FlipCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || matched}
      className="relative w-full aspect-square"
      style={{ perspective: '1000px' }}
    >
      <motion.div
        animate={{
          rotateY: flipped || matched ? 180 : 0,
          opacity: matched ? 0 : 1,
          scale: matched ? 1.1 : 1,
        }}
        transition={{
          rotateY: { type: 'spring', stiffness: 260, damping: 20 },
          opacity: { duration: 0.6, delay: matched ? 0.6 : 0 },
          scale: { duration: 0.4 },
        }}
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* 뒷면 */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-md shadow-card bg-gradient-to-br from-coral-400 to-coral-500"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-5xl opacity-30">?</span>
        </div>
        {/* 앞면 */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-md shadow-card bg-white text-ink-900 font-black p-2"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {frontContent}
        </div>
      </motion.div>
    </button>
  );
}

export function VocabularyMatchingPlayer({
  gameData,
  onComplete,
  onBack,
  systemSounds,
}: GamePlayerProps) {
  const { items } = gameData as VocabularyMatchingData;
  const [cards, setCards] = useState<CardState[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [matches, setMatches] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const { playFeedbackSound, playCorrectSequence, praiseVisible } = useGameAudio();

  useEffect(() => {
    const wordCards: CardState[] = items.map((item: VocabularyMatchingItem, i: number) => ({
      id: `word-${i}`,
      content: item.korean,
      pairId: `pair-${i}`,
      isFlipped: false,
      isMatched: false,
    }));
    const imageCards: CardState[] = items.map((item: VocabularyMatchingItem, i: number) => ({
      id: `img-${i}`,
      content: item.word,
      imageUrl: item.imageUrl,
      pairId: `pair-${i}`,
      isFlipped: false,
      isMatched: false,
    }));
    setCards(shuffle([...wordCards, ...imageCards]));
  }, [items]);

  const handleCardClick = useCallback(
    (cardId: string) => {
      if (isChecking) return;
      const card = cards.find((c) => c.id === cardId);
      if (!card || card.isFlipped || card.isMatched) return;
      if (selected.length >= 2) return;

      setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c)));
      const newSelected = [...selected, cardId];
      setSelected(newSelected);

      if (newSelected.length === 2) {
        setIsChecking(true);
        setAttempts((a) => a + 1);
        const [first, second] = newSelected.map((id) => cards.find((c) => c.id === id)!);

        if (first.pairId === second.pairId) {
          playCorrectSequence({
            systemSounds,
            onDone: () => {
              setCards((prev) =>
                prev.map((c) =>
                  c.id === first.id || c.id === second.id ? { ...c, isMatched: true } : c
                )
              );
              const newMatches = matches + 1;
              setMatches(newMatches);
              setSelected([]);
              setIsChecking(false);

              if (newMatches === items.length) {
                setTimeout(() => onComplete(newMatches, items.length), 500);
              }
            },
          });
        } else {
          playFeedbackSound(false);
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.id === first.id || c.id === second.id ? { ...c, isFlipped: false } : c
              )
            );
            setSelected([]);
            setIsChecking(false);
          }, 1000);
        }
      }
    },
    [
      cards,
      selected,
      isChecking,
      matches,
      items.length,
      onComplete,
      playFeedbackSound,
      playCorrectSequence,
      systemSounds,
    ]
  );

  const cols = items.length <= 4 ? 4 : items.length <= 6 ? 4 : 4;

  return (
    <GamePlayerLayout maxWidth="3xl" onBack={onBack}>
      <FeedbackOverlay kind="correct" visible={praiseVisible} />
      <div className="flex flex-col gap-4 sm:gap-6 w-full">
        {/* 헤더 */}
        <div className="flex items-center justify-center gap-4 text-lg text-ink-900 dark:text-peach-200 font-bold">
          <span>
            매칭: {matches}/{items.length}
          </span>
          <span>시도: {attempts}회</span>
        </div>

        {/* 카드 그리드 */}
        <div
          className="grid gap-2 sm:gap-3"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {cards.map((card) => {
            const front = card.imageUrl ? (
              <>
                <img
                  src={card.imageUrl}
                  alt={card.content}
                  className="w-full h-3/4 object-contain rounded-md"
                />
                <span className="text-base sm:text-lg font-bold mt-1 text-ink-900 truncate max-w-full px-1">
                  {card.content}
                </span>
              </>
            ) : (
              <span className="text-xl sm:text-xl font-black text-ink-900 text-center px-1">
                {card.content}
              </span>
            );

            return (
              <FlipCard
                key={card.id}
                flipped={card.isFlipped}
                matched={card.isMatched}
                frontContent={front}
                onClick={() => handleCardClick(card.id)}
                disabled={isChecking}
              />
            );
          })}
        </div>
      </div>
    </GamePlayerLayout>
  );
}
