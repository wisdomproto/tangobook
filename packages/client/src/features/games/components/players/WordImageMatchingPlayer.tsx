import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { WordImageMatchingData, WordImageMatchingGroupItem } from '@tangobook/shared';
import { useGameAudio } from '../../hooks/useGameAudio';
import { GameResultScreen } from '../GameResultScreen';
import { shuffle } from '../../utils/shuffle';
import { FeedbackOverlay } from '../FeedbackOverlay';
import { GamePlayerLayout } from '../GamePlayerLayout';

interface FlatItem extends WordImageMatchingGroupItem {
  blend: string;
  groupIdx: number;
}

export function WordImageMatchingPlayer({
  gameData,
  onComplete,
  onBack,
  systemSounds,
}: GamePlayerProps) {
  const data = gameData as WordImageMatchingData;
  const [left, right] = data.groups;

  const allItems = useMemo<FlatItem[]>(
    () => [
      ...left.items.map((it, _i) => ({ ...it, blend: left.blend, groupIdx: 0 })),
      ...right.items.map((it, _i) => ({ ...it, blend: right.blend, groupIdx: 1 })),
    ],
    [left, right]
  );

  const [shuffledWords, setShuffledWords] = useState<FlatItem[]>(() => shuffle(allItems));
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [matchedWords, setMatchedWords] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [feedbackWord, setFeedbackWord] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [lineVersion, setLineVersion] = useState(0);

  const { playAudio, playFeedbackSound, playCorrectSequence, praiseVisible } = useGameAudio();
  const containerRef = useRef<HTMLDivElement>(null);
  const wordElRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const imageElRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setLineVersion((v) => v + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const validateMatch = useCallback(
    (wordId: string, imageId: string) => {
      const isCorrect = wordId === imageId;
      setFeedback(isCorrect ? 'correct' : 'wrong');
      setFeedbackWord(wordId);

      if (isCorrect) {
        const item = allItems.find((w) => w.word === wordId);
        setScore((s) => s + 1);
        const newMatched = new Set(matchedWords);
        newMatched.add(wordId);
        setMatchedWords(newMatched);
        playCorrectSequence({
          ttsUrl: item?.ttsUrl,
          systemSounds,
          onDone: () => {
            setSelectedWord(null);
            setSelectedImage(null);
            setFeedback(null);
            setFeedbackWord(null);
            if (newMatched.size >= allItems.length) setFinished(true);
          },
        });
      } else {
        playFeedbackSound(false);
        setTimeout(() => {
          setSelectedWord(null);
          setSelectedImage(null);
          setFeedback(null);
          setFeedbackWord(null);
        }, 800);
      }
    },
    [allItems, matchedWords, playFeedbackSound, playCorrectSequence, systemSounds]
  );

  const handleWordClick = useCallback(
    (word: string) => {
      if (feedback || matchedWords.has(word)) return;
      setSelectedWord(word);
      if (selectedImage) validateMatch(word, selectedImage);
    },
    [feedback, matchedWords, selectedImage, validateMatch]
  );

  const handleImageClick = useCallback(
    (targetWord: string) => {
      if (feedback || matchedWords.has(targetWord)) return;
      setSelectedImage(targetWord);
      if (selectedWord) validateMatch(selectedWord, targetWord);
    },
    [feedback, matchedWords, selectedWord, validateMatch]
  );

  const handleRestart = useCallback(() => {
    setShuffledWords(shuffle(allItems));
    setSelectedWord(null);
    setSelectedImage(null);
    setMatchedWords(new Set());
    setFeedback(null);
    setFeedbackWord(null);
    setScore(0);
    setFinished(false);
  }, [allItems]);

  const getLinePath = useCallback(
    (word: string): string | null => {
      const container = containerRef.current;
      const wordEl = wordElRefs.current.get(word);
      const imageEl = imageElRefs.current.get(word);
      if (!container || !wordEl || !imageEl) return null;
      const cRect = container.getBoundingClientRect();
      const wRect = wordEl.getBoundingClientRect();
      const iRect = imageEl.getBoundingClientRect();
      const wCy = wRect.top + wRect.height / 2 - cRect.top;
      const iCx = iRect.left + iRect.width / 2 - cRect.left;
      const iCy = iRect.top + iRect.height / 2 - cRect.top;
      const isLeft = iCx < cRect.width / 2;
      const wX = isLeft ? wRect.left - cRect.left : wRect.right - cRect.left;
      const cpX = (wX + iCx) / 2;
      const cpY = Math.min(wCy, iCy) - 15;
      return `M ${wX} ${wCy} Q ${cpX} ${cpY} ${iCx} ${iCy}`;
    },
    [lineVersion]
  );

  useEffect(() => {
    if (finished) onComplete(score, allItems.length);
  }, [finished, score, allItems.length, onComplete]);

  if (finished) {
    return (
      <GameResultScreen
        score={score}
        total={allItems.length}
        onRestart={handleRestart}
        onBack={onBack}
      />
    );
  }

  const badges = ['①', '②', '③', '④'];

  return (
    <GamePlayerLayout maxWidth="3xl" onBack={onBack}>
      <div ref={containerRef} className="relative space-y-4 w-full">
        <FeedbackOverlay kind="correct" visible={praiseVisible} />
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-bold text-ink-900 dark:text-peach-200">
            {score} / {allItems.length}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            단어와 그림을 연결하세요
          </span>
        </div>
        <div className="flex items-start justify-center gap-2 sm:gap-6">
          {/* 왼쪽 */}
          <div className="flex flex-col items-center gap-3 w-[110px] sm:w-[140px]">
            <div className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700">
              <span className="text-sm font-black text-amber-800 dark:text-amber-300">
                {left.blend}
              </span>
            </div>
            {left.items.map((item, i) => (
              <ImageCircle
                key={item.word}
                item={item}
                badge={badges[i * 2]}
                ring="purple"
                isSelected={selectedImage === item.word}
                isMatched={matchedWords.has(item.word)}
                feedback={
                  feedbackWord === item.word ||
                  (selectedImage === item.word && feedback === 'wrong')
                    ? feedback
                    : null
                }
                onClick={() => handleImageClick(item.word)}
                refCb={(el) => {
                  if (el) imageElRefs.current.set(item.word, el);
                }}
              />
            ))}
          </div>
          {/* 가운데 */}
          <div className="flex flex-col items-center gap-3 justify-center pt-10 min-h-[280px]">
            {shuffledWords.map((item) => {
              const isSelected = selectedWord === item.word;
              const isMatched = matchedWords.has(item.word);
              const isFb = feedbackWord === item.word || (isSelected && !!feedback);
              let cls =
                'px-5 py-2.5 rounded-full text-sm font-bold border-2 transition-all select-none ';
              if (isMatched)
                cls +=
                  'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 cursor-default';
              else if (isFb && feedback === 'correct')
                cls +=
                  'bg-success/10 dark:bg-success/20 border-success text-success dark:text-success scale-105';
              else if (isFb && feedback === 'wrong')
                cls +=
                  'bg-danger/10 dark:bg-danger/20 border-danger text-danger dark:text-danger animate-shake';
              else if (isSelected)
                cls +=
                  'bg-amber-100 dark:bg-amber-900/30 border-amber-400 text-amber-900 dark:text-amber-200 scale-105';
              else
                cls +=
                  'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:border-amber-400 cursor-pointer';
              return (
                <button
                  key={item.word}
                  ref={(el) => {
                    if (el) wordElRefs.current.set(item.word, el);
                  }}
                  onClick={() => handleWordClick(item.word)}
                  disabled={isMatched}
                  className={cls}
                >
                  {item.word}
                </button>
              );
            })}
          </div>
          {/* 오른쪽 */}
          <div className="flex flex-col items-center gap-3 w-[110px] sm:w-[140px]">
            <div className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700">
              <span className="text-sm font-black text-amber-800 dark:text-amber-300">
                {right.blend}
              </span>
            </div>
            {right.items.map((item, i) => (
              <ImageCircle
                key={item.word}
                item={item}
                badge={badges[i * 2 + 1]}
                ring="blue"
                isSelected={selectedImage === item.word}
                isMatched={matchedWords.has(item.word)}
                feedback={
                  feedbackWord === item.word ||
                  (selectedImage === item.word && feedback === 'wrong')
                    ? feedback
                    : null
                }
                onClick={() => handleImageClick(item.word)}
                refCb={(el) => {
                  if (el) imageElRefs.current.set(item.word, el);
                }}
              />
            ))}
          </div>
        </div>
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
          {Array.from(matchedWords).map((word) => {
            const d = getLinePath(word);
            return d ? (
              <path
                key={word}
                d={d}
                stroke="#e53e3e"
                strokeWidth="3.5"
                fill="none"
                strokeLinecap="round"
              />
            ) : null;
          })}
        </svg>
        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          {!selectedWord && !selectedImage
            ? '단어를 선택한 다음 알맞은 그림을 눌러주세요'
            : selectedWord
              ? '알맞은 그림을 찾아 눌러주세요'
              : '알맞은 단어를 찾아 눌러주세요'}
        </p>
      </div>
    </GamePlayerLayout>
  );
}

function ImageCircle({
  item,
  badge,
  ring,
  isSelected,
  isMatched,
  feedback,
  onClick,
  refCb,
}: {
  item: { word: string; imageUrl: string };
  badge: string;
  ring: 'purple' | 'blue';
  isSelected: boolean;
  isMatched: boolean;
  feedback: 'correct' | 'wrong' | null;
  onClick: () => void;
  refCb: (el: HTMLDivElement | null) => void;
}) {
  const ringColor =
    ring === 'purple'
      ? 'ring-purple-200 dark:ring-purple-700'
      : 'ring-coral-200 dark:ring-coral-500/40';
  let extra = '';
  if (isMatched) extra = 'opacity-40 pointer-events-none';
  else if (feedback === 'correct') extra = 'ring-success dark:ring-success scale-110';
  else if (feedback === 'wrong') extra = 'ring-red-400 dark:ring-red-500 animate-shake';
  else if (isSelected) extra = 'ring-amber-400 dark:ring-amber-500 scale-105';

  return (
    <div className="relative">
      <span className="absolute -left-4 -top-1 w-6 h-6 flex items-center justify-center rounded-full bg-amber-400 text-white text-xs font-bold shadow-sm z-10">
        {badge}
      </span>
      <div
        ref={refCb}
        onClick={onClick}
        className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden ring-[6px] cursor-pointer transition-all duration-200 bg-white dark:bg-slate-800 ${isMatched ? '' : ringColor} ${extra}`}
      >
        <img src={item.imageUrl} alt={item.word} className="w-full h-full object-cover" />
      </div>
    </div>
  );
}
