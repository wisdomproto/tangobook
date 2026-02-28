import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/Button';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { VocabularyMatchingData, VocabularyMatchingItem } from '@tangobook/shared';
import { shuffle } from '../../utils/shuffle';

interface CardState {
  id: string;
  content: string;
  imageUrl?: string;
  pairId: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export function VocabularyMatchingPlayer({ gameData, onComplete, onBack }: GamePlayerProps) {
  const { items } = gameData as VocabularyMatchingData;
  const [cards, setCards] = useState<CardState[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [matches, setMatches] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  // 카드 초기화
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
          // 매칭 성공
          setTimeout(() => {
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
          }, 600);
        } else {
          // 매칭 실패
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
    [cards, selected, isChecking, matches, items.length, onComplete]
  );

  const cols = items.length <= 4 ? 4 : items.length <= 6 ? 4 : 4;

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← 돌아가기
        </Button>
        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
          <span>
            매칭: {matches}/{items.length}
          </span>
          <span>시도: {attempts}회</span>
        </div>
      </div>

      {/* 카드 그리드 */}
      <div
        className={`grid grid-cols-${cols} gap-3 flex-1`}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            disabled={card.isMatched}
            className={`relative aspect-square rounded-xl border-2 transition-all duration-300 ${
              card.isMatched
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 opacity-60'
                : card.isFlipped
                  ? 'bg-white dark:bg-slate-700 border-violet-400 dark:border-violet-500 shadow-lg'
                  : 'bg-violet-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-violet-300 hover:shadow-md cursor-pointer'
            }`}
          >
            {card.isFlipped || card.isMatched ? (
              <div className="flex flex-col items-center justify-center h-full p-2">
                {card.imageUrl ? (
                  <img
                    src={card.imageUrl}
                    alt={card.content}
                    className="w-full h-3/4 object-contain rounded-lg"
                  />
                ) : null}
                <span
                  className={`text-sm font-medium mt-1 ${card.imageUrl ? '' : 'text-lg'} text-slate-800 dark:text-slate-100`}
                >
                  {card.content}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-3xl">?</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
