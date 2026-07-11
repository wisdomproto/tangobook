import React from 'react';
import { AbsoluteFill, Audio, staticFile } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { BookWords, LineMatchGame, BlockGame, WritingGame } from '../components/reels/GameScenes';
import { StorybookIntro, PageLink } from '../components/reels/StoryScenes';
import { StyleMorphHook } from '../components/reels/StyleMorphHook';
import { ContentGrid } from '../components/reels/ContentGrid';
import { NatureScene } from '../components/reels/NatureScene';
import { ClosingScene } from '../components/reels/ClosingScene';

// 광고용 릴스 — 가입·무료체험 전환. 크로스페이드로 자연스럽게 이어지는 흐름.
// ① 명작 동화를 읽어주는 경험 → ② 이 책에서 배우는 단어 → ③ 그 단어를 게임으로(블록·글씨·그림짝)
// → ④ 정답을 맞히면 그 단어가 나온 동화 페이지로 이어짐 →
// ⑤ 동화책이 많고 → ⑥ 각 책은 여러 그림체 → ⑦ 자연관찰까지 → ⑧ 7일 무료체험 CTA.
export const AD_FPS = 30;
export const AD_WIDTH = 1080;
export const AD_HEIGHT = 1920;

const T = 20; // 크로스페이드 프레임
const STYLE_FRAMES = 100;

const SCENES = {
  intro: 135, // 동화 읽기
  bookWords: 110, // 배우는 단어
  block: 140, // 블록 (제대로)
  writing: 140, // 글씨 (제대로)
  lineMatch: 100, // 그림짝
  pageLink: 150, // 정답 → 동화 페이지 연결
  grid: 110, // 동화책 많다
  style: STYLE_FRAMES, // 여러 그림체
  nature: 110, // 자연관찰
  cta: 150, // CTA
};
const N = Object.keys(SCENES).length;
export const AD_DURATION = Object.values(SCENES).reduce((a, b) => a + b, 0) - T * (N - 1);

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
        <TransitionSeries.Sequence durationInFrames={SCENES.intro}>
          <StorybookIntro />
        </TransitionSeries.Sequence>
        {trans()}
        <TransitionSeries.Sequence durationInFrames={SCENES.bookWords}>
          <BookWords />
        </TransitionSeries.Sequence>
        {trans()}
        <TransitionSeries.Sequence durationInFrames={SCENES.block}>
          <BlockGame />
        </TransitionSeries.Sequence>
        {trans()}
        <TransitionSeries.Sequence durationInFrames={SCENES.writing}>
          <WritingGame />
        </TransitionSeries.Sequence>
        {trans()}
        <TransitionSeries.Sequence durationInFrames={SCENES.lineMatch}>
          <LineMatchGame />
        </TransitionSeries.Sequence>
        {trans()}
        <TransitionSeries.Sequence durationInFrames={SCENES.pageLink}>
          <PageLink />
        </TransitionSeries.Sequence>
        {trans()}
        <TransitionSeries.Sequence durationInFrames={SCENES.grid}>
          <ContentGrid />
        </TransitionSeries.Sequence>
        {trans()}
        <TransitionSeries.Sequence durationInFrames={SCENES.style}>
          <StyleMorphHook durationInFrames={SCENES.style} caption={'한 권을\n여러 그림체로'} />
        </TransitionSeries.Sequence>
        {trans()}
        <TransitionSeries.Sequence durationInFrames={SCENES.nature}>
          <NatureScene />
        </TransitionSeries.Sequence>
        {trans()}
        <TransitionSeries.Sequence durationInFrames={SCENES.cta}>
          <ClosingScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
