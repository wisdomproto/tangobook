import { useState, useRef, useCallback, useEffect } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Button } from '@/design-system';

/**
 * paint-bucket 채점 캔버스 — 글자 영역 안만 painted, 채움 비율로 통과 판정.
 *
 * 기존 LetterWritingCanvas (proximity * coverage threshold) 의 직관 부족 문제 해결:
 *   - 사용자가 글자 안을 색칠하는 게임처럼 보임 → 어디까지 채우면 통과인지 시각 자명
 *   - `globalCompositeOperation: 'source-atop'` 로 글자 영역 밖 stroke 는 자동 무시 (precision 자동)
 *   - coverage = (painted 픽셀) / (글자 픽셀). threshold 도달 시 자동 통과
 *   - 진척 % 진척 바로 표시 — 사용자가 채우는 정도를 실시간 확인
 *
 * 한글 단어쓰기 등 폰트 fidelity 가 중요한 곳에 적합 (영어 stroke library 와는 별개 channel).
 */

const CANVAS_W = 400;
const CANVAS_H = 400;
// 매우 두꺼운 펜 — 한글 글자 stroke 두께 이상. 한 번 쓱 그어도 그 영역 다 덮어짐.
// source-atop 라 글자 밖 안 painted — 펜 두꺼워도 안전.
const LINE_WIDTH = 60;
const GUIDE_COLOR = '#e5e7eb'; // 글자 회색 outline (gray-200)
const PAINT_COLOR = '#10b981'; // emerald — 사용자가 채운 영역
const DEFAULT_THRESHOLD = 0.95; // 95% 채우면 통과 — 두꺼운 펜이라 도달 쉬움

const HANGUL_RE = /[ㄱ-ㆎ가-힣]/;
const FONT_FAMILY_EN = 'system-ui, sans-serif';
const FONT_FAMILY_KO = "'NanumSquareRound', 'NanumSquare', system-ui, sans-serif";
function pickFontFamily(letter: string): string {
  return HANGUL_RE.test(letter) ? FONT_FAMILY_KO : FONT_FAMILY_EN;
}

interface LetterFillCanvasProps {
  letter: string;
  /** 통과 시 호출 — autoCheck 모드만 자동 호출, 아니면 사용자가 "확인" 버튼 누름. */
  onResult?: (passed: boolean, coverage: number) => void;
  correctSoundUrl?: string;
  correctSoundUrls?: string[];
  incorrectSoundUrl?: string;
  /** 통과 threshold (0~1). 기본 0.7 (70% 채우면 통과). */
  threshold?: number;
  /** true 면 통과 시 자동 onResult. false 면 사용자가 "확인" 버튼 클릭. */
  autoCheck?: boolean;
}

export function LetterFillCanvas({
  letter,
  onResult,
  correctSoundUrl,
  correctSoundUrls,
  incorrectSoundUrl,
  threshold = DEFAULT_THRESHOLD,
  autoCheck,
}: LetterFillCanvasProps) {
  const [hasDrawn, setHasDrawn] = useState(false);
  const [result, setResult] = useState<{ passed: boolean; coverage: number } | null>(null);
  const [liveCoverage, setLiveCoverage] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  /** 글자 mask 픽셀 수 — coverage 분모. drawGuide 시점에 계산. */
  const guidePixelsRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const calcFont = useCallback((ctx: CanvasRenderingContext2D, text: string) => {
    const fontFamily = pickFontFamily(text);
    let size = CANVAS_H * 0.85;
    ctx.font = `bold ${size}px ${fontFamily}`;
    while (ctx.measureText(text).width > CANVAS_W * 0.95 && size > 32) {
      size -= 4;
      ctx.font = `bold ${size}px ${fontFamily}`;
    }
    return `bold ${size}px ${fontFamily}`;
  }, []);

  /**
   * 글자 그리기 + mask 픽셀 수 계산.
   * canvas 비우고 회색 글자만 그림 — 사용자 stroke 가 source-atop 으로 이 위에만 painted.
   */
  const drawGuide = useCallback(
    (ctx: CanvasRenderingContext2D, text: string) => {
      // canvas 비우기 (투명)
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // 글자 회색 fill — 글자 영역만 픽셀 존재 (밖은 투명)
      ctx.font = calcFont(ctx, text);
      ctx.fillStyle = GUIDE_COLOR;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, CANVAS_W / 2, CANVAS_H / 2);

      // mask 픽셀 수 측정 — coverage 분모
      const imageData = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
      let guidePixels = 0;
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 0) guidePixels++; // alpha > 0 픽셀
      }
      guidePixelsRef.current = guidePixels;
    },
    [calcFont]
  );

  // 캔버스 초기화 (letter 변경 시 reset)
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    lastPointRef.current = null;
    setHasDrawn(false);
    setResult(null);
    setLiveCoverage(0);
    drawGuide(ctx, letter);
  }, [letter, drawGuide]);

  const toCanvas = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (CANVAS_W / rect.width),
      y: (e.clientY - rect.top) * (CANVAS_H / rect.height),
    };
  };

  /** 사용자가 그린 emerald 픽셀 수 / 글자 mask 픽셀 수. source-atop 라 글자 밖 픽셀 없음. */
  const measureCoverage = useCallback((): number => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || guidePixelsRef.current === 0) return 0;
    const imageData = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    let paintedPixels = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const a = imageData.data[i + 3];
      // emerald painted: alpha 있고 R<128, G>128 (#10b981 ≈ rgb(16,185,129))
      if (a > 0 && r < 128 && g > 128 && b < 200) {
        paintedPixels++;
      }
    }
    return paintedPixels / guidePixelsRef.current;
  }, []);

  const drawPaintCircle = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop'; // 글자 영역 안만 painted
    ctx.fillStyle = PAINT_COLOR;
    ctx.beginPath();
    ctx.arc(x, y, LINE_WIDTH / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, []);

  const drawPaintLine = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      from: { x: number; y: number },
      to: { x: number; y: number }
    ) => {
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      ctx.strokeStyle = PAINT_COLOR;
      ctx.lineWidth = LINE_WIDTH;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.restore();
    },
    []
  );

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (result) return;
    e.preventDefault();
    canvasRef.current!.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const pt = toCanvas(e);
    lastPointRef.current = pt;
    setHasDrawn(true);
    const ctx = canvasRef.current!.getContext('2d')!;
    drawPaintCircle(ctx, pt.x, pt.y);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || result) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext('2d')!;
    const pt = toCanvas(e);
    const last = lastPointRef.current!;
    drawPaintLine(ctx, last, pt);
    lastPointRef.current = pt;
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPointRef.current = null;
    if (hasDrawn && !result) {
      const cov = measureCoverage();
      setLiveCoverage(cov);
      if (autoCheck && cov >= threshold) {
        handleCheck(true);
      }
    }
  };

  const handleClear = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    lastPointRef.current = null;
    setHasDrawn(false);
    setResult(null);
    setLiveCoverage(0);
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
      /* no-op */
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

  const pickCorrectSound = useCallback(() => {
    if (correctSoundUrls && correctSoundUrls.length > 0) {
      return correctSoundUrls[Math.floor(Math.random() * correctSoundUrls.length)];
    }
    return correctSoundUrl;
  }, [correctSoundUrls, correctSoundUrl]);

  const handleCheck = useCallback(
    (silent?: boolean) => {
      if (!hasDrawn) return;
      const cov = measureCoverage();
      const passed = cov >= threshold;
      if (silent && !passed) return;
      setResult({ passed, coverage: cov });
      playSound(passed ? pickCorrectSound() : incorrectSoundUrl, passed);
      onResult?.(passed, cov);
    },
    [hasDrawn, threshold, pickCorrectSound, incorrectSoundUrl, onResult, measureCoverage, playSound]
  );

  const pctText = `${Math.round(liveCoverage * 100)}%`;
  const thresholdPct = Math.round(threshold * 100);
  const passedNow = liveCoverage >= threshold;

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

      {/* 진척 바 — 채움 % 시각화 */}
      {hasDrawn && !result && (
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between text-sm font-bold mb-1">
            <span className={passedNow ? 'text-emerald-600' : 'text-slate-500'}>
              {pctText} {passedNow && '✓'}
            </span>
            <span className="text-slate-400">목표 {thresholdPct}%</span>
          </div>
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${passedNow ? 'bg-emerald-500' : 'bg-amber-400'}`}
              style={{ width: `${Math.min(100, liveCoverage * 100)}%` }}
            />
          </div>
        </div>
      )}

      {result && (
        <div className="text-center">
          <div className={`text-4xl mb-1 ${result.passed ? 'animate-bounce' : ''}`}>
            {result.passed ? '🎉' : '💪'}
          </div>
          <p
            className={`text-lg font-black ${result.passed ? 'text-emerald-600' : 'text-amber-600'}`}
          >
            {Math.round(result.coverage * 100)}%{' '}
            {result.passed ? '- 잘했어요!' : '- 더 채워볼까요?'}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="ghost" size="lg" onClick={handleClear} className="text-lg px-6">
          {result ? '다시 쓰기' : '지우기'}
        </Button>
        {!result && !autoCheck && (
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
