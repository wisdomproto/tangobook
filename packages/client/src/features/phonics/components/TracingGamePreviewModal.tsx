import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { TracingPoint } from '@tangobook/shared';

const HIT_RADIUS = 0.05;
const DRAW_COLOR = '#3b82f6';
const DRAW_WIDTH = 4;

// C5 메이저 스케일 주파수 (상승)
const SCALE_FREQS = [523, 587, 659, 698, 784, 880, 988, 1047];

interface TracingGamePreviewModalProps {
  imageUrl: string;
  word: string;
  tracingPoints: TracingPoint[];
  ttsUrl?: string;
  systemSounds?: { correctUrl?: string; incorrectUrl?: string };
  onClose: () => void;
}

export function TracingGamePreviewModal({
  imageUrl,
  word,
  tracingPoints,
  ttsUrl,
  systemSounds,
  onClose,
}: TracingGamePreviewModalProps) {
  const [gameState, setGameState] = useState<'playing' | 'completed'>('playing');
  const [visitedPoints, setVisitedPoints] = useState<Set<number>>(new Set());
  const [pulsingPoint, setPulsingPoint] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const allVisitedRef = useRef(false);
  const visitedRef = useRef<Set<number>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);

  // 정규화 좌표 (0~1) 반환
  const toNormalized = useCallback((e: React.PointerEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }, []);

  // 캔버스 좌표 반환
  const toCanvas = useCallback((e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const canvas = canvasRef.current!;
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  // 포인트 히트 효과음 (상승 스케일)
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

  // 완료 효과음 (3음 상승 코드)
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

  // TTS 재생
  const playTts = useCallback(() => {
    if (!ttsUrl) return;
    const audio = new Audio(ttsUrl);
    audio.play().catch(() => {});
  }, [ttsUrl]);

  // 완료 처리
  const triggerCompletion = useCallback(() => {
    setGameState('completed');
    playComplete();
    setTimeout(playTts, 600);
  }, [playComplete, playTts]);

  // 포인트 히트 감지
  const checkPointHit = useCallback(
    (nx: number, ny: number) => {
      if (gameState !== 'playing') return;

      const visited = visitedRef.current;

      for (let i = 0; i < tracingPoints.length; i++) {
        if (visited.has(i)) continue;
        const pt = tracingPoints[i];
        const dist = Math.sqrt((nx - pt.x) ** 2 + (ny - pt.y) ** 2);
        if (dist < HIT_RADIUS) {
          visited.add(i);
          visitedRef.current = new Set(visited);
          setVisitedPoints(new Set(visited));
          playDing(visited.size - 1);
          setPulsingPoint(i);
          setTimeout(() => setPulsingPoint((cur) => (cur === i ? null : cur)), 600);

          // 모든 포인트 방문 완료 체크
          if (visited.size === tracingPoints.length) {
            allVisitedRef.current = true;
          }
          break;
        }
      }

      // 모든 포인트를 방문한 후 첫 번째 점 근처로 돌아오면 완료
      if (allVisitedRef.current) {
        const first = tracingPoints[0];
        const distToFirst = Math.sqrt((nx - first.x) ** 2 + (ny - first.y) ** 2);
        if (distToFirst < HIT_RADIUS) {
          triggerCompletion();
        }
      }
    },
    [gameState, tracingPoints, playDing, triggerCompletion]
  );

  // 포인터 이벤트
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

  // 리셋
  const handleReset = useCallback(() => {
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

  // 캔버스 리사이즈
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const observer = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    });
    observer.observe(container);
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    return () => observer.disconnect();
  }, []);

  const visitedCount = visitedPoints.size;
  const totalPoints = tracingPoints.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <style>{`
        @keyframes tgp-pulse {
          0%, 100% { r: 0.018; opacity: 1; }
          50% { r: 0.028; opacity: 0.7; }
        }
        @keyframes tgp-scale-in {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes tgp-sparkle {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          100% { transform: var(--tgp-dir) scale(1); opacity: 0; }
        }
      `}</style>

      {/* 배경 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* 모달 */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{word}</h3>
            <span className="text-sm text-slate-400">
              {visitedCount} / {totalPoints}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 게임 영역 */}
        <div
          ref={containerRef}
          className="relative w-full bg-slate-50 dark:bg-slate-900/50"
          style={{ aspectRatio: '1/1' }}
        >
          {/* 이미지 */}
          <img
            src={imageUrl}
            alt={word}
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
            {/* 점선 polyline */}
            {tracingPoints.length >= 2 && (
              <polyline
                points={tracingPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#d4a853"
                strokeWidth={0.004}
                strokeDasharray="0.015 0.008"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.7}
              />
            )}

            {/* 번호 원형 마커 */}
            {tracingPoints.map((pt, i) => {
              const isVisited = visitedPoints.has(i);
              const isPulsing = pulsingPoint === i;
              return (
                <g key={i}>
                  {/* 흰 테두리 */}
                  <circle cx={pt.x} cy={pt.y} r={0.022} fill="white" opacity={0.9} />
                  {/* 색상 원 */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={0.018}
                    fill={isVisited ? '#f59e0b' : '#10b981'}
                    style={isPulsing ? { animation: 'tgp-pulse 0.6s ease-in-out' } : undefined}
                  />
                  {/* 번호 */}
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

          {/* 완료 오버레이 */}
          {gameState === 'completed' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
              <div
                className="flex flex-col items-center"
                style={{ animation: 'tgp-scale-in 0.5s ease-out forwards' }}
              >
                <span className="text-6xl mb-2">🎉</span>
                <span className="text-3xl font-black text-white drop-shadow-lg">{word}</span>
              </div>
              {/* 스파클 파티클 */}
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
                      ['--tgp-dir' as string]: `translate(${tx}px, ${ty}px)`,
                      animation: 'tgp-sparkle 0.8s ease-out forwards',
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

        {/* 푸터 */}
        <div className="flex items-center justify-center gap-3 px-5 py-3 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            다시 하기
          </button>
        </div>
      </div>
    </div>
  );
}
