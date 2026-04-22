import { useState, useEffect, useMemo, useCallback } from 'react';
import type { GamePlayerProps } from '../../registry/game-registry';
import type {
  KoreanLineMatchingData,
  EnglishLineMatchingData,
  LineMatchingItem,
} from '@tangobook/shared';
import { useGameAudio } from '../../hooks/useGameAudio';
import { GameResultScreen } from '../GameResultScreen';
import { GameProgressBar } from '../GameProgressBar';
import { FeedbackOverlay } from '../FeedbackOverlay';
import { GamePlayerLayout } from '../GamePlayerLayout';
import { phonicsApi } from '@/features/phonics/api/phonics.api';
import { shuffle } from '../../utils/shuffle';
import { cn } from '@/lib/cn';

interface LineMatchingPlayerProps extends GamePlayerProps {
  lang: 'ko' | 'en';
}

interface MatchedPair {
  itemIdx: number;
}

export function LineMatchingPlayer({
  storybookId,
  gameData,
  onComplete,
  onBack,
  systemSounds,
  lang,
}: LineMatchingPlayerProps) {
  const data = gameData as KoreanLineMatchingData | EnglishLineMatchingData;
  const items = data.items;

  // 좌(이미지)와 우(단어) 각각 독립 셔플 순서 보관
  const imageOrder = useMemo(() => shuffle(items.map((_, i) => i)), [items]);
  const wordOrder = useMemo(() => shuffle(items.map((_, i) => i)), [items]);

  const [selectedImageIdx, setSelectedImageIdx] = useState<number | null>(null);
  const [selectedWordIdx, setSelectedWordIdx] = useState<number | null>(null);
  const [matched, setMatched] = useState<MatchedPair[]>([]);
  const [wrongPair, setWrongPair] = useState<{ image: number; word: number } | null>(null);
  const [finished, setFinished] = useState(false);

  const { playAudio, playFeedbackSound, playCorrectSequence, praiseVisible } = useGameAudio();

  const isMatched = useCallback(
    (itemIdx: number) => matched.some((m) => m.itemIdx === itemIdx),
    [matched]
  );

  const playWordTts = useCallback(
    async (item: LineMatchingItem) => {
      if (item.ttsUrl) {
        playAudio(item.ttsUrl);
        return;
      }
      // phonics concat fallback — 한/영 감지해서 language 지정
      try {
        const hasHangul = /[가-힣]/.test(item.word);
        const result = await phonicsApi.concatPhonicsAudio({
          text: item.word,
          storybookId,
          identifier: `line-matching-${lang}-${item.word}`,
          language: hasHangul ? 'korean' : 'english',
        });
        playAudio(result.audioUrl);
      } catch {
        // 무시 — TTS 실패해도 게임 진행
      }
    },
    [playAudio, storybookId, lang]
  );

  // 양쪽 다 선택되면 매칭 체크
  useEffect(() => {
    if (selectedImageIdx === null || selectedWordIdx === null) return;

    const isMatch = selectedImageIdx === selectedWordIdx;
    if (isMatch) {
      const newMatched = [...matched, { itemIdx: selectedImageIdx }];
      setMatched(newMatched);
      const matchedItem = items[selectedImageIdx];
      playCorrectSequence({
        systemSounds,
        language: lang,
        onDone: () => {
          // nothing extra
        },
      });
      // 단어 읽어주기 (피드백 사운드 직후)
      setTimeout(() => {
        void playWordTts(matchedItem);
      }, 300);
      setSelectedImageIdx(null);
      setSelectedWordIdx(null);

      if (newMatched.length >= items.length) {
        setTimeout(() => setFinished(true), 1200);
      }
    } else {
      setWrongPair({ image: selectedImageIdx, word: selectedWordIdx });
      playFeedbackSound(false);
      setTimeout(() => {
        setSelectedImageIdx(null);
        setSelectedWordIdx(null);
        setWrongPair(null);
      }, 700);
    }
  }, [
    selectedImageIdx,
    selectedWordIdx,
    matched,
    items,
    playCorrectSequence,
    playFeedbackSound,
    playWordTts,
    systemSounds,
    lang,
  ]);

  useEffect(() => {
    if (finished) onComplete(items.length, items.length);
  }, [finished, items.length, onComplete]);

  const handleRestart = useCallback(() => {
    setMatched([]);
    setSelectedImageIdx(null);
    setSelectedWordIdx(null);
    setWrongPair(null);
    setFinished(false);
  }, []);

  if (finished) {
    return (
      <GameResultScreen
        score={items.length}
        total={items.length}
        onRestart={handleRestart}
        onBack={onBack}
      />
    );
  }

  const imageClass = (itemIdx: number) => {
    const base =
      'relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer bg-white shadow-soft aspect-square';
    if (isMatched(itemIdx))
      return cn(base, 'border-success ring-2 ring-success opacity-60 cursor-default');
    if (wrongPair?.image === itemIdx)
      return cn(base, 'border-danger ring-2 ring-danger animate-shake');
    if (selectedImageIdx === itemIdx)
      return cn(base, 'border-coral-500 ring-4 ring-coral-400 scale-105');
    return cn(base, 'border-peach-200 hover:scale-105 hover:border-coral-300 hover:shadow-pop');
  };

  const wordClass = (itemIdx: number) => {
    const base =
      'relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer bg-white shadow-soft flex items-center justify-center px-4 py-5 text-ink-900 font-black text-2xl sm:text-3xl';
    if (isMatched(itemIdx))
      return cn(base, 'border-success ring-2 ring-success opacity-60 cursor-default');
    if (wrongPair?.word === itemIdx)
      return cn(base, 'border-danger ring-2 ring-danger animate-shake');
    if (selectedWordIdx === itemIdx)
      return cn(base, 'border-coral-500 ring-4 ring-coral-400 scale-105');
    return cn(base, 'border-peach-200 hover:scale-105 hover:border-coral-300 hover:shadow-pop');
  };

  return (
    <GamePlayerLayout maxWidth="2xl" onBack={onBack}>
      <FeedbackOverlay kind="correct" visible={praiseVisible} />
      <div className="flex flex-col items-center gap-4 sm:gap-6 w-full">
        <GameProgressBar current={matched.length} total={items.length} score={matched.length} />

        <p className="text-sm sm:text-base font-bold text-ink-700 dark:text-peach-200 text-center">
          그림과 단어를 짝지어 보세요!
        </p>

        <div className="grid grid-cols-2 gap-3 sm:gap-6 w-full">
          {/* 좌: 이미지 스택 */}
          <div className="flex flex-col gap-3 sm:gap-4">
            {imageOrder.map((itemIdx) => {
              const item = items[itemIdx];
              return (
                <button
                  key={`img-${itemIdx}`}
                  onClick={() => !isMatched(itemIdx) && setSelectedImageIdx(itemIdx)}
                  disabled={isMatched(itemIdx)}
                  className={imageClass(itemIdx)}
                  aria-label={`그림 선택`}
                >
                  <img src={item.imageUrl} alt="" className="w-full h-full object-contain p-2" />
                  {isMatched(itemIdx) && (
                    <span className="absolute top-1 right-1 bg-success text-white rounded-full w-7 h-7 flex items-center justify-center font-black text-sm shadow-pop">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 우: 단어 스택 */}
          <div className="flex flex-col gap-3 sm:gap-4">
            {wordOrder.map((itemIdx) => {
              const item = items[itemIdx];
              return (
                <button
                  key={`word-${itemIdx}`}
                  onClick={() => !isMatched(itemIdx) && setSelectedWordIdx(itemIdx)}
                  disabled={isMatched(itemIdx)}
                  className={wordClass(itemIdx)}
                  aria-label={`단어: ${item.word}`}
                >
                  {item.word}
                  {isMatched(itemIdx) && (
                    <span className="absolute top-1 right-1 bg-success text-white rounded-full w-7 h-7 flex items-center justify-center font-black text-sm shadow-pop">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </GamePlayerLayout>
  );
}
