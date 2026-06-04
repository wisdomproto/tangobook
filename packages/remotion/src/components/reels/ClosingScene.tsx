import React from 'react';
import { AbsoluteFill, Img, staticFile, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';
import { SparkleParticles } from '../SparkleParticles';

const { fontFamily } = loadFont('normal', { weights: ['800'] });

export const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill
      style={{ backgroundColor: '#FF6B5E', justifyContent: 'center', alignItems: 'center' }}
    >
      <Img
        src={staticFile('reels/mascot/waving.webp')}
        style={{ width: 320, transform: `scale(${pop})` }}
      />
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 110,
          color: '#fff',
          marginTop: 24,
          transform: `scale(${pop})`,
        }}
      >
        오픈베타 무료
      </div>
      <div style={{ fontFamily, fontWeight: 800, fontSize: 52, color: '#FFE9D6', marginTop: 16 }}>
        지금 무료로 보기 👇
      </div>
      <SparkleParticles seed={777} count={50} />
    </AbsoluteFill>
  );
};
