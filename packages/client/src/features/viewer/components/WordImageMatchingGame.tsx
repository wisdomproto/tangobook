import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import type { BlendingExercise, WordFamily, PhonicsFlashcard } from '@tangobook/shared';

// --- 타입 ---

interface WordImageItem {
  word: string;
  imageUrl: string;
  ttsUrl?: string;
  blend: string;
  groupIdx: number; // 0 = left, 1 = right
}

interface GameGroup {
  blend: string;
  items: WordImageItem[];
}

interface WordImageMatchingGameProps {
  letters: BlendingExercise[];
  wordFamilies: WordFamily[];
  flashcards?: PhonicsFlashcard[];
  systemSounds?: { correctUrl?: string; incorrectUrl?: string };
}

// --- 유틸 ---

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildGroups(
  letters: BlendingExercise[],
  wordFamilies: WordFamily[],
  flashcards?: PhonicsFlashcard[]
): { left: GameGroup; right: GameGroup } | null {
  // 블렌딩별로 이미지 있는 단어 수집
  const groupMap = new Map<string, WordImageItem[]>();

  for (let i = 0; i < letters.length; i++) {
    const ex = letters[i];
    const blend = ex.blend;
    if (!groupMap.has(blend)) groupMap.set(blend, []);
    const arr = groupMap.get(blend)!;

    if (ex.exampleWordImageUrl) {
      arr.push({
        word: ex.exampleWord,
        imageUrl: ex.exampleWordImageUrl,
        ttsUrl: ex.exampleWordTtsUrl,
        blend,
        groupIdx: 0,
      });
    }
    if (ex.exampleWord2 && ex.exampleWord2ImageUrl) {
      arr.push({
        word: ex.exampleWord2,
        imageUrl: ex.exampleWord2ImageUrl,
        ttsUrl: ex.exampleWord2TtsUrl,
        blend,
        groupIdx: 0,
      });
    }

    // wordFamily에서 보충
    const wf = wordFamilies[i];
    if (wf) {
      for (const w of wf.words) {
        if (w.imageUrl && !arr.some((a) => a.word === w.word)) {
          arr.push({ word: w.word, imageUrl: w.imageUrl, ttsUrl: w.ttsUrl, blend, groupIdx: 0 });
        }
      }
    }
  }

  // 이미지 1개 이상인 그룹만 필터 (최대 2개씩)
  const qualifying = Array.from(groupMap.entries())
    .filter(([, items]) => items.length >= 1)
    .map(([blend, items]) => ({ blend, items: items.slice(0, 2) }));

  if (qualifying.length >= 2) {
    const total = qualifying[0].items.length + qualifying[1].items.length;
    if (total >= 2) {
      const [g1, g2] = qualifying.slice(0, 2);
      g1.items.forEach((item) => {
        item.groupIdx = 0;
      });
      g2.items.forEach((item) => {
        item.groupIdx = 1;
      });
      return { left: g1, right: g2 };
    }
  }

  // 블렌딩 데이터 부족 시 flashcards에서 보충
  const fcWithImages = (flashcards ?? []).filter((fc) => fc.imageUrl && fc.word);
  if (fcWithImages.length < 2) return null;

  const shuffled = [...fcWithImages].sort(() => Math.random() - 0.5);
  const half = Math.ceil(shuffled.length / 2);
  const leftItems = shuffled.slice(0, half);
  const rightItems = shuffled.slice(half);
  if (rightItems.length === 0) return null;

  return {
    left: {
      blend: '단어',
      items: leftItems.map((fc) => ({
        word: fc.localWord || fc.word,
        imageUrl: fc.imageUrl!,
        ttsUrl: fc.ttsUrl,
        blend: '단어',
        groupIdx: 0,
      })),
    },
    right: {
      blend: '그림',
      items: rightItems.map((fc) => ({
        word: fc.localWord || fc.word,
        imageUrl: fc.imageUrl!,
        ttsUrl: fc.ttsUrl,
        blend: '그림',
        groupIdx: 1,
      })),
    },
  };
}

// --- 컴포넌트 ---

export function WordImageMatchingGame({
  letters,
  wordFamilies,
  flashcards,
  systemSounds,
}: WordImageMatchingGameProps) {
  const groups = useMemo(
    () => buildGroups(letters, wordFamilies, flashcards),
    [letters, wordFamilies, flashcards]
  );

  const [shuffledWords, setShuffledWords] = useState<WordImageItem[]>(() => {
    if (!groups) return [];
    return shuffle([...groups.left.items, ...groups.right.items]);
  });

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [matchedWords, setMatchedWords] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [feedbackWord, setFeedbackWord] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [lineVersion, setLineVersion] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordElRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const imageElRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // 리사이즈 시 선 좌표 재계산
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setLineVersion((v) => v + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // --- 오디오 ---
  const playAudio = useCallback((url?: string) => {
    if (!url) return;
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = url;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, []);

  const playDefaultSound = useCallback((correct: boolean) => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      if (correct) {
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } else {
        osc.frequency.setValueAtTime(330, ctx.currentTime);
        osc.frequency.setValueAtTime(262, ctx.currentTime + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const playFeedback = useCallback(
    (correct: boolean) => {
      const url = correct ? systemSounds?.correctUrl : systemSounds?.incorrectUrl;
      if (url) playAudio(url);
      else playDefaultSound(correct);
    },
    [systemSounds, playAudio, playDefaultSound]
  );

  // --- 매칭 검증 ---
  const validateMatch = useCallback(
    (wordId: string, imageId: string) => {
      const isCorrect = wordId === imageId;
      setFeedback(isCorrect ? 'correct' : 'wrong');
      setFeedbackWord(wordId);
      playFeedback(isCorrect);

      if (isCorrect) {
        const item = shuffledWords.find((w) => w.word === wordId);
        if (item?.ttsUrl) setTimeout(() => playAudio(item.ttsUrl), 200);

        setScore((s) => s + 1);
        const newMatched = new Set(matchedWords);
        newMatched.add(wordId);
        setMatchedWords(newMatched);

        setTimeout(() => {
          setSelectedWord(null);
          setSelectedImage(null);
          setFeedback(null);
          setFeedbackWord(null);
          if (newMatched.size >= shuffledWords.length) {
            setFinished(true);
          }
        }, 1000);
      } else {
        setTimeout(() => {
          setSelectedWord(null);
          setSelectedImage(null);
          setFeedback(null);
          setFeedbackWord(null);
        }, 800);
      }
    },
    [shuffledWords, matchedWords, playFeedback, playAudio]
  );

  const handleWordClick = useCallback(
    (word: string) => {
      if (feedback || matchedWords.has(word)) return;
      setSelectedWord(word);
      if (selectedImage) {
        validateMatch(word, selectedImage);
      }
    },
    [feedback, matchedWords, selectedImage, validateMatch]
  );

  const handleImageClick = useCallback(
    (targetWord: string) => {
      if (feedback || matchedWords.has(targetWord)) return;
      setSelectedImage(targetWord);
      if (selectedWord) {
        validateMatch(selectedWord, targetWord);
      }
    },
    [feedback, matchedWords, selectedWord, validateMatch]
  );

  // --- 재시작 ---
  const handleRestart = useCallback(() => {
    if (!groups) return;
    setShuffledWords(shuffle([...groups.left.items, ...groups.right.items]));
    setSelectedWord(null);
    setSelectedImage(null);
    setMatchedWords(new Set());
    setFeedback(null);
    setFeedbackWord(null);
    setScore(0);
    setFinished(false);
  }, [groups]);

  // --- 선 좌표 계산 ---
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

      // quadratic bezier control point
      const cpX = (wX + iCx) / 2;
      const cpY = Math.min(wCy, iCy) - 15;

      return `M ${wX} ${wCy} Q ${cpX} ${cpY} ${iCx} ${iCy}`;
    },
    [lineVersion]
  );

  // --- 불가능 ---
  if (!groups) {
    return (
      <div className="text-center py-16 text-slate-400 dark:text-slate-500">
        <p className="text-lg mb-1">선긋기 게임을 진행할 수 없습니다</p>
        <p className="text-sm">이미지가 있는 단어가 2그룹 이상 필요합니다.</p>
      </div>
    );
  }

  // --- 결과 ---
  if (finished) {
    const total = shuffledWords.length;
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-3">{score === total ? '🎉' : '👏'}</div>
        <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">
          {score} / {total}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {score === total ? '완벽해요!' : '잘했어요!'}
        </p>
        <button
          onClick={handleRestart}
          className="px-6 py-3 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors"
        >
          다시 하기
        </button>
      </div>
    );
  }

  const { left, right } = groups;
  const allItems = [...left.items, ...right.items];
  const badges = ['①', '②', '③', '④'];

  return (
    <div ref={containerRef} className="relative space-y-4">
      {/* 점수 */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
          {score} / {allItems.length}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500">단어와 그림을 연결하세요</span>
      </div>

      {/* 3열 레이아웃 */}
      <div className="flex items-start justify-center gap-2 sm:gap-6">
        {/* 왼쪽 그룹 */}
        <div className="flex flex-col items-center gap-3 w-[130px] sm:w-[170px]">
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
                feedbackWord === item.word || (selectedImage === item.word && feedback === 'wrong')
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

        {/* 가운데: 단어 pill */}
        <div className="flex flex-col items-center gap-4 justify-center pt-10 min-h-[320px]">
          {shuffledWords.map((item) => {
            const isSelected = selectedWord === item.word;
            const isMatched = matchedWords.has(item.word);
            const isFeedback = feedbackWord === item.word || (isSelected && !!feedback);

            let cls =
              'px-6 py-3 rounded-full text-base font-bold border-2 transition-all select-none ';
            if (isMatched) {
              cls +=
                'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 cursor-default';
            } else if (isFeedback && feedback === 'correct') {
              cls +=
                'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-400 text-emerald-700 dark:text-emerald-300 scale-105';
            } else if (isFeedback && feedback === 'wrong') {
              cls +=
                'bg-red-50 dark:bg-red-900/30 border-red-400 text-red-600 dark:text-red-400 animate-shake';
            } else if (isSelected) {
              cls +=
                'bg-amber-100 dark:bg-amber-900/30 border-amber-400 text-amber-900 dark:text-amber-200 scale-105';
            } else {
              cls +=
                'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:border-amber-400 cursor-pointer';
            }

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

        {/* 오른쪽 그룹 */}
        <div className="flex flex-col items-center gap-3 w-[130px] sm:w-[170px]">
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
                feedbackWord === item.word || (selectedImage === item.word && feedback === 'wrong')
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

      {/* SVG 선 오버레이 */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
        {Array.from(matchedWords).map((word) => {
          const d = getLinePath(word);
          if (!d) return null;
          return (
            <path
              key={word}
              d={d}
              stroke="#e53e3e"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* 안내 */}
      <p className="text-center text-xs text-slate-400 dark:text-slate-500">
        {!selectedWord && !selectedImage
          ? '단어를 선택한 다음 알맞은 그림을 눌러주세요'
          : selectedWord
            ? '알맞은 그림을 찾아 눌러주세요'
            : '알맞은 단어를 찾아 눌러주세요'}
      </p>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}

// --- 이미지 원형 버튼 ---

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
  item: WordImageItem;
  badge: string;
  ring: 'purple' | 'blue';
  isSelected: boolean;
  isMatched: boolean;
  feedback: 'correct' | 'wrong' | null;
  onClick: () => void;
  refCb: (el: HTMLDivElement | null) => void;
}) {
  const ringColor =
    ring === 'purple' ? 'ring-purple-200 dark:ring-purple-700' : 'ring-sky-200 dark:ring-sky-700';

  let extra = '';
  if (isMatched) {
    extra = 'opacity-40 pointer-events-none';
  } else if (feedback === 'correct') {
    extra = 'ring-emerald-400 dark:ring-emerald-500 scale-110';
  } else if (feedback === 'wrong') {
    extra = 'ring-red-400 dark:ring-red-500 animate-shake';
  } else if (isSelected) {
    extra = 'ring-amber-400 dark:ring-amber-500 scale-105';
  }

  return (
    <div className="relative">
      <span className="absolute -left-4 -top-1 w-6 h-6 flex items-center justify-center rounded-full bg-amber-400 text-white text-xs font-bold shadow-sm z-10">
        {badge}
      </span>
      <div
        ref={refCb}
        onClick={onClick}
        className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden ring-[6px] cursor-pointer transition-all duration-200 bg-white dark:bg-slate-800
          ${isMatched ? '' : ringColor} ${extra}`}
      >
        <img src={item.imageUrl} alt={item.word} className="w-full h-full object-cover" />
      </div>
    </div>
  );
}
