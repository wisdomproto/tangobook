import React from 'react';
import { AbsoluteFill, Series } from 'remotion';
import { StyleMorphHook } from '../components/reels/StyleMorphHook';
import { ClassicCollage } from '../components/reels/ClassicCollage';
import { BilingualToggle } from '../components/reels/BilingualToggle';
import { PhonicsScene } from '../components/reels/PhonicsScene';
import { NatureScene } from '../components/reels/NatureScene';

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
        <Series.Sequence durationInFrames={4 * REELS_FPS}>
          <ClassicCollage />
        </Series.Sequence>
        <Series.Sequence durationInFrames={3 * REELS_FPS}>
          <BilingualToggle />
        </Series.Sequence>
        <Series.Sequence durationInFrames={4 * REELS_FPS}>
          <PhonicsScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={3 * REELS_FPS}>
          <NatureScene />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
