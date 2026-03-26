import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';

/**
 * Sprite-sheet style running dog animation.
 * Uses SVG frames drawn inline (no external image needed).
 * Each frame shows a different leg position to simulate running.
 */

interface DogFrame {
  body: { x: number; y: number; w: number; h: number };
  head: { x: number; y: number; r: number };
  tail: { path: string };
  legs: { x1: number; y1: number; x2: number; y2: number }[];
  ear: { path: string };
}

// 6 frames of running animation
const DOG_FRAMES: DogFrame[] = [
  // Frame 0: front legs forward, back legs back
  {
    body: { x: 50, y: 40, w: 60, h: 30 },
    head: { x: 120, y: 32, r: 16 },
    tail: { path: 'M50,45 Q30,30 25,20' },
    ear: { path: 'M125,20 Q135,10 130,18' },
    legs: [
      { x1: 65, y1: 70, x2: 55, y2: 90 }, // back-left (back)
      { x1: 75, y1: 70, x2: 85, y2: 90 }, // back-right (forward)
      { x1: 95, y1: 70, x2: 85, y2: 90 }, // front-left (back)
      { x1: 105, y1: 70, x2: 115, y2: 90 }, // front-right (forward)
    ],
  },
  // Frame 1: legs closer together
  {
    body: { x: 50, y: 38, w: 60, h: 30 },
    head: { x: 120, y: 30, r: 16 },
    tail: { path: 'M50,43 Q32,25 28,18' },
    ear: { path: 'M125,18 Q137,8 131,16' },
    legs: [
      { x1: 65, y1: 68, x2: 62, y2: 90 },
      { x1: 75, y1: 68, x2: 78, y2: 90 },
      { x1: 95, y1: 68, x2: 92, y2: 90 },
      { x1: 105, y1: 68, x2: 108, y2: 90 },
    ],
  },
  // Frame 2: legs gathered (airborne)
  {
    body: { x: 50, y: 35, w: 60, h: 30 },
    head: { x: 120, y: 27, r: 16 },
    tail: { path: 'M50,40 Q28,28 22,22' },
    ear: { path: 'M125,15 Q138,5 132,13' },
    legs: [
      { x1: 65, y1: 65, x2: 70, y2: 85 },
      { x1: 75, y1: 65, x2: 75, y2: 85 },
      { x1: 95, y1: 65, x2: 95, y2: 85 },
      { x1: 105, y1: 65, x2: 100, y2: 85 },
    ],
  },
  // Frame 3: legs extending opposite
  {
    body: { x: 50, y: 38, w: 60, h: 30 },
    head: { x: 120, y: 30, r: 16 },
    tail: { path: 'M50,43 Q35,32 30,25' },
    ear: { path: 'M125,18 Q136,9 130,17' },
    legs: [
      { x1: 65, y1: 68, x2: 75, y2: 90 }, // back-left (forward)
      { x1: 75, y1: 68, x2: 65, y2: 90 }, // back-right (back)
      { x1: 95, y1: 68, x2: 105, y2: 90 }, // front-left (forward)
      { x1: 105, y1: 68, x2: 95, y2: 90 }, // front-right (back)
    ],
  },
  // Frame 4: full stretch
  {
    body: { x: 50, y: 40, w: 60, h: 30 },
    head: { x: 120, y: 32, r: 16 },
    tail: { path: 'M50,45 Q32,35 27,28' },
    ear: { path: 'M125,20 Q134,12 129,19' },
    legs: [
      { x1: 65, y1: 70, x2: 80, y2: 90 },
      { x1: 75, y1: 70, x2: 60, y2: 90 },
      { x1: 95, y1: 70, x2: 110, y2: 90 },
      { x1: 105, y1: 70, x2: 90, y2: 90 },
    ],
  },
  // Frame 5: returning
  {
    body: { x: 50, y: 37, w: 60, h: 30 },
    head: { x: 120, y: 29, r: 16 },
    tail: { path: 'M50,42 Q30,28 24,20' },
    ear: { path: 'M125,17 Q137,7 131,15' },
    legs: [
      { x1: 65, y1: 67, x2: 72, y2: 88 },
      { x1: 75, y1: 67, x2: 68, y2: 88 },
      { x1: 95, y1: 67, x2: 102, y2: 88 },
      { x1: 105, y1: 67, x2: 98, y2: 88 },
    ],
  },
];

const DogSvg: React.FC<{ frame: DogFrame; color?: string }> = ({ frame, color = '#8B4513' }) => {
  const darkColor = '#5C2E00';
  const noseColor = '#333';

  return (
    <svg viewBox="0 0 150 100" width="300" height="200">
      {/* Tail */}
      <path d={frame.tail.path} stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />

      {/* Body */}
      <ellipse
        cx={frame.body.x + frame.body.w / 2}
        cy={frame.body.y + frame.body.h / 2}
        rx={frame.body.w / 2}
        ry={frame.body.h / 2}
        fill={color}
      />

      {/* Legs */}
      {frame.legs.map((leg, i) => (
        <line
          key={i}
          x1={leg.x1}
          y1={leg.y1}
          x2={leg.x2}
          y2={leg.y2}
          stroke={darkColor}
          strokeWidth="5"
          strokeLinecap="round"
        />
      ))}

      {/* Paws */}
      {frame.legs.map((leg, i) => (
        <ellipse key={`paw-${i}`} cx={leg.x2} cy={leg.y2 + 2} rx={4} ry={3} fill={darkColor} />
      ))}

      {/* Head */}
      <circle cx={frame.head.x} cy={frame.head.y} r={frame.head.r} fill={color} />

      {/* Ear */}
      <path
        d={frame.ear.path}
        stroke={darkColor}
        strokeWidth="3"
        fill={darkColor}
        strokeLinecap="round"
      />

      {/* Eye */}
      <circle cx={frame.head.x + 6} cy={frame.head.y - 3} r={2.5} fill="white" />
      <circle cx={frame.head.x + 7} cy={frame.head.y - 3} r={1.5} fill={noseColor} />

      {/* Nose */}
      <ellipse cx={frame.head.x + 14} cy={frame.head.y + 2} rx={3} ry={2.5} fill={noseColor} />

      {/* Mouth */}
      <path
        d={`M${frame.head.x + 12},${frame.head.y + 5} Q${frame.head.x + 14},${frame.head.y + 8} ${frame.head.x + 10},${frame.head.y + 7}`}
        stroke={darkColor}
        strokeWidth="1"
        fill="none"
      />

      {/* Collar */}
      <ellipse
        cx={frame.head.x - 8}
        cy={frame.head.y + 12}
        rx={8}
        ry={3}
        fill="#FF4444"
        opacity={0.9}
      />
    </svg>
  );
};

interface RunningDogProps {
  speed?: number; // frames per sprite cycle (lower = faster), default 4
  groundColor?: string;
  skyColor?: string;
  dogColor?: string;
}

export const RunningDog: React.FC<RunningDogProps> = ({
  speed = 4,
  groundColor = '#4a7c59',
  skyColor = '#87CEEB',
  dogColor = '#8B4513',
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Determine which sprite frame to show
  const spriteIndex = Math.floor(frame / speed) % DOG_FRAMES.length;
  const currentDogFrame = DOG_FRAMES[spriteIndex];

  // Dog horizontal position — runs across screen
  const dogX = interpolate(frame, [0, 150], [-200, width + 200], {
    extrapolateRight: 'wrap',
  });

  // Subtle vertical bounce
  const bounceY = interpolate(
    frame % (speed * DOG_FRAMES.length),
    [0, speed * 2, speed * 4, speed * DOG_FRAMES.length],
    [0, -15, -5, 0],
    { extrapolateRight: 'clamp' }
  );

  // Scrolling background hills
  const hillOffset1 = (frame * 1.5) % (width + 400);
  const hillOffset2 = (frame * 0.8) % (width + 600);

  // Clouds
  const cloudOffset = (frame * 0.5) % (width + 300);

  return (
    <div
      style={{
        width,
        height,
        overflow: 'hidden',
        position: 'relative',
        background: `linear-gradient(180deg, ${skyColor} 0%, #B0E0FF 60%, ${groundColor} 75%, #3a6349 100%)`,
      }}
    >
      {/* Clouds */}
      {[0, 1, 2].map((i) => (
        <div
          key={`cloud-${i}`}
          style={{
            position: 'absolute',
            top: 40 + i * 50,
            left: ((cloudOffset + i * 400) % (width + 300)) - 150,
            width: 120 + i * 30,
            height: 40 + i * 10,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.8)',
            filter: 'blur(4px)',
          }}
        />
      ))}

      {/* Background hills */}
      <svg
        style={{ position: 'absolute', bottom: height * 0.25 - 30, left: 0 }}
        width={width}
        height={120}
        viewBox={`0 0 ${width} 120`}
      >
        <path
          d={`M${-hillOffset2},120 Q${200 - hillOffset2},20 ${400 - hillOffset2},80 Q${600 - hillOffset2},10 ${800 - hillOffset2},90 Q${1000 - hillOffset2},30 ${1200 - hillOffset2},70 Q${1400 - hillOffset2},20 ${1600 - hillOffset2},100 L${1600 - hillOffset2},120 Z`}
          fill="#5a9a6a"
          opacity={0.5}
        />
        <path
          d={`M${-hillOffset1},120 Q${150 - hillOffset1},40 ${350 - hillOffset1},90 Q${550 - hillOffset1},30 ${750 - hillOffset1},85 Q${950 - hillOffset1},25 ${1150 - hillOffset1},75 Q${1350 - hillOffset1},40 ${1550 - hillOffset1},100 L${1550 - hillOffset1},120 Z`}
          fill="#4a8a5a"
          opacity={0.6}
        />
      </svg>

      {/* Ground line */}
      <div
        style={{
          position: 'absolute',
          bottom: height * 0.22,
          left: 0,
          right: 0,
          height: 3,
          background: '#2d5a3a',
        }}
      />

      {/* Running Dog */}
      <div
        style={{
          position: 'absolute',
          bottom: height * 0.22 - 10,
          left: dogX,
          transform: `translateY(${bounceY}px)`,
        }}
      >
        <DogSvg frame={currentDogFrame} color={dogColor} />
      </div>

      {/* Dust particles behind dog */}
      {[0, 1, 2, 3].map((i) => {
        const dustAge = (frame - i * 3) % 20;
        const dustOpacity = interpolate(dustAge, [0, 10, 20], [0.6, 0.3, 0], {
          extrapolateRight: 'clamp',
        });
        const dustSize = interpolate(dustAge, [0, 20], [3, 12], {
          extrapolateRight: 'clamp',
        });
        return (
          <div
            key={`dust-${i}`}
            style={{
              position: 'absolute',
              bottom: height * 0.22 - 5 + i * 4,
              left: dogX - 20 - i * 15 - dustAge * 2,
              width: dustSize,
              height: dustSize,
              borderRadius: '50%',
              background: '#c4a97d',
              opacity: dustOpacity,
              filter: 'blur(2px)',
            }}
          />
        );
      })}

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 30,
          width: '100%',
          textAlign: 'center',
          fontSize: 36,
          fontWeight: 'bold',
          color: 'white',
          textShadow: '2px 2px 4px rgba(0,0,0,0.4)',
          fontFamily: 'sans-serif',
        }}
      >
        🐕 Running Dog Sprite Animation
      </div>
    </div>
  );
};
