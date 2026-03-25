import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';
import type { SubtitleStyle } from '../types';

const { fontFamily } = loadFont();

type TypewriterSubtitleProps = {
  text: string;
  style: SubtitleStyle;
  charFrames?: number;
};

export const TypewriterSubtitle: React.FC<TypewriterSubtitleProps> = ({
  text,
  style,
  charFrames = 2,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  const typedChars = Math.min(text.length, Math.floor(frame / charFrames));
  const displayText = text.slice(0, typedChars);

  const fadeOutStart = durationInFrames - Math.round(0.5 * fps);
  const opacity = interpolate(frame, [fadeOutStart, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent:
          style.position === 'center'
            ? 'center'
            : style.position === 'bottom'
              ? 'flex-end'
              : 'flex-start',
        alignItems: 'center',
        padding:
          style.position === 'bottom'
            ? '0 40px 60px'
            : style.position === 'top'
              ? '60px 40px 0'
              : '0 40px',
        opacity,
      }}
    >
      {displayText && (
        <div
          style={{
            fontFamily,
            fontSize: style.fontSize,
            fontWeight: 700,
            color: style.color,
            backgroundColor: style.backgroundColor,
            padding: '8px 20px',
            borderRadius: 6,
            textAlign: 'center',
            lineHeight: 1.5,
            maxWidth: '80%',
            wordBreak: 'keep-all',
          }}
        >
          {displayText}
        </div>
      )}
    </AbsoluteFill>
  );
};
