import React from 'react';
import { AbsoluteFill, Audio, Series, staticFile, interpolate } from 'remotion';
import { StoryScene } from '../components/reels/storybook/StoryScene';
import { SeriesShowcase } from '../components/reels/storybook/SeriesShowcase';
import { Closing } from '../components/reels/storybook/Closing';
import {
  NatureReelProps,
  natureSceneDurations,
  computeNatureReelFrames,
  NATURE_SERIES_SEC,
  NATURE_CTA_SEC,
  REEL_FPS,
  BGM_SRC,
} from '../data/nature-reel';

export const NatureReel: React.FC<NatureReelProps> = (props) => {
  const total = computeNatureReelFrames(props);
  const durs = natureSceneDurations(props);
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
        <Series.Sequence durationInFrames={NATURE_SERIES_SEC * REEL_FPS}>
          <SeriesShowcase
            headline={props.series.headline}
            covers={props.series.covers}
            labels={props.series.labels}
          />
        </Series.Sequence>
        <Series.Sequence durationInFrames={NATURE_CTA_SEC * REEL_FPS}>
          <Closing />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
