import React from 'react';
import { AbsoluteFill, Audio, staticFile } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { BookWords, LineMatchGame, BlockGame, WritingGame } from '../components/reels/GameScenes';
import { VocabReveal } from '../components/reels/VocabReveal';
import { StyleMorphHook } from '../components/reels/StyleMorphHook';
import { ContentGrid } from '../components/reels/ContentGrid';
import { ClosingScene } from '../components/reels/ClosingScene';

// 광고용 릴스 — 가입·무료체험 전환. 크로스페이드로 부드럽게 이어지는 흐름.
// ① 동화책마다 배우는 단어 → ② 그 단어를 게임(그림짝·따라쓰기·블록)으로 익히고 →
// ③ 정답 맞히면 그 단어가 나온 동화 장면과 연결 → ④ 취향대로 그림체 → ⑤ 방대한 라이브러리 → ⑥ CTA.
export const AD_FPS = 30;
export const AD_WIDTH = 1080;
export const AD_HEIGHT = 1920;

const T = 20; // 전환(크로스페이드) 프레임
const STYLE_FRAMES = 110;

// 각 장면 길이(프레임). 전환이 겹치므로 총 길이 = 합 - 전환×(장면수-1).
const SCENES = {
  bookWords: 135,
  lineMatch: 105,
  writing: 105,
  block: 105,
  reveal: 150,
  style: STYLE_FRAMES,
  grid: 110,
  cta: 150,
};
const N = Object.keys(SCENES).length;
export const AD_DURATION = Object.values(SCENES).reduce((a, b) => a + b, 0) - T * (N - 1); // = 855 frames (~28.5s)

const trans = () => (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: T })}
  />
);

export const AdReel: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#FFF6EE' }}>
      <Audio src={staticFile('reels/bgm.mp3')} volume={0.55} />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENES.bookWords}>
          <BookWords />
        </TransitionSeries.Sequence>
        {trans()}
        <TransitionSeries.Sequence durationInFrames={SCENES.lineMatch}>
          <LineMatchGame />
        </TransitionSeries.Sequence>
        {trans()}
        <TransitionSeries.Sequence durationInFrames={SCENES.writing}>
          <WritingGame />
        </TransitionSeries.Sequence>
        {trans()}
        <TransitionSeries.Sequence durationInFrames={SCENES.block}>
          <BlockGame />
        </TransitionSeries.Sequence>
        {trans()}
        <TransitionSeries.Sequence durationInFrames={SCENES.reveal}>
          <VocabReveal />
        </TransitionSeries.Sequence>
        {trans()}
        <TransitionSeries.Sequence durationInFrames={SCENES.style}>
          <StyleMorphHook
            durationInFrames={SCENES.style}
            caption={'아이 취향대로\n그림체를 골라요'}
          />
        </TransitionSeries.Sequence>
        {trans()}
        <TransitionSeries.Sequence durationInFrames={SCENES.grid}>
          <ContentGrid />
        </TransitionSeries.Sequence>
        {trans()}
        <TransitionSeries.Sequence durationInFrames={SCENES.cta}>
          <ClosingScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
