import React from 'react';
import { AbsoluteFill, Img, staticFile, interpolate, useCurrentFrame } from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';

const { fontFamily } = loadFont('normal', { weights: ['700', '800'] });

const STYLES = [
  'reels/styles/style-01-watercolor.webp',
  'reels/styles/style-08-pastel.webp',
  'reels/styles/style-05-3d-toy.webp',
  'reels/styles/style-03-classic.webp',
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
          <AbsoluteFill
            key={src}
            style={{ opacity, justifyContent: 'center', alignItems: 'center' }}
          >
            <Img
              src={staticFile(src)}
              style={{ width: '78%', borderRadius: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}
            />
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
            color: '#2B2B2B',
            textAlign: 'center',
            lineHeight: 1.3,
            whiteSpace: 'pre-line',
            textShadow: '0 2px 12px rgba(255,255,255,0.8)',
          }}
        >
          {'동화책 그림체가\n하나일 필요 있어요?'}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
