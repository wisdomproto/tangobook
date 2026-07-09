import React from 'react';
import { AbsoluteFill, Audio, Series, staticFile, interpolate } from 'remotion';
import { StoryScene } from '../components/reels/storybook/StoryScene';
import { StyleShowcase } from '../components/reels/storybook/StyleShowcase';
import { Closing } from '../components/reels/storybook/Closing';
import {
  StorybookReelProps,
  sceneDurations,
  MORPH_SEC,
  CTA_SEC,
  REEL_FPS,
  BGM_SRC,
  computeReelFrames,
} from '../data/storybook-reel';

export const StorybookReel: React.FC<StorybookReelProps> = (props) => {
  const total = computeReelFrames(props);
  const durs = sceneDurations(props);
  return (
    <AbsoluteFill style={{ backgroundColor: '#1A1310' }}>
      <Audio
        src={staticFile(BGM_SRC)}
        loop
        volume={(f) =>
          interpolate(f, [0, 15, total - 40, total], [0, 0.55, 0.55, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
        }
      />
      <Series>
        {props.scenes.map((sc, i) => (
          <Series.Sequence key={i} durationInFrames={durs[i]}>
            <StoryScene title={sc.label} body={sc.body} imageUrls={sc.imageUrls} hero={i === 0} />
          </Series.Sequence>
        ))}
        {props.styleMorph && (
          <Series.Sequence durationInFrames={MORPH_SEC * REEL_FPS}>
            <StyleShowcase
              title="다양한 그림체로"
              lines={props.styleMorph.lines}
              styles={props.styleMorph.styles}
            />
          </Series.Sequence>
        )}
        <Series.Sequence durationInFrames={CTA_SEC * REEL_FPS}>
          <Closing />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
