import { useState, useCallback, useEffect, useMemo } from 'react';
import type { GamePlayerProps } from '../../registry/game-registry';
import type {
  KoreanStoryImageData,
  EnglishStoryImageData,
  StoryImageRound,
} from '@tangobook/shared';
import { useGameAudio } from '../../hooks/useGameAudio';
import { GameResultScreen } from '../GameResultScreen';
import { GameProgressBar } from '../GameProgressBar';
import { FeedbackOverlay } from '../FeedbackOverlay';
import { GamePlayerLayout } from '../GamePlayerLayout';
import { shuffle } from '../../utils/shuffle';
import { cn } from '@/lib/cn';

interface StoryImagePlayerProps extends GamePlayerProps {
  lang: 'ko' | 'en';
}

export function StoryImagePlayer({
  gameData,
  onComplete,
  onBack,
  systemSounds,
  lang,
}: StoryImagePlayerProps) {
  const data = gameData as KoreanStoryImageData | EnglishStoryImageData;
  const rounds = data.rounds;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [finished, setFinished] = useState(false);

  const { playAudio, playFeedbackSound, playCorrectSequence, praiseVisible } = useGameAudio();

  const current = rounds[currentIdx] as StoryImageRound | undefined;

  // 각 라운드별로 옵션 셔플 (correctImageUrl + distractorImageUrls)
  const shuffledOptions = useMemo(() => {
    if (!current) return [];
    return shuffle([current.correctImageUrl, ...current.distractorImageUrls]);
  }, [current]);

  // 라운드 시작 시 TTS 자동 재생
  useEffect(() => {
    if (!current || finished) return;
    const timer = setTimeout(() => playAudio(current.ttsUrl), 400);
    return () => clearTimeout(timer);
  }, [currentIdx, current, finished, playAudio]);

  const replayAudio = useCallback(() => {
    if (current) playAudio(current.ttsUrl);
  }, [current, playAudio]);

  const handleSelect = useCallback(
    (url: string) => {
      if (feedback || !current) return;
      const isCorrect = url === current.correctImageUrl;
      setSelectedUrl(url);
      setFeedback(isCorrect ? 'correct' : 'wrong');

      if (isCorrect) {
        setScore((s) => s + 1);
        playCorrectSequence({
          systemSounds,
          language: lang,
          onDone: () => {
            if (currentIdx + 1 >= rounds.length) setFinished(true);
            else setCurrentIdx((i) => i + 1);
            setSelectedUrl(null);
            setFeedback(null);
          },
        });
      } else {
        playFeedbackSound(false);
        setTimeout(() => {
          setSelectedUrl(null);
          setFeedback(null);
        }, 800);
      }
    },
    [
      feedback,
      current,
      currentIdx,
      rounds.length,
      playFeedbackSound,
      playCorrectSequence,
      systemSounds,
      lang,
    ]
  );

  const handleRestart = useCallback(() => {
    setCurrentIdx(0);
    setScore(0);
    setSelectedUrl(null);
    setFeedback(null);
    setFinished(false);
  }, []);

  useEffect(() => {
    if (finished) onComplete(score, rounds.length);
  }, [finished, score, rounds.length, onComplete]);

  if (finished) {
    return (
      <GameResultScreen
        score={score}
        total={rounds.length}
        onRestart={handleRestart}
        onBack={onBack}
      />
    );
  }

  if (!current) return null;

  const getOptionClass = (url: string) => {
    const base =
      'relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer bg-white shadow-soft';
    const isThisCorrect =
      feedback === 'correct' && (selectedUrl === url || url === current.correctImageUrl);
    const isThisWrong = feedback === 'wrong' && selectedUrl === url;
    if (isThisCorrect)
      return cn(base, 'border-success ring-4 ring-success scale-105 animate-pulse');
    if (isThisWrong) return cn(base, 'border-danger ring-2 ring-danger animate-shake');
    return cn(base, 'border-peach-200 hover:scale-105 hover:shadow-pop hover:border-coral-300');
  };

  const cols =
    shuffledOptions.length <= 2
      ? 'grid-cols-2'
      : shuffledOptions.length === 3
        ? 'grid-cols-3'
        : 'grid-cols-2 sm:grid-cols-4';

  return (
    <GamePlayerLayout maxWidth="2xl" onBack={onBack}>
      <FeedbackOverlay kind="correct" visible={praiseVisible} />
      <div className="flex flex-col items-center gap-4 sm:gap-6 w-full">
        <GameProgressBar current={currentIdx} total={rounds.length} score={score} />

        <div className="text-center space-y-3">
          <p className="text-sm sm:text-base font-bold text-ink-700 dark:text-peach-200">
            이야기를 듣고 어울리는 그림을 골라보세요!
          </p>
          <button
            onClick={replayAudio}
            className="inline-flex items-center gap-3 px-6 py-4 sm:px-8 sm:py-5 rounded-md bg-peach-100 border-2 border-peach-300 text-ink-900 font-bold hover:bg-peach-200 transition-all hover:scale-105"
          >
            <span className="text-2xl sm:text-3xl">🔊</span>
            <span className="text-base sm:text-lg">다시 듣기</span>
          </button>
        </div>

        <div className={`grid ${cols} gap-2 sm:gap-4 w-full`}>
          {shuffledOptions.map((url) => {
            const isCorrectOpt =
              feedback === 'correct' && (selectedUrl === url || url === current.correctImageUrl);
            return (
              <button
                key={url}
                onClick={() => handleSelect(url)}
                disabled={!!feedback}
                className={getOptionClass(url)}
                aria-label="그림 선택"
              >
                <div className="aspect-square bg-cream-50">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
                {isCorrectOpt && (
                  <span className="absolute top-2 right-2 bg-success text-white rounded-full w-8 h-8 flex items-center justify-center font-black text-xl shadow-pop">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 자막 (참고용, 작게) */}
        <p className="text-xs sm:text-sm text-ink-500 dark:text-peach-200/60 italic text-center max-w-xl">
          {current.text}
        </p>
      </div>
    </GamePlayerLayout>
  );
}
