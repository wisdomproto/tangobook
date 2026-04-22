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

  // 이미지는 원래 순서 유지, 단어만 셔플
  const imageOrder = useMemo(() => items.map((_, i) => i), [items]);
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

  // 항목 수에 따라 행 높이를 유동적으로(한 화면에 전부 보이게) 조정
  // 4개 이하는 넉넉한 높이, 5개 이상은 점점 압축
  const rowHeightClass =
    items.length <= 4 ? 'h-24 sm:h-28' : items.length <= 6 ? 'h-20 sm:h-24' : 'h-16 sm:h-20';

  const cellBase =
    'relative w-full rounded-lg overflow-hidden border-2 transition-all cursor-pointer bg-white shadow-soft';

  const imageClass = (itemIdx: number) => {
    if (isMatched(itemIdx))
      return cn(
        cellBase,
        rowHeightClass,
        'border-success ring-2 ring-success opacity-60 cursor-default'
      );
    if (wrongPair?.image === itemIdx)
      return cn(cellBase, rowHeightClass, 'border-danger ring-2 ring-danger animate-shake');
    if (selectedImageIdx === itemIdx)
      return cn(cellBase, rowHeightClass, 'border-coral-500 ring-4 ring-coral-400 scale-[1.03]');
    return cn(
      cellBase,
      rowHeightClass,
      'border-peach-200 hover:scale-[1.03] hover:border-coral-300 hover:shadow-pop'
    );
  };

  const wordClass = (itemIdx: number) => {
    const extra =
      'flex items-center justify-center px-4 text-ink-900 font-black text-xl sm:text-2xl';
    if (isMatched(itemIdx))
      return cn(
        cellBase,
        rowHeightClass,
        extra,
        'border-success ring-2 ring-success opacity-60 cursor-default'
      );
    if (wrongPair?.word === itemIdx)
      return cn(cellBase, rowHeightClass, extra, 'border-danger ring-2 ring-danger animate-shake');
    if (selectedWordIdx === itemIdx)
      return cn(
        cellBase,
        rowHeightClass,
        extra,
        'border-coral-500 ring-4 ring-coral-400 scale-[1.03]'
      );
    return cn(
      cellBase,
      rowHeightClass,
      extra,
      'border-peach-200 hover:scale-[1.03] hover:border-coral-300 hover:shadow-pop'
    );
  };

  return (
    <GamePlayerLayout maxWidth="2xl" onBack={onBack}>
      <FeedbackOverlay kind="correct" visible={praiseVisible} />
      <div className="flex flex-col items-center gap-4 sm:gap-6 w-full">
        <GameProgressBar current={matched.length} total={items.length} score={matched.length} />

        <p className="text-sm sm:text-base font-bold text-ink-700 dark:text-peach-200 text-center">
          그림과 단어를 짝지어 보세요!
        </p>

        {/* 좌: 이미지(원래 순서) / 우: 단어(셔플) — 같은 grid 내에서 행마다 수평 정렬 */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 w-full max-w-3xl">
          {items.map((_, rowIdx) => {
            const imageItemIdx = imageOrder[rowIdx];
            const wordItemIdx = wordOrder[rowIdx];
            const imageItem = items[imageItemIdx];
            const wordItem = items[wordItemIdx];
            return (
              <div key={`row-${rowIdx}`} className="contents">
                <button
                  onClick={() => !isMatched(imageItemIdx) && setSelectedImageIdx(imageItemIdx)}
                  disabled={isMatched(imageItemIdx)}
                  className={imageClass(imageItemIdx)}
                  aria-label="그림 선택"
                >
                  <img
                    src={imageItem.imageUrl}
                    alt=""
                    className="w-full h-full object-contain p-1 sm:p-2"
                  />
                  {isMatched(imageItemIdx) && (
                    <span className="absolute top-1 right-1 bg-success text-white rounded-full w-7 h-7 flex items-center justify-center font-black text-sm shadow-pop">
                      ✓
                    </span>
                  )}
                </button>

                <button
                  onClick={() => !isMatched(wordItemIdx) && setSelectedWordIdx(wordItemIdx)}
                  disabled={isMatched(wordItemIdx)}
                  className={wordClass(wordItemIdx)}
                  aria-label={`단어: ${wordItem.word}`}
                >
                  {wordItem.word}
                  {isMatched(wordItemIdx) && (
                    <span className="absolute top-1 right-1 bg-success text-white rounded-full w-7 h-7 flex items-center justify-center font-black text-sm shadow-pop">
                      ✓
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </GamePlayerLayout>
  );
}
