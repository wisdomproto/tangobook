import React from 'react';
import { AbsoluteFill, Img, staticFile, interpolate, useCurrentFrame } from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';

const { fontFamily } = loadFont('normal', { weights: ['700', '800'] });

const STYLES = [
  'reels/styles/db-01-watercolor.jpg',
  'reels/styles/db-02-pixar3d.jpg',
  'reels/styles/db-03-papercraft.jpg',
  'reels/styles/db-04-custom.jpg',
];

export const StyleMorphHook: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const per = durationInFrames / STYLES.length;
  return (
    <AbsoluteFill style={{ backgroundColor: '#FFF6EE' }}>
      {STYLES.map((src, i) => {
        const start = i * per;
        const opacity = interpolate(
          frame,
          [start - per * 0.4, start, start + per * 0.6, start + per],
          [0, 1, 1, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        return (
          <AbsoluteFill key={src} style={{ opacity }}>
            {/* 블러 풀블리드 배경 */}
            <Img
              src={staticFile(src)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'blur(48px) brightness(0.55)',
                transform: 'scale(1.25)',
              }}
            />
            <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
              <Img
                src={staticFile(src)}
                style={{
                  width: '84%',
                  borderRadius: 32,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
                }}
              />
            </AbsoluteFill>
          </AbsoluteFill>
        );
      })}
      <AbsoluteFill
        style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 180 }}
      >
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 72,
            color: '#fff',
            textAlign: 'center',
            lineHeight: 1.3,
            whiteSpace: 'pre-line',
            textShadow: '0 4px 20px rgba(0,0,0,0.6)',
          }}
        >
          {'동화책 그림체가\n하나일 필요 있어요?'}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
