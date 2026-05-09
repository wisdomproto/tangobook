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
import { useGameLogger, type GameWordResult } from '@/features/learning';
import { decomposeWord } from '@tangobook/shared';
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

  const logGame = useGameLogger();
  useEffect(() => {
    if (!finished) return;
    onComplete(items.length, items.length);
    const results: GameWordResult[] = [];
    for (const it of items) {
      results.push({ word: it.word, correct: true });
      if (lang === 'ko') {
        for (const syl of decomposeWord(it.word)) {
          results.push({ correct: true, consonant: syl.cho, vowel: syl.jung });
        }
      }
    }
    logGame({
      gameType: lang === 'ko' ? 'korean-line-matching' : 'english-line-matching',
      storybookId,
      lang,
      results,
    });
  }, [finished, items, onComplete, lang, logGame, storybookId]);

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
        storybookId={storybookId}
        score={items.length}
        total={items.length}
        onRestart={handleRestart}
        onBack={onBack}
      />
    );
  }

  // 카드 = 4:3 비율, 큰 테두리. h 는 grid row 가 계산 → 화면 안에 모두 fit.
  const cellBase =
    'relative h-full aspect-[4/3] rounded-2xl overflow-hidden border-[5px] transition-all cursor-pointer bg-white shadow-soft';

  const imageClass = (itemIdx: number) => {
    if (isMatched(itemIdx)) return cn(cellBase, 'border-success opacity-60 cursor-default');
    if (wrongPair?.image === itemIdx) return cn(cellBase, 'border-danger animate-shake');
    if (selectedImageIdx === itemIdx)
      return cn(cellBase, 'border-coral-500 ring-4 ring-coral-300 scale-[1.03]');
    return cn(
      cellBase,
      'border-peach-200 hover:scale-[1.03] hover:border-coral-400 hover:shadow-pop'
    );
  };

  const wordClass = (itemIdx: number) => {
    // 단어 텍스트는 viewport 높이 기반 clamp — 카드 크기에 비례
    const extra = 'flex items-center justify-center px-4 text-ink-900 font-black';
    if (isMatched(itemIdx)) return cn(cellBase, extra, 'border-success opacity-60 cursor-default');
    if (wrongPair?.word === itemIdx) return cn(cellBase, extra, 'border-danger animate-shake');
    if (selectedWordIdx === itemIdx)
      return cn(cellBase, extra, 'border-coral-500 ring-4 ring-coral-300 scale-[1.03]');
    return cn(
      cellBase,
      extra,
      'border-peach-200 hover:scale-[1.03] hover:border-coral-400 hover:shadow-pop'
    );
  };

  return (
    <GamePlayerLayout
      maxWidth="4xl"
      onBack={onBack}
      bgImageUrl="/images/games/line-matching-bg.png"
    >
      <FeedbackOverlay kind="correct" visible={praiseVisible} />
      <div className="flex flex-col items-center gap-3 sm:gap-4 w-full h-full">
        <GameProgressBar current={matched.length} total={items.length} score={matched.length} />

        <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-ink-900 text-center shrink-0">
          그림과 단어를 짝지어 보세요!
        </p>

        {/* 카드 그리드 — 행 N 등분 (한 화면에 fit). aspect-[4/3] 카드는 mx-auto 로 가운데. */}
        <div
          className="grid grid-cols-2 gap-3 sm:gap-5 w-full flex-1 min-h-0"
          style={{ gridTemplateRows: `repeat(${items.length}, minmax(0, 1fr))` }}
        >
          {items.map((_, rowIdx) => {
            const imageItemIdx = imageOrder[rowIdx];
            const wordItemIdx = wordOrder[rowIdx];
            const imageItem = items[imageItemIdx];
            const wordItem = items[wordItemIdx];
            return (
              <div key={`row-${rowIdx}`} className="contents">
                <div className="flex items-center justify-center min-h-0">
                  <button
                    onClick={() => !isMatched(imageItemIdx) && setSelectedImageIdx(imageItemIdx)}
                    disabled={isMatched(imageItemIdx)}
                    className={imageClass(imageItemIdx)}
                    aria-label="그림 선택"
                  >
                    <img
                      src={imageItem.imageUrl}
                      alt=""
                      className="w-full h-full object-contain p-2 sm:p-3"
                    />
                    {isMatched(imageItemIdx) && (
                      <span className="absolute top-2 right-2 bg-success text-white rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center font-black text-xl sm:text-2xl shadow-pop">
                        ✓
                      </span>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center min-h-0">
                  <button
                    onClick={() => !isMatched(wordItemIdx) && setSelectedWordIdx(wordItemIdx)}
                    disabled={isMatched(wordItemIdx)}
                    className={wordClass(wordItemIdx)}
                    aria-label={`단어: ${wordItem.word}`}
                    style={{ fontSize: 'clamp(1.75rem, 6vh, 5rem)' }}
                  >
                    {wordItem.word}
                    {isMatched(wordItemIdx) && (
                      <span className="absolute top-2 right-2 bg-success text-white rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center font-black text-xl sm:text-2xl shadow-pop">
                        ✓
                      </span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GamePlayerLayout>
  );
}
