import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Mascot, Skeleton } from '@/design-system';
import { StarCounter, useStarBalance } from '@/features/rewards';
import { useLogEventsBatch } from '@/features/learning';
import { useAuth } from '@/features/auth/context/AuthContext';
import type { VocabularyUnitWord } from '@tangobook/shared';
import { useVocabularyUnit } from '../hooks/useVocabularyUnits';

/** 단원 학습 모드 — 단어 카드 carousel + TTS + 진척률 */
export function VocabularyStudyPage() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const { activeProfile } = useAuth();
  const { data: unit, isLoading } = useVocabularyUnit(unitId);
  const { refetch: refetchBalance } = useStarBalance();
  const logBatch = useLogEventsBatch();

  const [idx, setIdx] = useState(0);
  const [seenWords, setSeenWords] = useState<Set<string>>(new Set());
  const [finished, setFinished] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const words = useMemo(() => unit?.words ?? [], [unit]);
  const current: VocabularyUnitWord | undefined = words[idx];

  const playTts = (w: VocabularyUnitWord) => {
    if (w.ttsUrl) {
      try {
        if (audioRef.current) audioRef.current.pause();
        const audio = new Audio(w.ttsUrl);
        audioRef.current = audio;
        void audio.play().catch(() => {});
        return;
      } catch {
        // fallthrough
      }
    }
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(w.word);
      const lang = unit?.language === 'ko' ? 'ko-KR' : 'en-US';
      utter.lang = lang;
      utter.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    }
  };

  // 카드 진입 시 자동 TTS + word_exposed 이벤트
  useEffect(() => {
    if (!current || !unit) return;
    const t = setTimeout(() => playTts(current), 300);
    if (!seenWords.has(current.word)) {
      const next = new Set(seenWords);
      next.add(current.word);
      setSeenWords(next);
      if (activeProfile?.id) {
        logBatch([
          {
            event_type: 'word_exposed',
            word: current.word,
            metadata: {
              lang: unit.language,
              source: 'storybook', // vocabulary 단원이지만 동일 enum 재사용
            },
          },
        ]);
      }
    }
    return () => clearTimeout(t);
    // 카드 변경 시 1회
    // eslint-disable 의존 안 함
  }, [idx, current?.word, unit?.id]);

  // cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  const handleNext = () => {
    if (idx + 1 >= words.length) {
      setFinished(true);
      void refetchBalance();
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
    } else {
      setIdx(idx + 1);
    }
  };

  const handlePrev = () => {
    if (idx > 0) setIdx(idx - 1);
  };

  const handleRestart = () => {
    setIdx(0);
    setSeenWords(new Set());
    setFinished(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <Skeleton className="w-80 h-96 rounded-3xl" />
      </div>
    );
  }

  if (!unit || words.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-cream-50 text-center">
        <Mascot state="thinking" size="lg" />
        <h2 className="mt-4 text-2xl font-black text-ink-900 font-display">단원에 단어가 없어요</h2>
        <button
          onClick={() => navigate('/vocabulary')}
          className="mt-6 px-5 py-3 rounded-full bg-amber-500 text-white font-black shadow-pop"
        >
          단원 목록으로
        </button>
      </div>
    );
  }

  const progress = ((idx + 1) / words.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-100 via-yellow-50 to-cream-50">
      <header className="px-6 pt-6 max-w-5xl mx-auto flex items-center justify-between">
        <button
          onClick={() => navigate('/vocabulary')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold hover:shadow-pop transition"
        >
          ← 단원 목록
        </button>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-full bg-white shadow-soft text-amber-600 font-black">
            {idx + 1} / {words.length}
          </div>
          <StarCounter />
          <Link
            to="/library"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold hover:shadow-pop transition"
          >
            🏠 홈
          </Link>
        </div>
      </header>

      <main className="px-6 pb-12 mt-6 max-w-3xl mx-auto">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-black font-display text-ink-900">
            {unit.emoji ?? (unit.source === 'storybook' ? '📖' : '')} {unit.nameKo}
          </h1>
          {unit.source === 'storybook' && unit.storybookId && (
            <div className="mt-2 flex items-center justify-center gap-2 text-sm">
              <span className="px-2 py-0.5 rounded-full bg-coral-100 text-coral-700 font-black text-xs">
                동화 단원
              </span>
              <button
                onClick={() => navigate(`/library/${unit.storybookId}`)}
                className="text-coral-600 underline-offset-2 hover:underline font-bold"
              >
                📚 이 책 다시 보기
              </button>
            </div>
          )}
        </div>

        {/* 진행 바 */}
        <div className="h-2 bg-white rounded-full overflow-hidden mb-4 border border-amber-200">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* 단어 카드 */}
        <div className="relative aspect-[4/5] md:aspect-[5/3] max-w-xl mx-auto">
          <AnimatePresence mode="wait">
            {current && (
              <motion.div
                key={`${idx}-${current.word}`}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                className="absolute inset-0 bg-white rounded-3xl shadow-pop border-4 border-amber-200 p-6 flex flex-col items-center justify-center gap-4"
              >
                {(() => {
                  // 다중 이미지 — primary 우선, 없으면 첫 장
                  const primary = current.images?.find((im) => im.isPrimary) ?? current.images?.[0];
                  if (!primary) return null;
                  return (
                    <img
                      src={primary.imageUrl}
                      alt=""
                      aria-hidden
                      className="max-h-32 md:max-h-40 rounded-2xl object-cover"
                    />
                  );
                })()}
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-black font-display text-ink-900">
                    {current.word}
                  </div>
                  {current.korean && (
                    <div className="text-lg md:text-xl text-amber-600 font-bold mt-2">
                      {current.korean}
                    </div>
                  )}
                </div>

                {current.example && (
                  <div className="text-sm text-ink-700 italic max-w-md text-center">
                    "{current.example}"
                  </div>
                )}
                {current.definition && (
                  <div className="text-xs text-ink-500 max-w-md text-center">
                    {current.definition}
                  </div>
                )}

                <button
                  onClick={() => playTts(current)}
                  className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 text-white font-black shadow-pop hover:brightness-110 active:scale-95 transition"
                >
                  <span className="text-xl">🔊</span>
                  <span>듣기</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* prev/next */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={handlePrev}
            disabled={idx === 0}
            className={`px-5 py-3 rounded-full font-black ${
              idx === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-white text-ink-700 shadow-soft hover:shadow-pop'
            }`}
          >
            ← 이전
          </button>
          <button
            onClick={handleNext}
            className="px-7 py-3 rounded-full font-black bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-pop hover:brightness-110"
          >
            {idx + 1 >= words.length ? '🎉 끝!' : '다음 →'}
          </button>
        </div>
      </main>

      <AnimatePresence>
        {finished && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.7, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              className="bg-white rounded-3xl shadow-pop p-8 max-w-sm w-full text-center"
            >
              <Mascot state="celebrating" size="lg" />
              <h2 className="mt-4 text-3xl font-black font-display text-ink-900">
                {unit.nameKo} 완료!
              </h2>
              <p className="mt-2 text-lg font-bold text-ink-700">{words.length}단어 학습</p>
              <div className="mt-6 flex gap-3 justify-center">
                <button
                  onClick={handleRestart}
                  className="px-5 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white font-black shadow-pop"
                >
                  🔄 다시
                </button>
                <button
                  onClick={() => navigate('/vocabulary')}
                  className="px-5 py-3 rounded-full bg-white border-2 border-ink-100 text-ink-700 font-black"
                >
                  📚 단원 목록
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
