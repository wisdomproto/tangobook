import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { getKenBurnsParams } from '../utils/ken-burns';

type KenBurnsSlideProps = {
  imageUrl: string;
  slideIndex: number;
};

export const KenBurnsSlide: React.FC<KenBurnsSlideProps> = ({ imageUrl, slideIndex }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const params = getKenBurnsParams(slideIndex);

  const scale = interpolate(frame, [0, durationInFrames], [params.startScale, params.endScale], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateX = interpolate(frame, [0, durationInFrames], [params.startX, params.endX], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(frame, [0, durationInFrames], [params.startY, params.endY], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#000' }}>
      <Img
        src={imageUrl}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
        }}
      />
    </AbsoluteFill>
  );
};
