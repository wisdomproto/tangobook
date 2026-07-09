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
import {
  FrogPrinceReel,
  FROG_FPS,
  FROG_WIDTH,
  FROG_HEIGHT,
  FROG_DURATION,
} from './compositions/FrogPrinceReel';
import { StorybookReel } from './compositions/StorybookReel';
import {
  StorybookReelPropsSchema,
  type StorybookReelProps,
  computeReelFrames,
  REEL_FPS,
  REEL_WIDTH,
  REEL_HEIGHT,
  MORPH_LINES,
} from './data/storybook-reel';
import { AudiobookRenderProps, RESOLUTIONS } from './types';
import { calculateTotalFrames } from './utils/duration';
import { MosquitoEbookComposition } from './compositions/MosquitoEbookComposition';
import {
  EBOOK_PAGES,
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
  const total = EBOOK_PAGES.reduce(
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

// 실제 개구리 왕자(storybook-1772009873865) R2 원격 URL — 스튜디오 프리뷰 + 원격 렌더 증명.
const R2 = 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev';
const FROG_DEFAULT: StorybookReelProps = {
  bookTitle: '개구리 왕자',
  scenes: [
    {
      label: '개구리 왕자',
      body: '옛날 어느 나라에 막내 공주가 살았어요',
      imageUrls: [
        `${R2}/1772009873865-%EA%B0%9C%EA%B5%AC%EB%A6%AC%EC%99%95%EC%9E%90-cover-misc-1779584931510.webp`,
      ],
    },
    {
      label: '원작·배경',
      body: '그림 형제 동화집의 첫 번째 이야기',
      imageUrls: [
        `${R2}/1772009873865-%EA%B0%9C%EA%B5%AC%EB%A6%AC%EC%99%95%EC%9E%90-illustration-page1-1779582816728.webp`,
        `${R2}/1772009873865-%EA%B0%9C%EA%B5%AC%EB%A6%AC%EC%99%95%EC%9E%90-illustration-page2-1779584044201.webp`,
        `${R2}/1772009873865-%EA%B0%9C%EA%B5%AC%EB%A6%AC%EC%99%95%EC%9E%90-illustration-page3-1779582869387.webp`,
        `${R2}/1772009873865-%EA%B0%9C%EA%B5%AC%EB%A6%AC%EC%99%95%EC%9E%90-illustration-page4-1779582873980.webp`,
        `${R2}/1772009873865-%EA%B0%9C%EA%B5%AC%EB%A6%AC%EC%99%95%EC%9E%90-illustration-page5-1779582887346.webp`,
      ],
    },
    {
      label: '줄거리',
      body: '연못에 빠진 황금 공, 그리고 개구리와의 약속',
      imageUrls: [
        `${R2}/1772009873865-%EA%B0%9C%EA%B5%AC%EB%A6%AC%EC%99%95%EC%9E%90-illustration-page6-1779582895891.webp`,
        `${R2}/1772009873865-%EA%B0%9C%EA%B5%AC%EB%A6%AC%EC%99%95%EC%9E%90-illustration-page7-1779583046653.webp`,
        `${R2}/1772009873865-%EA%B0%9C%EA%B5%AC%EB%A6%AC%EC%99%95%EC%9E%90-illustration-page8-1779583051323.webp`,
        `${R2}/1772009873865-%EA%B0%9C%EA%B5%AC%EB%A6%AC%EC%99%95%EC%9E%90-illustration-page9-1779583384958.webp`,
        `${R2}/1772009873865-%EA%B0%9C%EA%B5%AC%EB%A6%AC%EC%99%95%EC%9E%90-illustration-page10-1779583818886.webp`,
      ],
    },
    {
      label: '교훈',
      body: '약속은 지키고, 겉모습이 아닌 마음을 보아요',
      imageUrls: [
        `${R2}/1772009873865-%EA%B0%9C%EA%B5%AC%EB%A6%AC%EC%99%95%EC%9E%90-illustration-page11-1779583107631.webp`,
        `${R2}/1772009873865-%EA%B0%9C%EA%B5%AC%EB%A6%AC%EC%99%95%EC%9E%90-illustration-page12-1779583123055.webp`,
        `${R2}/1772009873865-%EA%B0%9C%EA%B5%AC%EB%A6%AC%EC%99%95%EC%9E%90-illustration-page13-1779583130860.webp`,
        `${R2}/1772009873865-%EA%B0%9C%EA%B5%AC%EB%A6%AC%EC%99%95%EC%9E%90-illustration-page14-1779583260628.webp`,
        `${R2}/1772009873865-%EA%B0%9C%EA%B5%AC%EB%A6%AC%EC%99%95%EC%9E%90-illustration-page15-1780890652887.webp`,
      ],
    },
  ],
  styleMorph: {
    lines: MORPH_LINES,
    styles: [
      {
        url: `${R2}/1772009873865-%EA%B0%9C%EA%B5%AC%EB%A6%AC%EC%99%95%EC%9E%90-illustration-page12-1779583123055.webp`,
        label: '콜라주',
      },
      {
        url: `${R2}/1772009873865-%EA%B0%9C%EA%B5%AC%EB%A6%AC%EC%99%95%EC%9E%90-illustration-page12-1779427929742.webp`,
        label: '수채동화풍',
      },
      {
        url: `${R2}/1772009873865-%EA%B0%9C%EA%B5%AC%EB%A6%AC%EC%99%95%EC%9E%90-illustration-page12-1779840231880.webp`,
        label: '페이퍼 3D 아트',
      },
    ],
  },
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
        id="FrogPrinceReel"
        component={FrogPrinceReel}
        durationInFrames={FROG_DURATION}
        fps={FROG_FPS}
        width={FROG_WIDTH}
        height={FROG_HEIGHT}
      />
      <Composition
        id="StorybookReel"
        component={StorybookReel}
        schema={StorybookReelPropsSchema}
        durationInFrames={1170}
        fps={REEL_FPS}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        defaultProps={FROG_DEFAULT}
        calculateMetadata={({ props }) => ({ durationInFrames: computeReelFrames(props) })}
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
