import React from 'react';
import { AbsoluteFill, Audio, Series, staticFile, interpolate } from 'remotion';
import { FrogStoryScene } from '../components/reels/frog/FrogStoryScene';
import { FrogStyleShowcase } from '../components/reels/frog/FrogStyleShowcase';
import { FrogClosing } from '../components/reels/frog/FrogClosing';
import {
  FROG_SCENES,
  FROG_STYLE_SHOWCASE,
  FROG_CTA,
  FROG_BGM,
  FROG_FPS,
  FROG_WIDTH,
  FROG_HEIGHT,
  FROG_DURATION,
} from '../data/frog-reel';

export { FROG_FPS, FROG_WIDTH, FROG_HEIGHT, FROG_DURATION };

/**
 * 개구리 왕자 릴스 (9:16 · 39초).
 * 마케팅 스토리보드(1772009873865) 기반 + 실제 동화책 삽화.
 * 구성: 훅 → 원작 → 줄거리 → 교훈 → 그림체 모핑 → CTA(로고). 경쾌한 BGM(루프).
 */
export const FrogPrinceReel: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#1A1310' }}>
      {/* 배경음악(30초 루프): 페이드 인/아웃 */}
      <Audio
        src={staticFile(FROG_BGM)}
        loop
        volume={(f) =>
          interpolate(f, [0, 15, FROG_DURATION - 40, FROG_DURATION], [0, 0.55, 0.55, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
        }
      />
      <Series>
        {FROG_SCENES.map((sc, i) => (
          <Series.Sequence key={sc.label} durationInFrames={sc.durationSec * FROG_FPS}>
            <FrogStoryScene title={sc.label} body={sc.caption} images={sc.images} hero={i === 0} />
          </Series.Sequence>
        ))}
        <Series.Sequence durationInFrames={FROG_STYLE_SHOWCASE.durationSec * FROG_FPS}>
          <FrogStyleShowcase />
        </Series.Sequence>
        <Series.Sequence durationInFrames={FROG_CTA.cardSec * FROG_FPS}>
          <FrogClosing />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
