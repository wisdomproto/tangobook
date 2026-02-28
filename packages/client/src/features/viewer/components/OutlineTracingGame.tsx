import React, { useState, useRef, useCallback, useEffect } from 'react';
import type {
  BlendingExercise,
  WordFamily,
  PhonicsFlashcard,
  TracingPoint,
} from '@tangobook/shared';

const HIT_RADIUS = 0.05;
const DRAW_COLOR = '#3b82f6';
const DRAW_WIDTH = 4;
const SCALE_FREQS = [523, 587, 659, 698, 784, 880, 988, 1047];

interface TracingItem {
  word: string;
  imageUrl: string;
  ttsUrl?: string;
  tracingPoints: TracingPoint[];
}

interface OutlineTracingGameProps {
  letters: BlendingExercise[];
  wordFamilies: WordFamily[];
  flashcards?: PhonicsFlashcard[];
  systemSounds?: { correctUrl?: string; incorrectUrl?: string };
  onClose?: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildItems(
  letters: BlendingExercise[],
  wordFamilies: WordFamily[],
  flashcards?: PhonicsFlashcard[]
): TracingItem[] {
  const items: TracingItem[] = [];

  for (const b of letters) {
    if (
      b.exampleWordImageUrl &&
      b.exampleWordTracingPoints?.length &&
      b.exampleWordTracingPoints.length >= 2
    ) {
      items.push({
        word: b.exampleWord,
        imageUrl: b.exampleWordImageUrl,
        ttsUrl: b.exampleWordTtsUrl,
        tracingPoints: b.exampleWordTracingPoints,
      });
    }
    if (
      b.exampleWord2ImageUrl &&
      b.exampleWord2TracingPoints?.length &&
      b.exampleWord2TracingPoints.length >= 2
    ) {
      items.push({
        word: b.exampleWord2 ?? '',
        imageUrl: b.exampleWord2ImageUrl,
        ttsUrl: b.exampleWord2TtsUrl,
        tracingPoints: b.exampleWord2TracingPoints,
      });
    }
  }

  if (flashcards) {
    for (const card of flashcards) {
      if (card.imageUrl && card.tracingPoints?.length && card.tracingPoints.length >= 2) {
        items.push({
          word: card.word,
          imageUrl: card.imageUrl,
          ttsUrl: card.ttsUrl,
          tracingPoints: card.tracingPoints,
        });
      }
    }
  }

  // Level 1 fallback: wordFamilies
  if (items.length === 0) {
    for (let i = 0; i < letters.length; i++) {
      const b = letters[i];
      if (!b.exampleWordTracingPoints?.length || b.exampleWordTracingPoints.length < 2) continue;
      const wf = wordFamilies[i];
      const imgWord = wf?.words.find((w) => w.imageUrl);
      if (imgWord) {
        items.push({
          word: b.exampleWord || imgWord.word,
          imageUrl: imgWord.imageUrl!,
          ttsUrl: imgWord.ttsUrl,
          tracingPoints: b.exampleWordTracingPoints,
        });
      }
    }
  }

  return items;
}

export function OutlineTracingGame({
  letters,
  wordFamilies,
  flashcards,
  systemSounds,
  onClose,
}: OutlineTracingGameProps) {
  const allItems = buildItems(letters, wordFamilies, flashcards);
  const [items] = useState(() => shuffle(allItems));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  // 게임 상태 (per-item)
  const [gameState, setGameState] = useState<'playing' | 'completed'>('playing');
  const [visitedPoints, setVisitedPoints] = useState<Set<number>>(new Set());
  const [pulsingPoint, setPulsingPoint] = useState<number | null>(null);
  const [innerSize, setInnerSize] = useState<{ w: number; h: number } | null>(null);

  const outerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const allVisitedRef = useRef(false);
  const visitedRef = useRef<Set<number>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);

  const current = items[currentIdx] as TracingItem | undefined;

  const toNormalized = useCallback((e: React.PointerEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }, []);

  const toCanvas = useCallback((e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const canvas = canvasRef.current!;
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  const playDing = useCallback((visitedCount: number) => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const freq = SCALE_FREQS[visitedCount % SCALE_FREQS.length];
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      /* ignore */
    }
  }, []);

  const playComplete = useCallback(() => {
    if (systemSounds?.correctUrl) {
      const audio = new Audio(systemSounds.correctUrl);
      audio.play().catch(() => {});
      return;
    }
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.5);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.5);
      });
    } catch {
      /* ignore */
    }
  }, [systemSounds]);

  const playTts = useCallback((url?: string) => {
    if (!url) return;
    const audio = new Audio(url);
    audio.play().catch(() => {});
  }, []);

  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerCompletion = useCallback(() => {
    setGameState('completed');
    setScore((s) => s + 1);
    playComplete();
    if (current?.ttsUrl) setTimeout(() => playTts(current.ttsUrl), 600);
    // 2초 후 자동 다음
    autoAdvanceRef.current = setTimeout(() => {
      if (currentIdx + 1 >= items.length) {
        setFinished(true);
      } else {
        setCurrentIdx((i) => i + 1);
      }
    }, 2000);
  }, [playComplete, playTts, current, currentIdx, items.length]);

  const checkPointHit = useCallback(
    (nx: number, ny: number) => {
      if (gameState !== 'playing' || !current) return;
      const visited = visitedRef.current;
      const points = current.tracingPoints;

      for (let i = 0; i < points.length; i++) {
        if (visited.has(i)) continue;
        const pt = points[i];
        const dist = Math.sqrt((nx - pt.x) ** 2 + (ny - pt.y) ** 2);
        if (dist < HIT_RADIUS) {
          visited.add(i);
          visitedRef.current = new Set(visited);
          setVisitedPoints(new Set(visited));
          playDing(visited.size - 1);
          setPulsingPoint(i);
          setTimeout(() => setPulsingPoint((cur) => (cur === i ? null : cur)), 600);

          if (visited.size === points.length) {
            allVisitedRef.current = true;
          }
          break;
        }
      }

      if (allVisitedRef.current) {
        const first = points[0];
        const distToFirst = Math.sqrt((nx - first.x) ** 2 + (ny - first.y) ** 2);
        if (distToFirst < HIT_RADIUS) {
          triggerCompletion();
        }
      }
    },
    [gameState, current, playDing, triggerCompletion]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (gameState !== 'playing') return;
      e.preventDefault();
      canvasRef.current!.setPointerCapture(e.pointerId);
      isDrawingRef.current = true;
      const pt = toCanvas(e);
      lastPointRef.current = pt;

      const ctx = canvasRef.current!.getContext('2d')!;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, DRAW_WIDTH / 2, 0, Math.PI * 2);
      ctx.fillStyle = DRAW_COLOR;
      ctx.fill();

      const norm = toNormalized(e);
      checkPointHit(norm.x, norm.y);
    },
    [gameState, toCanvas, toNormalized, checkPointHit]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawingRef.current || gameState !== 'playing') return;
      e.preventDefault();
      const ctx = canvasRef.current!.getContext('2d')!;
      const pt = toCanvas(e);
      const last = lastPointRef.current!;

      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.strokeStyle = DRAW_COLOR;
      ctx.lineWidth = DRAW_WIDTH;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      lastPointRef.current = pt;

      const norm = toNormalized(e);
      checkPointHit(norm.x, norm.y);
    },
    [gameState, toCanvas, toNormalized, checkPointHit]
  );

  const handlePointerUp = useCallback(() => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }, []);

  // 리셋 (현재 아이템)
  const resetCurrent = useCallback(() => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setVisitedPoints(new Set());
    visitedRef.current = new Set();
    allVisitedRef.current = false;
    setGameState('playing');
    setPulsingPoint(null);
  }, []);

  const handlePrev = useCallback(() => {
    if (currentIdx > 0) setCurrentIdx((i) => i - 1);
  }, [currentIdx]);

  const handleNext = useCallback(() => {
    if (currentIdx + 1 >= items.length) {
      setFinished(true);
    } else {
      setCurrentIdx((i) => i + 1);
    }
  }, [currentIdx, items.length]);

  const computeInnerSize = useCallback(() => {
    const outer = outerRef.current;
    if (!outer) return;
    const cw = outer.clientWidth;
    const ch = outer.clientHeight;
    const size = Math.min(cw, ch);
    setInnerSize({ w: size, h: size });
  }, []);

  // 아이템 변경 시 리셋
  useEffect(() => {
    resetCurrent();
  }, [currentIdx, resetCurrent]);

  // 외부 컨테이너 리사이즈 → 내부 크기 재계산
  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
    const observer = new ResizeObserver(() => computeInnerSize());
    observer.observe(outer);
    computeInnerSize();
    return () => observer.disconnect();
  }, [currentIdx, computeInnerSize]);

  // 내부 크기 변경 → 캔버스 픽셀 리사이즈
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }, [innerSize]);

  const handleRestart = useCallback(() => {
    setCurrentIdx(0);
    setScore(0);
    setFinished(false);
  }, []);

  if (allItems.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400 dark:text-slate-500">
        <p className="text-lg mb-2">단어연습을 진행할 수 없습니다</p>
        <p className="text-sm">점선 그리기가 설정된 핵심단어가 필요합니다.</p>
      </div>
    );
  }

  if (finished) {
    const total = items.length;
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

  if (!current) return null;

  const visitedCount = visitedPoints.size;
  const totalPoints = current.tracingPoints.length;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <style>{`
        @keyframes otg-pulse {
          0%, 100% { r: 0.018; opacity: 1; }
          50% { r: 0.028; opacity: 0.7; }
        }
        @keyframes otg-scale-in {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes otg-sparkle {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          100% { transform: var(--otg-dir) scale(1); opacity: 0; }
        }
      `}</style>

      {/* 상단: 닫기 + 진행률 + 안내 */}
      <div className="flex-shrink-0 pb-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}
            <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
              {currentIdx + 1} / {items.length}
            </span>
            <span className="text-xs text-slate-400">
              ({visitedCount}/{totalPoints})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {Array.from({ length: items.length }, (_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i < currentIdx
                      ? 'bg-emerald-400'
                      : i === currentIdx
                        ? 'bg-violet-500'
                        : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={resetCurrent}
              className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              다시
            </button>
          </div>
        </div>
        <p className="text-center text-sm font-bold text-slate-700 dark:text-slate-200">
          점선을 따라 그려보세요!
        </p>
      </div>

      {/* 게임 영역 - 남은 공간 꽉 채움 */}
      <div
        ref={outerRef}
        className="flex-1 min-h-0 flex items-center justify-center rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700"
      >
        <div
          ref={containerRef}
          className="relative"
          style={
            innerSize
              ? { width: innerSize.w, height: innerSize.h }
              : { width: '100%', height: '100%' }
          }
        >
          {/* 이미지 */}
          <img
            src={current.imageUrl}
            alt={current.word}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            draggable={false}
          />

          {/* 캔버스 (드로잉 레이어) */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />

          {/* SVG 포인트 오버레이 */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 1 1"
            preserveAspectRatio="none"
          >
            {current.tracingPoints.map((pt, i) => {
              const isVisited = visitedPoints.has(i);
              const isPulsing = pulsingPoint === i;
              return (
                <g key={i}>
                  <circle cx={pt.x} cy={pt.y} r={0.022} fill="white" opacity={0.9} />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={0.018}
                    fill={isVisited ? '#f59e0b' : '#10b981'}
                    style={isPulsing ? { animation: 'otg-pulse 0.6s ease-in-out' } : undefined}
                  />
                  <text
                    x={pt.x}
                    y={pt.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="white"
                    fontSize={0.016}
                    fontWeight="bold"
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* 이전 버튼 (이미지 좌측 중앙) */}
          {currentIdx > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-white/90 hover:bg-black/50 transition-colors z-10"
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

          {/* 다음 버튼 (이미지 우측 중앙) */}
          {currentIdx < items.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-white/90 hover:bg-black/50 transition-colors z-10"
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

          {/* 완료 오버레이 */}
          {gameState === 'completed' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 pointer-events-none">
              <div
                className="flex flex-col items-center"
                style={{ animation: 'otg-scale-in 0.5s ease-out forwards' }}
              >
                <span className="text-6xl mb-2">🎉</span>
                <span className="text-3xl font-black text-white drop-shadow-lg">
                  {current.word}
                </span>
              </div>
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
                const rad = (deg * Math.PI) / 180;
                const tx = Math.cos(rad) * 80;
                const ty = Math.sin(rad) * 80;
                return (
                  <div
                    key={deg}
                    className="absolute text-2xl"
                    style={{
                      top: '50%',
                      left: '50%',
                      ['--otg-dir' as string]: `translate(${tx}px, ${ty}px)`,
                      animation: 'otg-sparkle 0.8s ease-out forwards',
                      animationDelay: `${deg * 0.02}s`,
                    }}
                  >
                    ✨
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
