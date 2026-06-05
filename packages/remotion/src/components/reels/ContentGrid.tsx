import React from 'react';
import {
  AbsoluteFill,
  Img,
  staticFile,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';

const { fontFamily } = loadFont('normal', { weights: ['700', '800'] });

const COVERS = Array.from(
  { length: 15 },
  (_, i) => `reels/grid/g-${String(i + 1).padStart(2, '0')}.jpg`
);

const COLS = 3;
const GAP = 14;

export const ContentGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headlineY = interpolate(frame, [0, 18], [40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const headlineOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#FFF6EE' }}>
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          padding: 48,
          paddingBottom: 320,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gap: GAP,
            width: '100%',
          }}
        >
          {COVERS.map((src, i) => {
            const row = Math.floor(i / COLS);
            const col = i % COLS;
            const delay = (row + col) * 3;
            const s = spring({
              frame: frame - delay,
              fps,
              config: { damping: 14, stiffness: 120 },
            });
            return (
              <div
                key={src}
                style={{
                  aspectRatio: '16 / 9',
                  borderRadius: 12,
                  overflow: 'hidden',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.14)',
                  transform: `scale(${0.6 + s * 0.4})`,
                  opacity: s,
                }}
              >
                <Img
                  src={staticFile(src)}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingBottom: 170,
        }}
      >
        <div
          style={{
            transform: `translateY(${headlineY}px)`,
            opacity: headlineOpacity,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontFamily,
              fontWeight: 700,
              fontSize: 40,
              color: '#FF6B5E',
              marginBottom: 8,
            }}
          >
            명작부터 자연관찰까지
          </div>
          <div
            style={{
              fontFamily,
              fontWeight: 800,
              fontSize: 76,
              color: '#2B2B2B',
              textShadow: '0 2px 12px rgba(255,255,255,0.8)',
            }}
          >
            200여 권의 그림책
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
