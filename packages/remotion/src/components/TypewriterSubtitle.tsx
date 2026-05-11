import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';
import type { SubtitleStyle } from '../types';

const { fontFamily } = loadFont('normal', { weights: ['700'] });

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

  // Distribute duration proportional to sentence length (character count)
  const fadeOutDuration = Math.round(0.5 * fps);
  const availableFrames = effectiveDuration - fadeOutDuration;
  const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);
  const sentenceFrames = sentences.map((s) =>
    totalChars > 0 ? Math.round((s.length / totalChars) * availableFrames) : availableFrames
  );

  // Which sentence to show based on cumulative frame boundaries
  let cumulative = 0;
  let sentenceIdx = 0;
  for (let i = 0; i < sentenceFrames.length; i++) {
    cumulative += sentenceFrames[i];
    if (frame < cumulative) {
      sentenceIdx = i;
      break;
    }
    sentenceIdx = i;
  }
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
