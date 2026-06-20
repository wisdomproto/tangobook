import React from 'react';
import { Composition } from 'remotion';
import type { CalculateMetadataFunction } from 'remotion';
import { AudiobookComposition } from './compositions/AudiobookComposition';
import { RunningDog } from './components/RunningDog';
import {
  ReelsPromo,
  REELS_FPS,
  REELS_WIDTH,
  REELS_HEIGHT,
  REELS_DURATION,
} from './compositions/ReelsPromo';
import { AudiobookRenderProps, RESOLUTIONS } from './types';
import { calculateTotalFrames } from './utils/duration';
import { MosquitoEbookComposition } from './compositions/MosquitoEbookComposition';
import {
  MOSQUITO_PAGES,
  EBOOK_WIDTH,
  EBOOK_HEIGHT,
  EBOOK_FPS,
  type EbookLang,
} from './data/mosquito-ebook';
import { pageDurationFrames } from './utils/ebook-timing';

const calculateMetadata: CalculateMetadataFunction<AudiobookRenderProps> = async ({ props }) => {
  const fps = props.fps ?? 30;
  const totalFrames = calculateTotalFrames(props);
  const resolution = RESOLUTIONS[props.aspectRatio] ?? RESOLUTIONS['16:9'];

  return {
    durationInFrames: totalFrames,
    fps,
    width: resolution.width,
    height: resolution.height,
  };
};

const calcMosquito: CalculateMetadataFunction<{ lang: EbookLang; debugCoords?: boolean }> = ({
  props,
}) => {
  const total = MOSQUITO_PAGES.reduce(
    (s, p) => s + pageDurationFrames(p.ttsDurationSec[props.lang]),
    0
  );
  return {
    durationInFrames: Math.max(1, total),
    fps: EBOOK_FPS,
    width: EBOOK_WIDTH,
    height: EBOOK_HEIGHT,
  };
};

const defaultProps: AudiobookRenderProps = {
  slides: [{ imageUrl: 'https://placehold.co/1280x720', subtitleText: '샘플 자막' }],
  aspectRatio: '16:9',
  subtitleStyle: {
    fontSize: 24,
    color: '#ffffff',
    backgroundColor: '#00000080',
    position: 'bottom',
  },
  enableParticles: true,
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Audiobook"
        component={AudiobookComposition}
        durationInFrames={300}
        fps={30}
        width={1280}
        height={720}
        defaultProps={defaultProps}
        calculateMetadata={calculateMetadata}
      />
      <Composition
        id="RunningDog"
        component={RunningDog}
        durationInFrames={300}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          speed: 4,
          groundColor: '#4a7c59',
          skyColor: '#87CEEB',
          dogColor: '#8B4513',
        }}
      />
      <Composition
        id="ReelsPromo"
        component={ReelsPromo}
        durationInFrames={REELS_DURATION}
        fps={REELS_FPS}
        width={REELS_WIDTH}
        height={REELS_HEIGHT}
      />
      <Composition
        id="MosquitoEbook"
        component={MosquitoEbookComposition}
        durationInFrames={300}
        fps={EBOOK_FPS}
        width={EBOOK_WIDTH}
        height={EBOOK_HEIGHT}
        defaultProps={{ lang: 'ko' as EbookLang, debugCoords: false }}
        calculateMetadata={calcMosquito}
      />
    </>
  );
};
