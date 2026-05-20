import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/design-system';

const CANVAS_W = 400;
const CANVAS_H = 400;
const LINE_WIDTH = 10;
const GUIDE_COLOR = '#d4d4d8'; // zinc-300
const DRAW_COLOR = '#1e293b'; // slate-800
const TOLERANCE = 12;
const DEFAULT_THRESHOLD = 40;

interface LetterWritingCanvasProps {
  letter: string;
  onResult?: (passed: boolean, score: number) => void;
  correctSoundUrl?: string;
  correctSoundUrls?: string[];
  incorrectSoundUrl?: string;
  threshold?: number;
  autoCheck?: boolean;
}

export function LetterWritingCanvas({
  letter,
  onResult,
  correctSoundUrl,
  correctSoundUrls,
  incorrectSoundUrl,
  threshold = DEFAULT_THRESHOLD,
  autoCheck,
}: LetterWritingCanvasProps) {
  const [hasDrawn, setHasDrawn] = useState(false);
  const [result, setResult] = useState<{ passed: boolean; score: number } | null>(null);
  const [liveScore, setLiveScore] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const pathsRef = useRef<Array<Array<{ x: number; y: number }>>>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const calcFont = useCallback((ctx: CanvasRenderingContext2D, text: string) => {
    let size = CANVAS_H * 0.7;
    ctx.font = `bold ${size}px sans-serif`;
    while (ctx.measureText(text).width > CANVAS_W * 0.85 && size > 32) {
      size -= 4;
      ctx.font = `bold ${size}px sans-serif`;
    }
    return `bold ${size}px sans-serif`;
  }, []);

  const drawGuide = useCallback(
    (ctx: CanvasRenderingContext2D, text: string) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // 점선 가이드 라인 (중앙 가로선)
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = '#e4e4e7';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, CANVAS_H / 2);
      ctx.lineTo(CANVAS_W - 20, CANVAS_H / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = calcFont(ctx, text);
      ctx.fillStyle = GUIDE_COLOR;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, CANVAS_W / 2, CANVAS_H / 2);
    },
    [calcFont]
  );

  // 캔버스 초기화
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    pathsRef.current = [];
    lastPointRef.current = null;
    setHasDrawn(false);
    setResult(null);
    setLiveScore(null);
    drawGuide(ctx, letter);
  }, [letter, drawGuide]);

  const toCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (CANVAS_W / rect.width),
      y: (e.clientY - rect.top) * (CANVAS_H / rect.height),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (result) return;
    e.preventDefault();
    canvasRef.current!.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const pt = toCanvas(e);
    pathsRef.current.push([pt]);
    lastPointRef.current = pt;
    setHasDrawn(true);

    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, LINE_WIDTH / 2, 0, Math.PI * 2);
    ctx.fillStyle = DRAW_COLOR;
    ctx.fill();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || result) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext('2d')!;
    const pt = toCanvas(e);
    const last = lastPointRef.current!;

    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.strokeStyle = DRAW_COLOR;
    ctx.lineWidth = LINE_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    pathsRef.current[pathsRef.current.length - 1].push(pt);
    lastPointRef.current = pt;
  };

  const autoCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerUp = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
    if (hasDrawn && !result) {
      setLiveScore(calculateAccuracy());
      if (autoCheck) {
        if (autoCheckTimerRef.current) clearTimeout(autoCheckTimerRef.current);
        autoCheckTimerRef.current = setTimeout(() => handleCheck(true), 800);
      }
    }
  };

  const handleClear = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    pathsRef.current = [];
    lastPointRef.current = null;
    setHasDrawn(false);
    setResult(null);
    setLiveScore(null);
    drawGuide(ctx, letter);
  };

  const playDefaultSound = (correct: boolean) => {
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
      /* AudioContext 미지원 환경 무시 */
    }
  };

  const playSound = useCallback((url: string | undefined, correct: boolean) => {
    if (!url) {
      playDefaultSound(correct);
      return;
    }
    if (!audioRef.current) audioRef.current = new Audio(url);
    else audioRef.current.src = url;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, []);

  // Distance Transform 채점
  const computeDistanceTransform = (imageData: ImageData): Float32Array => {
    const { width, height, data } = imageData;
    const size = width * height;
    const dist = new Float32Array(size);

    for (let i = 0; i < size; i++) {
      dist[i] = data[i * 4] < 128 ? 0 : 1e6;
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (dist[idx] === 0) continue;
        if (x > 0) dist[idx] = Math.min(dist[idx], dist[idx - 1] + 1);
        if (y > 0) dist[idx] = Math.min(dist[idx], dist[(y - 1) * width + x] + 1);
        if (x > 0 && y > 0) dist[idx] = Math.min(dist[idx], dist[(y - 1) * width + x - 1] + 1.414);
        if (x < width - 1 && y > 0)
          dist[idx] = Math.min(dist[idx], dist[(y - 1) * width + x + 1] + 1.414);
      }
    }

    for (let y = height - 1; y >= 0; y--) {
      for (let x = width - 1; x >= 0; x--) {
        const idx = y * width + x;
        if (dist[idx] === 0) continue;
        if (x < width - 1) dist[idx] = Math.min(dist[idx], dist[idx + 1] + 1);
        if (y < height - 1) dist[idx] = Math.min(dist[idx], dist[(y + 1) * width + x] + 1);
        if (x < width - 1 && y < height - 1)
          dist[idx] = Math.min(dist[idx], dist[(y + 1) * width + x + 1] + 1.414);
        if (x > 0 && y < height - 1)
          dist[idx] = Math.min(dist[idx], dist[(y + 1) * width + x - 1] + 1.414);
      }
    }

    return dist;
  };

  const calculateAccuracy = useCallback((): number => {
    const guideCanvas = document.createElement('canvas');
    guideCanvas.width = CANVAS_W;
    guideCanvas.height = CANVAS_H;
    const gCtx = guideCanvas.getContext('2d')!;
    gCtx.fillStyle = '#ffffff';
    gCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    gCtx.font = calcFont(gCtx, letter);
    gCtx.fillStyle = '#000000';
    gCtx.textAlign = 'center';
    gCtx.textBaseline = 'middle';
    gCtx.fillText(letter, CANVAS_W / 2, CANVAS_H / 2);

    const userCanvas = document.createElement('canvas');
    userCanvas.width = CANVAS_W;
    userCanvas.height = CANVAS_H;
    const uCtx = userCanvas.getContext('2d')!;
    uCtx.fillStyle = '#ffffff';
    uCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    uCtx.strokeStyle = '#000000';
    uCtx.lineWidth = LINE_WIDTH;
    uCtx.lineCap = 'round';
    uCtx.lineJoin = 'round';
    for (const path of pathsRef.current) {
      if (path.length === 0) continue;
      if (path.length === 1) {
        uCtx.beginPath();
        uCtx.arc(path[0].x, path[0].y, LINE_WIDTH / 2, 0, Math.PI * 2);
        uCtx.fillStyle = '#000000';
        uCtx.fill();
        continue;
      }
      uCtx.beginPath();
      uCtx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) uCtx.lineTo(path[i].x, path[i].y);
      uCtx.stroke();
    }

    const guideImgData = gCtx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    const userImgData = uCtx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    const distMap = computeDistanceTransform(guideImgData);

    const size = CANVAS_W * CANVAS_H;
    let guidePixels = 0;
    let coveredPixels = 0;
    let userPixels = 0;
    let proximitySum = 0;

    for (let i = 0; i < size; i++) {
      const isGuide = guideImgData.data[i * 4] < 128;
      const isUser = userImgData.data[i * 4] < 128;

      if (isGuide) guidePixels++;
      if (isGuide && isUser) coveredPixels++;
      if (isUser) {
        userPixels++;
        proximitySum += Math.max(0, 1 - distMap[i] / TOLERANCE);
      }
    }

    if (guidePixels === 0 || userPixels === 0) return 0;

    const proximity = proximitySum / userPixels;
    const coverage = coveredPixels / guidePixels;
    const efficiency = Math.min(1, (guidePixels * 1.5) / userPixels);
    const rawScore = proximity * 0.6 + coverage * 0.4;
    return Math.round(rawScore * efficiency * 100);
  }, [letter, calcFont]);

  const pickCorrectSound = useCallback(() => {
    if (correctSoundUrls && correctSoundUrls.length > 0) {
      return correctSoundUrls[Math.floor(Math.random() * correctSoundUrls.length)];
    }
    return correctSoundUrl;
  }, [correctSoundUrls, correctSoundUrl]);

  const handleCheck = useCallback(
    (silent?: boolean) => {
      if (!hasDrawn) return;
      const score = calculateAccuracy();
      const passed = score >= threshold;
      // autoCheck(silent) 모드: 통과일 때만 결과 표시, 미달이면 무시
      if (silent && !passed) return;
      setResult({ passed, score });
      playSound(passed ? pickCorrectSound() : incorrectSoundUrl, passed);
      onResult?.(passed, score);
    },
    [
      hasDrawn,
      threshold,
      pickCorrectSound,
      incorrectSoundUrl,
      onResult,
      calculateAccuracy,
      playSound,
    ]
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-full max-w-sm border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full"
          style={{ touchAction: 'none', aspectRatio: '1/1' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>

      {/* 실시간 점수 표시 */}
      {liveScore !== null && !result && (
        <p
          className={`text-lg font-black ${liveScore >= threshold ? 'text-emerald-500' : 'text-slate-400'}`}
        >
          {liveScore}%
        </p>
      )}

      {result && (
        <div className="text-center relative">
          {result.passed && (
            <div className="absolute inset-0 pointer-events-none overflow-visible">
              {['⭐', '✨', '🌟', '💫', '⭐', '✨'].map((emoji, i) => (
                <span
                  key={i}
                  className="absolute text-2xl animate-[celebrate_1s_ease-out_forwards]"
                  style={{
                    left: `${50 + 40 * Math.cos((i * Math.PI * 2) / 6)}%`,
                    top: `${50 + 40 * Math.sin((i * Math.PI * 2) / 6)}%`,
                    animationDelay: `${i * 0.08}s`,
                    opacity: 0,
                  }}
                >
                  {emoji}
                </span>
              ))}
            </div>
          )}
          <div className={`text-4xl mb-1 ${result.passed ? 'animate-bounce' : ''}`}>
            {result.passed ? '🎉' : '💪'}
          </div>
          <p
            className={`text-lg font-black ${result.passed ? 'text-emerald-600' : 'text-amber-600'}`}
          >
            {result.score}% {result.passed ? '- 잘했어요!' : '- 다시 해볼까요?'}
          </p>
        </div>
      )}

      <style>{`
        @keyframes celebrate {
          0% { transform: scale(0) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.3) rotate(180deg); opacity: 1; }
          100% { transform: scale(0.8) rotate(360deg) translateY(-20px); opacity: 0; }
        }
      `}</style>

      <div className="flex gap-3">
        <Button variant="ghost" size="lg" onClick={handleClear} className="text-lg px-6">
          {result ? '다시 쓰기' : '지우기'}
        </Button>
        {!result && (
          <Button
            size="lg"
            onClick={() => handleCheck()}
            disabled={!hasDrawn}
            className="text-lg px-8"
          >
            확인
          </Button>
        )}
      </div>
    </div>
  );
}
