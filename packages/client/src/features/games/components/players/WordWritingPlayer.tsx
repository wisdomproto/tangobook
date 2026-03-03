import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/Button';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { WordWritingData } from '@tangobook/shared';
import { GameProgressBar } from '../GameProgressBar';
import { useGameAudio } from '../../hooks/useGameAudio';
import { PraiseOverlay } from '../PraiseOverlay';
import { GamePlayerLayout } from '../GamePlayerLayout';

const CANVAS_W = 500;
const CANVAS_H = 250;
const LINE_WIDTH = 8;
const GUIDE_COLOR = '#d4d4d8'; // zinc-300
const DRAW_COLOR = '#1e293b'; // slate-800

export function WordWritingPlayer({ gameData, onComplete, onBack, systemSounds }: GamePlayerProps) {
  const data = gameData as WordWritingData;
  const items = data.items;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [hasDrawn, setHasDrawn] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const pathsRef = useRef<Array<Array<{ x: number; y: number }>>>([]);

  const currentItem = items[currentIndex];
  const { playFeedbackSound, playCorrectSequence, praiseVisible } = useGameAudio();

  const calcFont = useCallback((ctx: CanvasRenderingContext2D, word: string) => {
    let size = CANVAS_H * 0.65;
    ctx.font = `bold ${size}px sans-serif`;
    while (ctx.measureText(word).width > CANVAS_W * 0.85 && size > 24) {
      size -= 4;
      ctx.font = `bold ${size}px sans-serif`;
    }
    return `bold ${size}px sans-serif`;
  }, []);

  const drawGuide = useCallback(
    (ctx: CanvasRenderingContext2D, word: string) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.font = calcFont(ctx, word);
      ctx.fillStyle = GUIDE_COLOR;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(word, CANVAS_W / 2, CANVAS_H / 2);
    },
    [calcFont]
  );

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    pathsRef.current = [];
    lastPointRef.current = null;
    drawGuide(ctx, currentItem.word);
  }, [currentIndex, currentItem.word, drawGuide]);

  const toCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (CANVAS_W / rect.width),
      y: (e.clientY - rect.top) * (CANVAS_H / rect.height),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (showResult) return;
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
    if (!isDrawingRef.current || showResult) return;
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

  const handlePointerUp = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const handleClear = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    pathsRef.current = [];
    lastPointRef.current = null;
    setHasDrawn(false);
    drawGuide(ctx, currentItem.word);
  };

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

  const calculateAccuracy = (): number => {
    const TOLERANCE = 10;

    const guideCanvas = document.createElement('canvas');
    guideCanvas.width = CANVAS_W;
    guideCanvas.height = CANVAS_H;
    const gCtx = guideCanvas.getContext('2d')!;
    gCtx.fillStyle = '#ffffff';
    gCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    gCtx.font = calcFont(gCtx, currentItem.word);
    gCtx.fillStyle = '#000000';
    gCtx.textAlign = 'center';
    gCtx.textBaseline = 'middle';
    gCtx.fillText(currentItem.word, CANVAS_W / 2, CANVAS_H / 2);

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
  };

  const advanceToNext = useCallback(() => {
    const newScores = [...scores, currentScore];
    setScores(newScores);
    setShowResult(false);
    setCurrentScore(0);
    setHasDrawn(false);

    if (currentIndex + 1 >= items.length) {
      const total = newScores.reduce((a, b) => a + b, 0);
      onComplete(total, items.length * 100);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  }, [scores, currentScore, currentIndex, items.length, onComplete]);

  const handleCheck = () => {
    if (!hasDrawn) return;
    const accuracy = calculateAccuracy();
    setCurrentScore(accuracy);
    setShowResult(true);

    if (accuracy >= 50) {
      playCorrectSequence({
        systemSounds,
        onDone: () => {
          const newScores = [...scores, accuracy];
          setScores(newScores);
          setShowResult(false);
          setCurrentScore(0);
          setHasDrawn(false);
          if (currentIndex + 1 >= items.length) {
            const total = newScores.reduce((a, b) => a + b, 0);
            onComplete(total, items.length * 100);
          } else {
            setCurrentIndex(currentIndex + 1);
          }
        },
      });
    } else {
      playFeedbackSound(false);
    }
  };

  return (
    <GamePlayerLayout maxWidth="lg" onBack={onBack}>
      <PraiseOverlay visible={praiseVisible} />
      <div className="flex flex-col items-center gap-3 sm:gap-4 w-full">
        {/* 진행 */}
        <GameProgressBar current={currentIndex} total={items.length} accentColor="violet" />

        {/* 단어 정보 */}
        <div className="flex items-center gap-4">
          {currentItem.imageUrl && (
            <img
              src={currentItem.imageUrl}
              alt={currentItem.word}
              className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg"
            />
          )}
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
              {currentItem.displayWord}
            </p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">따라 써보세요</p>
          </div>
        </div>

        {/* Canvas */}
        <div className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="w-full"
            style={{ touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
        </div>

        {/* 결과 */}
        {showResult && (
          <div className="text-center">
            <div className="text-3xl sm:text-4xl mb-1">
              {currentScore >= 80 ? '🎉' : currentScore >= 50 ? '👍' : '💪'}
            </div>
            <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
              정확도: {currentScore}%
            </p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {currentScore >= 80
                ? '잘했어요!'
                : currentScore >= 50
                  ? '괜찮아요!'
                  : '다시 해볼까요?'}
            </p>
          </div>
        )}

        {/* 컨트롤 */}
        <div className="flex gap-3">
          {!showResult ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleClear}>
                지우기
              </Button>
              <Button size="sm" onClick={handleCheck} disabled={!hasDrawn}>
                확인
              </Button>
            </>
          ) : currentScore < 50 ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowResult(false);
                  handleClear();
                }}
              >
                다시 쓰기
              </Button>
              <Button size="sm" onClick={advanceToNext}>
                {currentIndex + 1 >= items.length ? '결과 보기' : '다음 단어'}
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </GamePlayerLayout>
  );
}
