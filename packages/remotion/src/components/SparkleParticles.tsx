import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

type Particle = {
  x: number;
  y: number;
  size: number;
  speed: number;
  phase: number;
};

function generateParticles(count: number, seed: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const s = Math.sin((seed + i) * 9301 + 49297) * 49297;
    const r = s - Math.floor(s);
    const s2 = Math.sin((seed + i + 100) * 9301 + 49297) * 49297;
    const r2 = s2 - Math.floor(s2);
    particles.push({
      x: r * 100,
      y: r2 * 100,
      size: 2 + r * 4,
      speed: 0.3 + r2 * 0.7,
      phase: r * Math.PI * 2,
    });
  }
  return particles;
}

type SparkleParticlesProps = {
  count?: number;
  seed?: number;
};

export const SparkleParticles: React.FC<SparkleParticlesProps> = ({ count = 30, seed = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const particles = generateParticles(count, seed);
  const time = frame / fps;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {particles.map((p, i) => {
        const opacity = ((Math.sin(time * p.speed * 3 + p.phase) + 1) / 2) * 0.7 + 0.1;
        const yOffset = Math.sin(time * p.speed + p.phase) * 10;
        const xOffset = Math.cos(time * p.speed * 0.5 + p.phase) * 5;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.x + xOffset}%`,
              top: `${p.y + yOffset}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              opacity,
              boxShadow: `0 0 ${p.size * 2}px ${p.size}px rgba(255, 255, 255, 0.3)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
