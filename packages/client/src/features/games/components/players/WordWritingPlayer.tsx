import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/design-system';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { WordWritingData, GameTypeId, Lang } from '@tangobook/shared';
import { decomposeWord } from '@tangobook/shared';
import { GameHeader } from '../GameHeader';
import { useGameAudio } from '../../hooks/useGameAudio';
import { GamePlayerLayout } from '../GamePlayerLayout';
import {
  TutorialProvider,
  useTutorialPulse,
  useTutorialIsPlaying,
  useTutorialNotify,
} from './WordWritingTutorial/WordWritingTutorial.context';
import { WordWritingTutorial } from './WordWritingTutorial/WordWritingTutorial';
import { resolveTtsUrl } from '@/features/tts';
import { useGameLogger, type GameWordResult } from '@/features/learning';

const CANVAS_W = 500;
const CANVAS_H = 250;
const LINE_WIDTH = 8;
const GUIDE_COLOR = '#d4d4d8'; // zinc-300 — 따라쓰기 대상 글자 (회색 윤곽)
const SHOW_COLOR = '#FF8E72'; // coral — 따라쓰지 않고 보여주기만 하는 나머지 글자
const DRAW_COLOR = '#1e293b'; // slate-800 — 사용자 stroke

/**
 * 따라쓰기 대상은 단어 전체가 아니라 **첫 음절** 만. (사용자 정책 2026-05-18: 모든 음절은 가혹)
 *  - 한글: 첫 한글 음절 1자 (예: "꽃밭" → "꽃")
 *  - 영어: 첫 글자 1자 (예: "milk" → "m"). 짧은 단어(≤2자)는 그대로.
 *  - 발음 (TTS) 은 전체 단어 그대로 — 학습적으로 자연 (첫 글자 쓰고 단어 듣기).
 */
function firstWritingChar(word: string): string {
  if (!word) return word;
  const hangul = word.match(/[가-힣]/);
  if (hangul) return hangul[0];
  if (word.length <= 2) return word;
  return word[0];
}

function WordWritingPlayerInner({ storybookId, gameData, onComplete, onBack }: GamePlayerProps) {
  const data = gameData as WordWritingData;
  const items = data.items;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [hintActive, setHintActive] = useState(false);
  const logGame = useGameLogger();
  const tutorialPulse = useTutorialPulse();
  const isTutorialPlaying = useTutorialIsPlaying();
  const notifyDraw = useTutorialNotify();
  const handleHintStart = useCallback(() => {
    if (hintActive || isTutorialPlaying) return;
    setHintActive(true);
  }, [hintActive, isTutorialPlaying]);
  const handleHintEnd = useCallback(() => {
    setHintActive(false);
  }, []);

  const emitFinalResults = useCallback(
    (finalScores: number[]) => {
      const isKorean = data.type === 'korean-word-writing';
      const gameType: GameTypeId =
        data.type === 'korean-word-writing' ? 'korean-word-writing' : 'english-word-writing';
      const lang: Lang = isKorean ? 'ko' : 'en';
      const results: GameWordResult[] = [];
      for (let i = 0; i < items.length; i++) {
        const correct = (finalScores[i] ?? 0) >= 50;
        results.push({ word: items[i].word, correct });
        if (isKorean) {
          for (const syl of decomposeWord(items[i].word)) {
            results.push({ correct, consonant: syl.cho, vowel: syl.jung });
          }
        }
      }
      logGame({ gameType, storybookId, lang, results });
    },
    [data.type, items, logGame, storybookId]
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const pathsRef = useRef<Array<Array<{ x: number; y: number }>>>([]);

  const currentItem = items[currentIndex];
  const writingChar = firstWritingChar(currentItem.word);
  const { playFeedbackSound, playWordCorrect } = useGameAudio();

  const calcFont = useCallback((ctx: CanvasRenderingContext2D, word: string) => {
    let size = CANVAS_H * 0.65;
    ctx.font = `bold ${size}px sans-serif`;
    while (ctx.measureText(word).width > CANVAS_W * 0.85 && size > 24) {
      size -= 4;
      ctx.font = `bold ${size}px sans-serif`;
    }
    return `bold ${size}px sans-serif`;
  }, []);

  /**
   * 단어 전체를 한 줄로 그리되 첫 음절(writingChar) 만 회색 가이드, 나머지는 coral 컬러.
   * - 따라쓰기 대상이 어디서 시작/끝나는지 시각적으로 명확
   * - 컨텍스트 (전체 단어 모양) 도 같이 학습
   */
  const drawGuide = useCallback(
    (ctx: CanvasRenderingContext2D, word: string, writingTarget: string) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.font = calcFont(ctx, word);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      const totalWidth = ctx.measureText(word).width;
      const startX = (CANVAS_W - totalWidth) / 2;
      const y = CANVAS_H / 2;

      const wcStart = writingTarget ? word.indexOf(writingTarget) : -1;
      const wcEnd = wcStart >= 0 ? wcStart + writingTarget.length : -1;

      let x = startX;
      for (let i = 0; i < word.length; i++) {
        const ch = word[i];
        const w = ctx.measureText(ch).width;
        const isWritingRange = i >= wcStart && i < wcEnd;
        ctx.fillStyle = isWritingRange ? GUIDE_COLOR : SHOW_COLOR;
        ctx.fillText(ch, x, y);
        x += w;
      }
    },
    [calcFont]
  );

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    pathsRef.current = [];
    lastPointRef.current = null;
    drawGuide(ctx, currentItem.word, writingChar);
  }, [currentIndex, currentItem.word, writingChar, drawGuide]);

  const toCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (CANVAS_W / rect.width),
      y: (e.clientY - rect.top) * (CANVAS_H / rect.height),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (showResult) return;
    if (isTutorialPlaying) return;
    e.preventDefault();
    canvasRef.current!.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const pt = toCanvas(e);
    pathsRef.current.push([pt]);
    lastPointRef.current = pt;
    setHasDrawn(true);
    notifyDraw();

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
    drawGuide(ctx, currentItem.word, writingChar);
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
    // guide canvas: 단어 전체 폰트 기준, writingChar 가 차지하는 위치에만 검정 (정확도 비교 대상).
    // drawGuide 와 동일한 글자 배치 — 사용자가 첫 음절 위에 그렸을 때만 점수 높음.
    gCtx.fillStyle = '#ffffff';
    gCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    gCtx.font = calcFont(gCtx, currentItem.word);
    gCtx.fillStyle = '#000000';
    gCtx.textAlign = 'left';
    gCtx.textBaseline = 'middle';

    const totalWidth = gCtx.measureText(currentItem.word).width;
    const startX = (CANVAS_W - totalWidth) / 2;
    const wcStart = writingChar ? currentItem.word.indexOf(writingChar) : -1;
    const wcEnd = wcStart >= 0 ? wcStart + writingChar.length : -1;

    let gx = startX;
    for (let i = 0; i < currentItem.word.length; i++) {
      const ch = currentItem.word[i];
      const w = gCtx.measureText(ch).width;
      if (i >= wcStart && i < wcEnd) {
        gCtx.fillText(ch, gx, CANVAS_H / 2);
      }
      gx += w;
    }

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
      emitFinalResults(newScores);
      onComplete(total, items.length * 100);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  }, [scores, currentScore, currentIndex, items.length, onComplete, emitFinalResults]);

  const handleCheck = async () => {
    if (!hasDrawn) return;
    const accuracy = calculateAccuracy();
    setCurrentScore(accuracy);
    setShowResult(true);

    if (accuracy >= 50) {
      // 한글: phonics concat 우선 / 영어: ttsUrl 우선 (정책 단일화: resolveTtsUrl).
      const isKorean = data.type === 'korean-word-writing';
      const wordAudioUrl = await resolveTtsUrl({
        text: currentItem.word,
        language: isKorean ? 'korean' : 'english',
        storybookId,
        directUrl: currentItem.ttsUrl,
        identifierPrefix: 'wwrite',
      });
      playWordCorrect({
        ttsUrl: wordAudioUrl,
        onDone: () => {
          const newScores = [...scores, accuracy];
          setScores(newScores);
          setShowResult(false);
          setCurrentScore(0);
          setHasDrawn(false);
          if (currentIndex + 1 >= items.length) {
            const total = newScores.reduce((a, b) => a + b, 0);
            emitFinalResults(newScores);
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
    <GamePlayerLayout maxWidth="3xl" bgImageUrl="/images/games/writing-bg.webp">
      <GameHeader
        title="따라 쓰기"
        current={scores.filter((s) => s >= 70).length}
        total={items.length}
        onBack={onBack}
      />
      <div className="flex flex-col items-center gap-3 sm:gap-4 w-full h-full">
        {/* 단어 정보 — HERO 단어 + 작은 일러스트 (LineMatching 톤과 통일) */}
        <div className="flex items-center justify-center gap-3 sm:gap-5 shrink-0">
          {currentItem.imageUrl && (
            <img
              src={currentItem.imageUrl}
              alt={currentItem.word}
              className="h-16 sm:h-20 lg:h-24 w-auto object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.15)]"
            />
          )}
          <div className="text-center">
            <p
              className="font-display font-black tracking-tight leading-none whitespace-nowrap"
              style={{
                fontSize: 'clamp(3rem, 8vw, 7rem)',
                color: '#FF7A3C',
                WebkitTextStroke: '5px white',
                paintOrder: 'stroke fill',
                filter: 'drop-shadow(0 5px 0 rgba(0,0,0,0.08))',
              }}
            >
              {currentItem.displayWord}
            </p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-ink-900 mt-1">
              따라 써보세요
            </p>
          </div>
        </div>

        {/* Canvas — 4:3 비율, 큰 테두리. flex-1 로 남는 영역 채움. */}
        <div className="flex-1 min-h-0 w-full flex items-center justify-center">
          <div
            className={`relative aspect-[2/1] w-full max-h-full border-[5px] rounded-3xl overflow-hidden bg-white shadow-pop transition-all ${
              tutorialPulse
                ? 'border-coral-400 ring-[6px] ring-coral-300 animate-pulse shadow-[0_0_30px_rgba(255,122,60,0.5)]'
                : 'border-peach-200'
            }`}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="w-full h-full"
              style={{ touchAction: 'none' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
            {showResult && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm gap-2">
                <div className="text-6xl sm:text-7xl">
                  {currentScore >= 80 ? '🎉' : currentScore >= 50 ? '👍' : '💪'}
                </div>
                <p className="text-3xl sm:text-4xl font-black text-ink-900">
                  정확도: {currentScore}%
                </p>
                <p className="text-xl sm:text-2xl font-bold text-ink-700">
                  {currentScore >= 80
                    ? '잘했어요!'
                    : currentScore >= 50
                      ? '괜찮아요!'
                      : '다시 해볼까요?'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 컨트롤 — 큼지막한 버튼 */}
        <div className="flex gap-3 sm:gap-4 shrink-0">
          {!showResult ? (
            <>
              <Button variant="ghost" size="md" onClick={handleClear}>
                지우기
              </Button>
              <Button size="md" onClick={handleCheck} disabled={!hasDrawn}>
                확인
              </Button>
            </>
          ) : currentScore < 50 ? (
            <>
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setShowResult(false);
                  handleClear();
                }}
              >
                다시 쓰기
              </Button>
              <Button size="md" onClick={advanceToNext}>
                {currentIndex + 1 >= items.length ? '결과 보기' : '다음 단어'}
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {/* 🪄 도와줘 버튼 — 사용자 정책 (2026-05-12): 블록 게임 외 튜토리얼 노출 X.
          필요 시 아래 블록 풀고 !showResult 가드 추가:
          <button onClick={handleHintStart} disabled={hintActive || isTutorialPlaying}
            className="fixed bottom-4 left-4 z-[70] px-6 py-3 rounded-full bg-gradient-to-b from-warn to-peach-500 text-white font-black text-lg shadow-pop">
            🪄 도와줘
          </button> */}

      <WordWritingTutorial active={hintActive} onEnd={handleHintEnd} />
    </GamePlayerLayout>
  );
}

export function WordWritingPlayer(props: GamePlayerProps) {
  return (
    <TutorialProvider>
      <WordWritingPlayerInner {...props} />
    </TutorialProvider>
  );
}
