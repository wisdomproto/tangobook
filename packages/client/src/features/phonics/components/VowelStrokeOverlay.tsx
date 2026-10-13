import { useEffect, useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { VowelGuideStroke, WritingGuidance } from './vowel-stroke-guide';

const DRAW_SECONDS = 0.7;
const STROKE_SECONDS = 1;

export function VowelStrokeOverlay({
  strokes,
  guidance,
  demonstrating,
  currentStroke,
  onDemoEnd,
}: {
  strokes: VowelGuideStroke[];
  guidance: WritingGuidance;
  demonstrating: boolean;
  currentStroke: number;
  onDemoEnd: () => void;
}) {
  const markerId = useId();
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!demonstrating || !strokes.length) return;
    if (reduced) {
      onDemoEnd();
      return;
    }
    const timer = window.setTimeout(onDemoEnd, strokes.length * STROKE_SECONDS * 1000 + 200);
    return () => window.clearTimeout(timer);
  }, [demonstrating, strokes, reduced, onDemoEnd]);

  if (!strokes.length || (!demonstrating && guidance === 'independent')) return null;
  const radius = guidance === 'hint' ? 12 : 16;
  return (
    <svg
      aria-hidden="true"
      data-stroke-overlay={demonstrating ? 'demo' : 'hint'}
      data-current-stroke={currentStroke + 1}
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 400 400"
    >
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="3"
          markerHeight="3"
          orient="auto"
        >
          <path
            d="M 1 1 L 8 5 L 1 9"
            fill="none"
            stroke="#bd4b2d"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
      {strokes.map(({ from, to }, index) => {
        const path = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
        if (demonstrating && !reduced) {
          const delay = index * STROKE_SECONDS;
          return (
            <g key={index}>
              <motion.path
                d={path}
                fill="none"
                stroke="#f7a579"
                strokeWidth="13"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  pathLength: { duration: DRAW_SECONDS, delay, ease: 'linear' },
                  opacity: { duration: 0.01, delay },
                }}
              />
              <motion.g
                initial={{ x: from.x, y: from.y, opacity: 0 }}
                animate={{ x: [from.x, to.x], y: [from.y, to.y], opacity: [0, 1, 1, 0] }}
                transition={{
                  x: { duration: DRAW_SECONDS, delay, ease: 'linear' },
                  y: { duration: DRAW_SECONDS, delay, ease: 'linear' },
                  opacity: { duration: DRAW_SECONDS, delay, times: [0, 0.03, 0.95, 1] },
                }}
              >
                {/* The graphite tip is the exact path point; the barrel sits above/right. */}
                <g transform="rotate(35)">
                  <path
                    d="M0 0 L-7 -14 L7 -14 Z"
                    fill="#f5d4a5"
                    stroke="#b98558"
                    strokeWidth="1.5"
                  />
                  <path d="M0 0 L-3 -6 L3 -6 Z" fill="#554436" />
                  <rect
                    x="-7"
                    y="-64"
                    width="14"
                    height="50"
                    rx="3"
                    fill="#ffa87e"
                    stroke="#c96440"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M-2 -58 L-2 -18"
                    stroke="#ffe1bf"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <rect x="-7" y="-70" width="14" height="10" rx="4" fill="#9accaa" />
                </g>
              </motion.g>
            </g>
          );
        }
        if (index !== currentStroke) return null;
        const length = Math.hypot(to.x - from.x, to.y - from.y);
        const skip = radius + 6;
        const arrowFrom = {
          x: from.x + ((to.x - from.x) * skip) / length,
          y: from.y + ((to.y - from.y) * skip) / length,
        };
        return (
          <g key={index}>
            <path
              d={`M ${arrowFrom.x} ${arrowFrom.y} L ${to.x} ${to.y}`}
              fill="none"
              stroke="#bd4b2d"
              strokeWidth={guidance === 'hint' ? 3 : 4}
              strokeDasharray="3 8"
              strokeLinecap="round"
              markerEnd={`url(#${markerId})`}
            />
            <circle
              cx={from.x}
              cy={from.y}
              r={radius}
              fill="#fff8ed"
              stroke="#bd4b2d"
              strokeWidth="2.5"
            />
            <text
              x={from.x}
              y={from.y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={radius + 4}
              fontWeight="800"
              fill="#a44229"
            >
              {index + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
