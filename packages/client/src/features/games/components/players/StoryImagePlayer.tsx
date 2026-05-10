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
import { GamePlayerLayout } from '../GamePlayerLayout';
import { shuffle } from '../../utils/shuffle';
import { cn } from '@/lib/cn';

interface StoryImagePlayerProps extends GamePlayerProps {
  lang: 'ko' | 'en';
}

export function StoryImagePlayer({
  storybookId,
  gameData,
  onComplete,
  onBack,
}: StoryImagePlayerProps) {
  const data = gameData as KoreanStoryImageData | EnglishStoryImageData;
  const rounds = data.rounds;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [finished, setFinished] = useState(false);

  const { playAudio, playFeedbackSound, playWordCorrect } = useGameAudio();

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
        playWordCorrect({
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
    [feedback, current, currentIdx, rounds.length, playFeedbackSound, playWordCorrect]
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
        storybookId={storybookId}
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
      'relative w-full aspect-video rounded-2xl overflow-hidden border-4 transition-all cursor-pointer bg-white shadow-card';
    const isThisCorrect =
      feedback === 'correct' && (selectedUrl === url || url === current.correctImageUrl);
    const isThisWrong = feedback === 'wrong' && selectedUrl === url;
    if (isThisCorrect)
      return cn(base, 'border-success ring-4 ring-success scale-[1.02] animate-pulse');
    if (isThisWrong) return cn(base, 'border-danger ring-4 ring-danger animate-shake');
    return cn(base, 'border-peach-200 hover:scale-[1.02] hover:shadow-pop hover:border-coral-300');
  };

  return (
    <GamePlayerLayout maxWidth="2xl" onBack={onBack}>
      <div className="flex flex-col items-center gap-4 sm:gap-6 w-full">
        <GameProgressBar current={currentIdx} total={rounds.length} score={score} />

        <div className="text-center space-y-3">
          <p className="text-lg sm:text-xl font-bold text-ink-900 dark:text-peach-200">
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

        {/* 세로 스택: 한 줄에 이미지 한 개씩, 16:9 비율 */}
        <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto">
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
                <img src={url} alt="" className="w-full h-full object-cover" />
                {isCorrectOpt && (
                  <span className="absolute top-3 right-3 bg-success text-white rounded-full w-10 h-10 flex items-center justify-center font-black text-xl shadow-pop">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 자막 (참고용, 작게) */}
        <p className="text-base sm:text-lg text-ink-900 dark:text-peach-200/60 italic text-center max-w-xl">
          {current.text}
        </p>
      </div>
    </GamePlayerLayout>
  );
}
