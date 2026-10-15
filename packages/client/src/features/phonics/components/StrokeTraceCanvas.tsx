import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, RotateCcw } from 'lucide-react';
import { feedDrawLoop, playUi } from '@/lib/uiSound';
import { emitLearningEffect } from '@/features/games/effects/learning-effects';
import { getLetterGuideStrokes } from './letter-stroke-guide';
import { VowelStrokeOverlay } from './VowelStrokeOverlay';
import {
  guidePath,
  type StrokePoint,
  type VowelGuideStroke,
  type WritingGuidance,
} from './vowel-stroke-guide';
import {
  beginTrace,
  makeTracePath,
  moveTrace,
  strokeOwners,
  tracePassed,
  type TraceAttempt,
  type TracePath,
} from './stroke-tracing';
import './stroke-tracing.css';

const SIZE = 400;
const FACE = "'NanumSquareRound', 'NanumSquare', system-ui, sans-serif";
export function StrokeTraceCanvas({
  letter,
  guidance,
  onResult,
  compact = false,
}: {
  letter: string;
  guidance: WritingGuidance;
  onResult: (passed: boolean, coverage: number) => void;
  compact?: boolean;
}) {
  const { t } = useTranslation('phonics');
  const english = /^[A-Za-z]$/.test(letter);
  const face = english ? 'system-ui, sans-serif' : FACE;
  const canvas = useRef<HTMLCanvasElement>(null);
  const model = useRef<{ mask: ImageData; owners: Uint8Array; paths: TracePath[] }>();
  const attempt = useRef<TraceAttempt | null>(null);
  const pointer = useRef<number | null>(null);
  const index = useRef(0);
  const reported = useRef(false);
  const [strokes, setStrokes] = useState<VowelGuideStroke[]>([]);
  const [done, setDone] = useState(0);
  const [trail, setTrail] = useState('');
  const [ready, setReady] = useState(false);
  const [demonstrating, setDemonstrating] = useState(guidance === 'demo');
  const [demoVersion, setDemoVersion] = useState(0);
  const [retry, setRetry] = useState(false);
  const endDemo = useCallback(() => setDemonstrating(false), []);
  const paint = useCallback((completed: number) => {
    const ctx = canvas.current?.getContext('2d'),
      data = model.current;
    if (!ctx || !data) return;
    const image = ctx.createImageData(SIZE, SIZE);
    for (let p = 0; p < data.owners.length; p++) {
      const filled = data.owners[p] < completed;
      image.data[p * 4] = filled ? 40 : 224;
      image.data[p * 4 + 1] = filled ? 147 : 230;
      image.data[p * 4 + 2] = filled ? 108 : 218;
      image.data[p * 4 + 3] = data.mask.data[p * 4 + 3];
    }
    ctx.putImageData(image, 0, 0);
  }, []);
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setStrokes([]);
    setDone(0);
    setTrail('');
    setDemonstrating(guidance === 'demo');
    model.current = undefined;
    index.current = 0;
    reported.current = false;
    attempt.current = null;
    pointer.current = null;
    const initialize = () => {
      if (cancelled) return;
      const ctx = canvas.current?.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, SIZE, SIZE);
      let size = 340;
      ctx.font = `bold ${size}px ${face}`;
      while (ctx.measureText(letter).width > SIZE * 0.95 && size > 32) {
        size -= 4;
        ctx.font = `bold ${size}px ${face}`;
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#e0e6da';
      ctx.fillText(letter, SIZE / 2, SIZE / 2);
      const mask = ctx.getImageData(0, 0, SIZE, SIZE);
      const guides = getLetterGuideStrokes(letter, mask);
      const paths = guides.map(makeTracePath);
      model.current = { mask, paths, owners: strokeOwners(mask, paths) };
      setStrokes(guides);
      setReady(paths.length > 0);
      paint(0);
    };
    if (document.fonts?.load)
      void document.fonts.load(`bold 340px ${face}`, letter).then(initialize, initialize);
    else initialize();
    return () => {
      cancelled = true;
    };
  }, [letter, face, guidance, paint]);
  const point = (e: { clientX: number; clientY: number }): StrokePoint => {
    const box = canvas.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - box.left) * SIZE) / box.width,
      y: ((e.clientY - box.top) * SIZE) / box.height,
    };
  };
  const down = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!ready || reported.current || pointer.current !== null) return;
    e.preventDefault();
    setDemonstrating(false);
    setRetry(false);
    const path = model.current!.paths[index.current];
    const next = beginTrace(path, point(e));
    if (!next) {
      setRetry(true);
      return;
    }
    pointer.current = e.pointerId;
    attempt.current = next;
    e.currentTarget.setPointerCapture(e.pointerId);
    feedDrawLoop();
  };
  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerId !== pointer.current || !attempt.current) return;
    e.preventDefault();
    const path = model.current!.paths[index.current];
    attempt.current = moveTrace(path, attempt.current, point(e), { softTurns: english });
    const traced = path.points.slice(0, attempt.current.index + 1);
    setTrail(traced.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' '));
    feedDrawLoop();
  };
  const completeStroke = () => {
    if (reported.current) return;
    setRetry(false);
    const count = ++index.current;
    setDone(count);
    paint(count);
    playUi(count === strokes.length ? 'success' : 'select');
    if (count === strokes.length) {
      reported.current = true;
      emitLearningEffect('letter', canvas.current);
      onResult(true, 1);
    }
  };
  const end = (e: PointerEvent<HTMLCanvasElement>, cancelled = false) => {
    if (e.pointerId !== pointer.current) return;
    const data = model.current!;
    const trace = attempt.current;
    pointer.current = null;
    attempt.current = null;
    setTrail('');
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    if (!trace || cancelled) return;
    const final = moveTrace(data.paths[index.current], trace, point(e), { softTurns: english });
    if (!tracePassed(data.paths[index.current], final, { softEnd: english })) {
      setRetry(true);
      return;
    }
    completeStroke();
  };
  const passed = strokes.length > 0 && done === strokes.length;
  const currentDot = ready && !passed && strokes[done]?.dot ? strokes[done] : null;
  return (
    <div
      className="letter-fill-canvas stroke-trace-canvas"
      data-writing-guidance={guidance}
      data-compact={compact || undefined}
      data-language={english ? 'english' : 'korean'}
    >
      <div className="letter-fill-paper stroke-trace-paper" data-complete={passed || undefined}>
        <canvas
          ref={canvas}
          width={SIZE}
          height={SIZE}
          aria-label={t('write.traceLetter', { letter })}
          style={{ touchAction: 'none', aspectRatio: '1/1' }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={(e) => end(e)}
          onPointerCancel={(e) => end(e, true)}
          onLostPointerCapture={(e) => end(e, true)}
        />
        {!passed && (!currentDot || demonstrating) && (
          <VowelStrokeOverlay
            key={demoVersion}
            strokes={strokes}
            guidance={guidance}
            demonstrating={demonstrating}
            currentStroke={done}
            onDemoEnd={endDemo}
            accent={english ? '#22694f' : undefined}
          />
        )}
        {currentDot && !demonstrating && (
          <button
            type="button"
            className="stroke-trace-dot-target"
            style={{
              left: `clamp(22px, ${(currentDot.from.x / SIZE) * 100}%, calc(100% - 22px))`,
              top: `clamp(22px, ${(currentDot.from.y / SIZE) * 100}%, calc(100% - 22px))`,
            }}
            aria-label={t('write.tapLetterDot', { letter })}
            onClick={() => {
              if (model.current?.paths[index.current]?.dot) completeStroke();
            }}
          >
            <span className="stroke-trace-dot-ink" aria-hidden="true" />
            <span className="stroke-trace-dot-label" aria-hidden="true">
              {t('write.tapDotAction')}
            </span>
          </button>
        )}
        {trail && (
          <svg viewBox="0 0 400 400" aria-hidden="true" className="stroke-trace-ink">
            <path
              d={trail}
              fill="none"
              stroke="#59ba8d"
              strokeWidth="18"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {done > 0 && (
          <svg key={done} viewBox="0 0 400 400" aria-hidden="true" className="stroke-trace-flash">
            <path
              d={guidePath(strokes[done - 1])}
              fill="none"
              stroke="#c3f0cb"
              strokeWidth="22"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <div className="vowel-stroke-tools stroke-trace-tools">
        <span role="status">
          {!ready
            ? t('write.preparing')
            : passed
              ? t('write.finished')
              : demonstrating
                ? t('write.watch')
                : retry
                  ? t('write.tryFromStart')
                  : strokes[done]?.dot
                    ? t('write.tapDot')
                    : t('write.strokeNumber', { n: done + 1 })}
        </span>
        <button
          type="button"
          aria-label={english ? `${letter} ${t('write.showStrokes')}` : t('write.showStrokes')}
          disabled={!ready || passed}
          onClick={() => {
            setDemoVersion((v) => v + 1);
            setDemonstrating(true);
            setRetry(false);
          }}
        >
          <RotateCcw size={18} aria-hidden="true" />
          {t('write.showStrokes')}
        </button>
      </div>
      <div
        className="stroke-trace-steps"
        role="progressbar"
        aria-label={`${letter} ${t('write.strokeProgress')}`}
        aria-valuemin={0}
        aria-valuemax={strokes.length || 1}
        aria-valuenow={done}
      >
        {strokes.map((_, i) => (
          <span
            key={i}
            data-done={i < done || undefined}
            data-current={i === done || undefined}
            aria-hidden="true"
          >
            {i < done ? <Check size={17} /> : i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}
