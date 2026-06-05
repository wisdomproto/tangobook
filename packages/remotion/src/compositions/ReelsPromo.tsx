import React from 'react';
import { AbsoluteFill, Series } from 'remotion';
import { StyleMorphHook } from '../components/reels/StyleMorphHook';
import { BilingualToggle } from '../components/reels/BilingualToggle';
import { NatureScene } from '../components/reels/NatureScene';
import { GamesScene } from '../components/reels/GamesScene';
import { ContentGrid } from '../components/reels/ContentGrid';
import { ClosingScene } from '../components/reels/ClosingScene';

export const REELS_FPS = 30;
export const REELS_WIDTH = 1080;
export const REELS_HEIGHT = 1920;
export const REELS_DURATION = 24 * REELS_FPS; // 720 frames

export const ReelsPromo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#FFF6EE' }}>
      <Series>
        <Series.Sequence durationInFrames={3 * REELS_FPS}>
          <StyleMorphHook durationInFrames={3 * REELS_FPS} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={5 * REELS_FPS}>
          <NatureScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={3 * REELS_FPS}>
          <BilingualToggle />
        </Series.Sequence>
        <Series.Sequence durationInFrames={4 * REELS_FPS}>
          <GamesScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={4 * REELS_FPS}>
          <ContentGrid />
        </Series.Sequence>
        <Series.Sequence durationInFrames={5 * REELS_FPS}>
          <ClosingScene />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
