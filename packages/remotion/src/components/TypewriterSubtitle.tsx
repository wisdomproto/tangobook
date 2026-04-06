import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';
import type { SubtitleStyle } from '../types';

const { fontFamily } = loadFont();

type TypewriterSubtitleProps = {
  text: string;
  style: SubtitleStyle;
  /** Actual slide duration in frames (required for correct sentence timing) */
  slideDurationInFrames?: number;
  /** @deprecated kept for backward compat */
  wordGroupFrames?: number;
  /** @deprecated kept for backward compat */
  wordsPerGroup?: number;
};

/**
 * Split text into sentences using common sentence-ending punctuation.
 */
function splitIntoSentences(text: string): string[] {
  const sentences = text
    .split(/(?<=[.!?。」"'])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences.length > 0 ? sentences : [text];
}

export const TypewriterSubtitle: React.FC<TypewriterSubtitleProps> = ({
  text,
  style,
  slideDurationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames: compositionDuration, fps } = useVideoConfig();

  // Use slide-level duration if provided, otherwise fall back to composition duration
  const effectiveDuration = slideDurationInFrames ?? compositionDuration;

  const sentences = splitIntoSentences(text);
  const count = sentences.length;

  // Distribute duration evenly across sentences, leave 0.5s for fade-out
  const fadeOutDuration = Math.round(0.5 * fps);
  const availableFrames = effectiveDuration - fadeOutDuration;
  const framesPerSentence = count > 0 ? Math.floor(availableFrames / count) : availableFrames;

  // Which sentence to show
  const sentenceIdx = Math.min(count - 1, Math.floor(frame / framesPerSentence));
  const displayText = sentences[sentenceIdx] || '';

  const fadeOutStart = effectiveDuration - fadeOutDuration;
  const opacity = interpolate(frame, [fadeOutStart, effectiveDuration], [1, 0], {
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
