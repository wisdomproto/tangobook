import React from 'react';
import { AbsoluteFill, Series } from 'remotion';
import { StyleMorphHook } from '../components/reels/StyleMorphHook';

export const REELS_FPS = 30;
export const REELS_WIDTH = 1080;
export const REELS_HEIGHT = 1920;
export const REELS_DURATION = 22 * REELS_FPS; // 660 frames

export const ReelsPromo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#FFF6EE' }}>
      <Series>
        <Series.Sequence durationInFrames={3 * REELS_FPS}>
          <StyleMorphHook durationInFrames={3 * REELS_FPS} />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
