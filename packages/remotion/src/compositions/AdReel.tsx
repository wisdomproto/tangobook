import React from 'react';
import { AbsoluteFill, Series, Audio, staticFile } from 'remotion';
import { ClassicCollage } from '../components/reels/ClassicCollage';
import { LineMatchGame, BlockGame, WritingGame } from '../components/reels/GameScenes';
import { VocabReveal } from '../components/reels/VocabReveal';
import { StyleMorphHook } from '../components/reels/StyleMorphHook';
import { ContentGrid } from '../components/reels/ContentGrid';
import { ClosingScene } from '../components/reels/ClosingScene';

// 광고용 릴스 — 가입·무료체험 전환. 차분한 페이스.
// 스토리: ① 세계명작 동화 → ② 책마다 3가지 놀이(그림짝·따라쓰기·블록) →
//         ③ 단어 맞히면 그 장면이 펼쳐진다 → ④ 취향대로 그림체 선택 →
//         ⑤ 자연관찰까지 방대한 라이브러리 → ⑥ 7일 무료체험 CTA.
export const AD_FPS = 30;
export const AD_WIDTH = 1080;
export const AD_HEIGHT = 1920;
export const AD_DURATION = 24 * AD_FPS; // 720 frames

export const AdReel: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#FFF6EE' }}>
      <Audio src={staticFile('reels/bgm.mp3')} volume={0.55} />
      <Series>
        {/* ① 세계명작 동화 */}
        <Series.Sequence durationInFrames={Math.round(2.5 * AD_FPS)}>
          <ClassicCollage />
        </Series.Sequence>
        {/* ② 책마다 놀이 3종 — 그림짝 · 따라쓰기 · 블록 */}
        <Series.Sequence durationInFrames={Math.round(2.5 * AD_FPS)}>
          <LineMatchGame />
        </Series.Sequence>
        <Series.Sequence durationInFrames={Math.round(2.5 * AD_FPS)}>
          <WritingGame />
        </Series.Sequence>
        <Series.Sequence durationInFrames={Math.round(2.5 * AD_FPS)}>
          <BlockGame />
        </Series.Sequence>
        {/* ③ 단어 맞히면 그 장면이 펼쳐진다 (핵심 payoff) */}
        <Series.Sequence durationInFrames={4 * AD_FPS}>
          <VocabReveal />
        </Series.Sequence>
        {/* ④ 취향대로 그림체 선택 */}
        <Series.Sequence durationInFrames={3 * AD_FPS}>
          <StyleMorphHook
            durationInFrames={3 * AD_FPS}
            caption={'아이 취향대로\n그림체를 골라요'}
          />
        </Series.Sequence>
        {/* ⑤ 자연관찰까지, 방대한 라이브러리 */}
        <Series.Sequence durationInFrames={3 * AD_FPS}>
          <ContentGrid />
        </Series.Sequence>
        {/* ⑥ CTA — 7일 무료 체험 */}
        <Series.Sequence durationInFrames={4 * AD_FPS}>
          <ClosingScene />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
