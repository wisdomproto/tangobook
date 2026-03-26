import React from 'react';
import { AbsoluteFill } from 'remotion';
import { KenBurnsSlide } from './KenBurnsSlide';
import { TypewriterSubtitle } from './TypewriterSubtitle';
import { SparkleParticles } from './SparkleParticles';
import type { SubtitleStyle } from '../types';

type CoverSlideProps = {
  imageUrl: string;
  title: string;
  showTitle?: boolean;
  subtitleStyle: SubtitleStyle;
  enableParticles?: boolean;
};

export const CoverSlide: React.FC<CoverSlideProps> = ({
  imageUrl,
  title,
  showTitle = true,
  subtitleStyle,
  enableParticles = true,
}) => {
  return (
    <AbsoluteFill>
      <KenBurnsSlide imageUrl={imageUrl} slideIndex={-1} />
      {showTitle && (
        <TypewriterSubtitle
          text={title}
          style={{ ...subtitleStyle, position: 'center', fontSize: subtitleStyle.fontSize * 1.5 }}
        />
      )}
      {enableParticles && <SparkleParticles seed={999} />}
    </AbsoluteFill>
  );
};
