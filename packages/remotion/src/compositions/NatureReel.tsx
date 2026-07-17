import React from 'react';
import { AbsoluteFill, Audio, Series, staticFile, interpolate } from 'remotion';
import { StoryScene } from '../components/reels/storybook/StoryScene';
import { SeriesShowcase } from '../components/reels/storybook/SeriesShowcase';
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
        {props.scenes.map((sc, i) => (
          <Series.Sequence key={i} durationInFrames={durs[i]}>
            <StoryScene
              title={sc.label}
              body={sc.body}
              bodies={sc.bodies}
              imageUrls={sc.imageUrls}
              hero={i === 0}
              // 🔴 책 제목은 **전 씬 상시**. 예전엔 첫 씬에만 뒀지만(리뷰: "내내 박히면 광고 티"),
              // 제목이 곧 이 화의 주제("골고루 먹으면 무지개 힘!")라 중간부터 본 사람도 뭘 보는지
              // 알아야 한다(사용자 피드백). 헤더가 고정되니 씬이 넘어가도 프레임이 흔들리지 않는다.
              headerTitle={props.bookTitle}
            />
          </Series.Sequence>
        ))}
        <Series.Sequence durationInFrames={natureSeriesFrames(props)}>
          <SeriesShowcase
            headline={props.series.headline}
            covers={props.series.covers}
            labels={props.series.labels}
            headerTitle={props.bookTitle}
          />
        </Series.Sequence>
        <Series.Sequence durationInFrames={NATURE_CTA_SEC * REEL_FPS}>
          <Closing />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
