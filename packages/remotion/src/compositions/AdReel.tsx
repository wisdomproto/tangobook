import React from 'react';
import { AbsoluteFill, Audio, staticFile } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { BookWords, LineMatchGame, BlockGame, WritingGame } from '../components/reels/GameScenes';
import { OpeningHook, StorybookIntro, PageLink } from '../components/reels/StoryScenes';
import { StyleMorphHook } from '../components/reels/StyleMorphHook';
import { ContentGrid } from '../components/reels/ContentGrid';
import { ClosingScene } from '../components/reels/ClosingScene';

// 광고용 릴스 — 가입·무료체험 전환. 감정 아크로 재구성.
// ⓪ 공감(밤마다 읽어주기 힘들죠) → ① 해결(탱고북이 대신 읽어줘요) → ② 배우는 단어 →
// ③ 증거: 게임으로 스스로 배운다(블록·글씨·그림짝) → ④ 클라이맥스: 배운 단어가 동화 속에서 되살아남
// → ⑤ 신뢰: 명작+자연관찰, 여러 그림체 → ⑥ CTA.
export const AD_FPS = 30;
export const AD_WIDTH = 1080;
export const AD_HEIGHT = 1920;

const T = 14; // 크로스페이드(짧게 — 자막 겹침 최소화)
const STYLE_FRAMES = 90;

const SCENES = {
  hook: 120, // 공감 훅
  intro: 100, // 탱고북이 읽어줌
  bookWords: 95, // 배우는 단어
  block: 118, // 블록(정답 삽화 힌트)
  writing: 100, // 글씨
  lineMatch: 88, // 그림짝
  pageLink: 145, // 클라이맥스 — 단어가 동화 속으로
  grid: 100, // 명작+자연관찰
  style: STYLE_FRAMES, // 여러 그림체
  cta: 145, // CTA
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
        <TransitionSeries.Sequence durationInFrames={SCENES.hook}>
          <OpeningHook />
        </TransitionSeries.Sequence>
        {trans()}
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
        <TransitionSeries.Sequence durationInFrames={SCENES.cta}>
          <ClosingScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
