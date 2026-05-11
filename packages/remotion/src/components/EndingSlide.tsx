import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';
import { SparkleParticles } from './SparkleParticles';

const { fontFamily } = loadFont('normal', { weights: ['700'], subsets: ['korean'] });

type EndingSlideProps = {
  text?: string;
  enableParticles?: boolean;
};

export const EndingSlide: React.FC<EndingSlideProps> = ({
  text = 'The End',
  enableParticles = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 1 * fps], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{ backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' }}
    >
      <div
        style={{
          fontFamily,
          fontSize: 64,
          fontWeight: 700,
          color: '#ffffff',
          opacity,
          textAlign: 'center',
        }}
      >
        {text}
      </div>
      {enableParticles && <SparkleParticles seed={888} count={40} />}
    </AbsoluteFill>
  );
};
