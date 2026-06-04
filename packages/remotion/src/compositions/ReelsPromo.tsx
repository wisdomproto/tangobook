import React from 'react';
import { AbsoluteFill } from 'remotion';

export const REELS_FPS = 30;
export const REELS_WIDTH = 1080;
export const REELS_HEIGHT = 1920;
export const REELS_DURATION = 22 * REELS_FPS; // 660 frames

export const ReelsPromo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#FFF6EE' }}>
      {/* scenes added in later tasks */}
    </AbsoluteFill>
  );
};
