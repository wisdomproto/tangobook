import React from 'react';
import { AbsoluteFill, Series, Audio, staticFile } from 'remotion';
import { StyleMorphHook } from '../components/reels/StyleMorphHook';
import { ClassicCollage } from '../components/reels/ClassicCollage';
import { NatureScene } from '../components/reels/NatureScene';
import { ClosingScene } from '../components/reels/ClosingScene';

// 광고용 릴스 — 가입·무료체험 전환. 소구점 = 세계명작 그림책 + 자연관찰.
// 구성: 시선끌기(그림체 모핑) → 세계명작 → 자연관찰 → 무료체험 CTA.
export const AD_FPS = 30;
export const AD_WIDTH = 1080;
export const AD_HEIGHT = 1920;
export const AD_DURATION = 18 * AD_FPS; // 540 frames

export const AdReel: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#FFF6EE' }}>
      <Audio src={staticFile('reels/bgm.mp3')} volume={0.55} />
      <Series>
        {/* Hook — 같은 책, 세 가지 그림체 모핑 (시선 잡기) */}
        <Series.Sequence durationInFrames={3 * AD_FPS}>
          <StyleMorphHook durationInFrames={3 * AD_FPS} />
        </Series.Sequence>
        {/* 세계명작 그림책 */}
        <Series.Sequence durationInFrames={5 * AD_FPS}>
          <ClassicCollage />
        </Series.Sequence>
        {/* 자연관찰 */}
        <Series.Sequence durationInFrames={5 * AD_FPS}>
          <NatureScene />
        </Series.Sequence>
        {/* CTA — 7일 무료 체험 + tangobook.co.kr */}
        <Series.Sequence durationInFrames={5 * AD_FPS}>
          <ClosingScene />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
