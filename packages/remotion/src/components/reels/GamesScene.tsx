import React from 'react';
import {
  AbsoluteFill,
  Img,
  staticFile,
  spring,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';

const { fontFamily } = loadFont('normal', { weights: ['700', '800'] });

const GAMES = [
  { src: 'reels/games/line-matching.webp', label: '짝 맞추기' },
  { src: 'reels/games/connect-dots.webp', label: '점 잇기' },
  { src: 'reels/games/korean-block.webp', label: '한글 블록' },
  { src: 'reels/games/word-writing.webp', label: '단어 쓰기' },
];

export const GamesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headOpacity = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const headY = interpolate(frame, [0, 14], [-30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#EAF7F2' }}>
      <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', paddingTop: 240 }}>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 80,
            color: '#159C7B',
            transform: `translateY(${headY}px)`,
            opacity: headOpacity,
          }}
        >
          다양한 학습게임
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', paddingTop: 120 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 40,
            width: 900,
          }}
        >
          {GAMES.map((g, i) => {
            const s = spring({
              frame: frame - 8 - i * 5,
              fps,
              config: { damping: 13, stiffness: 130 },
            });
            return (
              <div
                key={g.src}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 36,
                  padding: '36px 24px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: '0 16px 40px rgba(21,156,123,0.18)',
                  transform: `scale(${0.7 + s * 0.3})`,
                  opacity: s,
                }}
              >
                <Img
                  src={staticFile(g.src)}
                  style={{ width: 300, height: 300, objectFit: 'contain' }}
                />
                <div
                  style={{
                    fontFamily,
                    fontWeight: 800,
                    fontSize: 48,
                    color: '#2B2B2B',
                    marginTop: 8,
                  }}
                >
                  {g.label}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
