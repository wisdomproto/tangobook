import { useState, useRef, useCallback } from 'react';
import type { PhonicsFlashcard } from '@tangobook/shared';

export function FlashcardPractice({ flashcards }: { flashcards: PhonicsFlashcard[] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const card = flashcards[currentIdx];

  const playAudio = useCallback((url?: string) => {
    if (!url) return;
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = url;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, []);

  const reveal = useCallback(() => {
    setRevealed(true);
    playAudio(card.ttsUrl);
  }, [card.ttsUrl, playAudio]);

  const next = useCallback(() => {
    if (currentIdx < flashcards.length - 1) {
      setCurrentIdx((i) => i + 1);
      setRevealed(false);
    }
  }, [currentIdx, flashcards.length]);

  const prev = useCallback(() => {
    if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1);
      setRevealed(false);
    }
  }, [currentIdx]);

  return (
    <div className="flex flex-col h-full">
      <div className="text-center py-2">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {currentIdx + 1} / {flashcards.length}
        </span>
      </div>
      <div
        className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm cursor-pointer select-none"
        onClick={() => !revealed && reveal()}
      >
        {card.imageUrl && (
          <div className="relative flex-1 min-h-0">
            <img src={card.imageUrl} alt="" className="w-full h-full object-contain" />
            {/* 이미지 위 좌우 네비게이션 */}
            {currentIdx > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-white/90 hover:bg-black/50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}
            {currentIdx < flashcards.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-white/90 hover:bg-black/50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="p-6 text-center flex-shrink-0">
          {revealed ? (
            <>
              <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-1">
                {card.word}
              </p>
              <p className="text-lg text-slate-500 dark:text-slate-400 mb-2">{card.localWord}</p>
              {card.phonemes.length > 0 && (
                <p className="text-sm text-violet-400 font-mono mb-3">
                  {card.phonemes.join(' · ')}
                </p>
              )}
              {card.sentence && (
                <p className="text-base text-slate-600 dark:text-slate-300 italic">
                  {card.sentence.replace(/\*\*/g, '')}
                </p>
              )}
              <div className="flex items-center justify-center gap-3 mt-5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio(card.ttsUrl);
                  }}
                  className="px-5 py-2.5 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 text-sm font-medium hover:bg-violet-100 dark:hover:bg-violet-900/50"
                >
                  ▶ 단어
                </button>
                {card.sentenceTtsUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudio(card.sentenceTtsUrl);
                    }}
                    className="px-5 py-2.5 rounded-full bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-300 text-sm font-medium hover:bg-sky-100 dark:hover:bg-sky-900/50"
                  >
                    ▶ 예문
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="py-4">
              <p className="text-5xl mb-2">?</p>
              <p className="text-lg text-slate-400 dark:text-slate-500">탭하여 단어 확인</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
