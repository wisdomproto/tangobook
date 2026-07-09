import { useRef, useCallback, useEffect, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { feedDrawLoop } from '@/lib/uiSound';

/**
 * 단어 전체 색칠 캔버스 — 단어의 모든 음절/글자를 한 번에 표시하고, **음절 단위**로 채움을 채점한다.
 * 한 음절 영역을 threshold 만큼 칠하면 그 음절이 완료로 표시되고 onSyllableDone 이 호출된다.
 * 모든 음절이 완료되면 onComplete. 체크마크 등 별도 표식은 그리지 않는다(요청).
 *
 * source-atop 으로 글자 영역 안만 emerald 로 칠해지고, 각 글자의 x 열 범위로 음절별 coverage 를 계산한다.
 */
const CANVAS_W = 720;
const CANVAS_H = 360;
const LINE_WIDTH = 56;
const GUIDE_COLOR = '#e5e7eb'; // gray-200 글자 가이드
const PAINT_COLOR = '#10b981'; // emerald — 칠하는 중
const HANGUL_RE = /[ㄱ-ㆎ가-힣]/;

function fontFamily(text: string): string {
  return HANGUL_RE.test(text)
    ? "'NanumSquareRound', 'NanumSquare', system-ui, sans-serif"
    : 'system-ui, sans-serif';
}

interface WordFillCanvasProps {
  word: string;
  /** 음절(글자) 배열 — 채점 단위. 보통 [...word] 의 글자 단위. */
  syllables: string[];
  onSyllableDone?: (syllable: string, index: number) => void;
  onComplete?: () => void;
  /** 음절별 통과 threshold (0~1). */
  threshold?: number;
}

export function WordFillCanvas({
  word,
  syllables,
  onSyllableDone,
  onComplete,
  threshold = 0.9,
}: WordFillCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  // 각 음절의 x 열 범위 [start, end] (canvas 좌표) + 가이드 픽셀 수(분모).
  const rangesRef = useRef<Array<{ start: number; end: number; guide: number }>>([]);
  const doneRef = useRef<boolean[]>([]);
  const [doneCount, setDoneCount] = useState(0);

  const drawGuide = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // 단어 전체가 폭에 맞도록 폰트 크기 조정
    const fam = fontFamily(word);
    let size = CANVAS_H * 0.7;
    ctx.font = `bold ${size}px ${fam}`;
    while (ctx.measureText(word).width > CANVAS_W * 0.92 && size > 40) {
      size -= 4;
      ctx.font = `bold ${size}px ${fam}`;
    }
    const totalW = ctx.measureText(word).width;
    const startX = (CANVAS_W - totalW) / 2;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = GUIDE_COLOR;
    ctx.fillText(word, startX, CANVAS_H / 2);

    // 음절별 x 범위 계산 (measureText 누적)
    const ranges: Array<{ start: number; end: number; guide: number }> = [];
    let acc = '';
    let prevX = startX;
    for (const syl of syllables) {
      acc += syl;
      const x = startX + ctx.measureText(acc).width;
      ranges.push({ start: prevX, end: x, guide: 0 });
      prevX = x;
    }
    // 가이드 픽셀을 음절 열에 배분
    const img = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H).data;
    for (let p = 0; p < img.length; p += 4) {
      if (img[p + 3] === 0) continue;
      const px = (p / 4) % CANVAS_W;
      for (const r of ranges) {
        if (px >= r.start && px < r.end) {
          r.guide++;
          break;
        }
      }
    }
    rangesRef.current = ranges;
    doneRef.current = ranges.map(() => false);
    setDoneCount(0);
  }, [word, syllables]);

  useEffect(() => {
    drawGuide();
    lastPointRef.current = null;
  }, [drawGuide]);

  /** 칠한 뒤 음절별 coverage 측정 → 새로 완료된 음절 처리. */
  const evaluate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const ranges = rangesRef.current;
    if (ranges.length === 0) return;
    const painted = ranges.map(() => 0);
    const img = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H).data;
    for (let p = 0; p < img.length; p += 4) {
      const a = img[p + 3];
      if (a === 0) continue;
      const r = img[p];
      const g = img[p + 1];
      const b = img[p + 2];
      // emerald(초록 우세) = 사용자가 칠한 영역.
      if (!(g > r + 20 && g > b + 20)) continue;
      const px = (p / 4) % CANVAS_W;
      for (let i = 0; i < ranges.length; i++) {
        if (px >= ranges[i].start && px < ranges[i].end) {
          painted[i]++;
          break;
        }
      }
    }
    for (let i = 0; i < ranges.length; i++) {
      if (doneRef.current[i]) continue;
      if (ranges[i].guide > 0 && painted[i] / ranges[i].guide >= threshold) {
        doneRef.current[i] = true;
        // 완성해도 자동 재도색하지 않는다 (요청) — 사용자가 칠한 emerald 그대로 유지.
        setDoneCount(doneRef.current.filter(Boolean).length);
        onSyllableDone?.(syllables[i], i);
      }
    }
    if (doneRef.current.every(Boolean)) onComplete?.();
  }, [syllables, threshold, onSyllableDone, onComplete]);

  const toCanvas = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (CANVAS_W / rect.width),
      y: (e.clientY - rect.top) * (CANVAS_H / rect.height),
    };
  };

  const paintTo = (x: number, y: number) => {
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.strokeStyle = PAINT_COLOR;
    ctx.fillStyle = PAINT_COLOR;
    ctx.lineWidth = LINE_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const last = lastPointRef.current;
    if (last) {
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, LINE_WIDTH / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    lastPointRef.current = { x, y };
  };

  const onDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    try {
      canvasRef.current!.setPointerCapture(e.pointerId);
    } catch {
      /* no-op */
    }
    isDrawingRef.current = true;
    const pt = toCanvas(e);
    lastPointRef.current = null;
    paintTo(pt.x, pt.y);
    feedDrawLoop();
    evaluate();
  };
  const onMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const pt = toCanvas(e);
    paintTo(pt.x, pt.y);
    feedDrawLoop();
    evaluate();
  };
  const onUp = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
    evaluate();
  };

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <div className="w-full rounded-3xl overflow-hidden border-[5px] border-peach-200 bg-white shadow-pop">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="block w-full h-auto"
          style={{ touchAction: 'none' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
      </div>
      {syllables.length > 1 && (
        <p className="text-base sm:text-lg font-black text-ink-500">
          {doneCount}/{syllables.length} 글자 완성
        </p>
      )}
    </div>
  );
}
