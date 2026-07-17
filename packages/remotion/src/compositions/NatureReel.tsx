import React from 'react';
import { AbsoluteFill, Audio, Series, staticFile, interpolate } from 'remotion';
import { StoryScene } from '../components/reels/storybook/StoryScene';
import { SeriesShowcase } from '../components/reels/storybook/SeriesShowcase';
import { LifeStoryScene } from '../components/reels/storybook/LifeStoryScene';
import { LifeSeriesShowcase } from '../components/reels/storybook/LifeSeriesShowcase';
import { Closing } from '../components/reels/storybook/Closing';
import {
  NatureReelProps,
  natureSceneDurations,
  computeNatureReelFrames,
  natureSeriesFrames,
  NATURE_CTA_SEC,
  REEL_FPS,
  pickBgm,
} from '../data/nature-reel';

export const NatureReel: React.FC<NatureReelProps> = (props) => {
  const total = computeNatureReelFrames(props);
  const durs = natureSceneDurations(props);
  const isLife = /생활동화/.test(props.category);
  return (
    <AbsoluteFill style={{ backgroundColor: '#1A1310' }}>
      <Audio
        src={staticFile(pickBgm(props.bookTitle))}
        loop
        volume={(f) =>
          interpolate(f, [0, 15, total - 40, total], [0, 0.55, 0.55, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
        }
      />
      <Series>
        {/* 🔴 씬 컴포넌트는 시리즈별로 다르다 — 생활동화는 "책 미리보기"(자막·그림 1:1 + 브랜드
            프레임)이고, 자연도감은 "삽화 여러 장 순환"이다. 한 컴포넌트로 합치면 자연 릴스에서
            문장 수를 넘는 삽화가 안 나온다. */}
        {props.scenes.map((sc, i) =>
          isLife ? (
            <Series.Sequence key={i} durationInFrames={durs[i]}>
              <LifeStoryScene
                title={sc.label}
                body={sc.body}
                bodies={sc.bodies}
                imageUrls={sc.imageUrls}
                hero={i === 0}
                headerTitle={props.bookTitle}
              />
            </Series.Sequence>
          ) : (
            <Series.Sequence key={i} durationInFrames={durs[i]}>
              <StoryScene title={sc.label} body={sc.body} imageUrls={sc.imageUrls} hero={i === 0} />
            </Series.Sequence>
          )
        )}
        <Series.Sequence durationInFrames={natureSeriesFrames(props)}>
          {isLife ? (
            <LifeSeriesShowcase
              headline={props.series.headline}
              covers={props.series.covers}
              headerTitle={props.bookTitle}
            />
          ) : (
            <SeriesShowcase
              headline={props.series.headline}
              covers={props.series.covers}
              labels={props.series.labels ?? []}
            />
          )}
        </Series.Sequence>
        <Series.Sequence durationInFrames={NATURE_CTA_SEC * REEL_FPS}>
          <Closing />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
