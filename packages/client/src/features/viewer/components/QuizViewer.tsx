import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Storybook, QuizItem, GameInstance } from '@tangobook/shared';
import { GamePreviewModal } from '@/features/games/components/GamePreviewModal';
import { getGameEntry } from '@/features/games/registry';

interface QuizViewerProps {
  storybook: Storybook;
}

export function QuizViewer({ storybook }: QuizViewerProps) {
  const navigate = useNavigate();
  const quiz = storybook.educational_content?.quiz ?? [];
  const games = storybook.games ?? [];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [playingGame, setPlayingGame] = useState<GameInstance | null>(null);

  const currentQuestion: QuizItem | undefined = quiz[currentIdx];

  const handleSelect = useCallback(
    (optionIdx: number) => {
      if (selectedAnswer !== null) return;
      setSelectedAnswer(optionIdx);
      if (optionIdx === currentQuestion?.correctAnswer) {
        setScore((s) => s + 1);
      }
    },
    [selectedAnswer, currentQuestion]
  );

  const handleNext = useCallback(() => {
    if (currentIdx + 1 >= quiz.length) {
      setFinished(true);
    } else {
      setCurrentIdx((i) => i + 1);
      setSelectedAnswer(null);
    }
  }, [currentIdx, quiz.length]);

  const handleRestart = useCallback(() => {
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setScore(0);
    setFinished(false);
  }, []);

  const noContent = quiz.length === 0 && games.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-slate-900 dark:to-slate-900">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/library')}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">
            {storybook.title} — 퀴즈
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {noContent ? (
          <div className="text-center py-20 text-slate-400 dark:text-slate-500">
            퀴즈가 없습니다.
          </div>
        ) : (
          <div className="space-y-8">
            {/* 퀴즈 섹션 */}
            {quiz.length > 0 && (
              <section>
                {finished ? (
                  /* 결과 화면 */
                  <div className="flex flex-col items-center py-12">
                    <div className="text-6xl mb-4">{score === quiz.length ? '🎉' : '👏'}</div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                      {score === quiz.length ? '완벽해요!' : '잘했어요!'}
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
                      {score} / {quiz.length} 점
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleRestart}
                        className="px-6 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors"
                      >
                        다시 하기
                      </button>
                      <button
                        onClick={() => navigate('/library')}
                        className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        돌아가기
                      </button>
                    </div>
                  </div>
                ) : currentQuestion ? (
                  /* 문제 화면 */
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                        Q{currentIdx + 1}.
                      </span>
                      <span className="text-sm text-slate-400 dark:text-slate-500">
                        {currentIdx + 1} / {quiz.length}
                      </span>
                    </div>

                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">
                      {currentQuestion.question}
                    </p>

                    <div className="space-y-3">
                      {currentQuestion.options.map((option, i) => {
                        const isCorrect = i === currentQuestion.correctAnswer;
                        const isChosen = i === selectedAnswer;
                        let btnClass =
                          'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-violet-300';

                        if (selectedAnswer !== null) {
                          if (isCorrect) {
                            btnClass =
                              'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-400 text-emerald-700 dark:text-emerald-300';
                          } else if (isChosen && !isCorrect) {
                            btnClass =
                              'bg-red-50 dark:bg-red-900/30 border-red-400 text-red-700 dark:text-red-300';
                          } else {
                            btnClass =
                              'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500';
                          }
                        }

                        return (
                          <button
                            key={i}
                            onClick={() => handleSelect(i)}
                            disabled={selectedAnswer !== null}
                            className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${btnClass}`}
                          >
                            <span className="mr-2 text-slate-400">{i + 1})</span>
                            {option}
                            {selectedAnswer !== null && isCorrect && (
                              <span className="float-right">✅</span>
                            )}
                            {selectedAnswer !== null && isChosen && !isCorrect && (
                              <span className="float-right">❌</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {selectedAnswer !== null && (
                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={handleNext}
                          className="px-6 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors text-sm font-semibold"
                        >
                          {currentIdx + 1 >= quiz.length ? '결과 보기' : '다음 문제 →'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}
              </section>
            )}

            {/* 게임 섹션 */}
            {games.length > 0 && (
              <section>
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-3">
                  게임
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {games.map((game) => {
                    const entry = getGameEntry(game.gameType);
                    return (
                      <button
                        key={game.id}
                        onClick={() => setPlayingGame(game)}
                        className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 transition-colors"
                      >
                        <span className="text-2xl">{entry?.icon ?? '🎮'}</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {game.title || entry?.nameKo || game.gameType}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {playingGame && <GamePreviewModal game={playingGame} onClose={() => setPlayingGame(null)} />}
    </div>
  );
}
