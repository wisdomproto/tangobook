import React from 'react';
import { AbsoluteFill, Series, Audio, staticFile } from 'remotion';
import { ClassicCollage } from '../components/reels/ClassicCollage';
import { VocabReveal } from '../components/reels/VocabReveal';
import { StyleMorphHook } from '../components/reels/StyleMorphHook';
import { ContentGrid } from '../components/reels/ContentGrid';
import { ClosingScene } from '../components/reels/ClosingScene';

// 광고용 릴스 — 가입·무료체험 전환. 차분한 페이스.
// 스토리: ① 세계명작 동화 → ② 단어 맞히면 그 장면 리빌(어휘 학습) →
//         ③ 아이 취향대로 그림체 선택 → ④ 자연관찰까지 방대한 라이브러리 → ⑤ 무료체험 CTA.
export const AD_FPS = 30;
export const AD_WIDTH = 1080;
export const AD_HEIGHT = 1920;
export const AD_DURATION = 24 * AD_FPS; // 720 frames

export const AdReel: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#FFF6EE' }}>
      <Audio src={staticFile('reels/bgm.mp3')} volume={0.55} />
      <Series>
        {/* ① 세계명작 동화 (차분하게 표지 홀드) */}
        <Series.Sequence durationInFrames={4 * AD_FPS}>
          <ClassicCollage />
        </Series.Sequence>
        {/* ② 어휘 학습 — 단어 맞히면 그 장면이 펼쳐진다 (핵심 기능) */}
        <Series.Sequence durationInFrames={6 * AD_FPS}>
          <VocabReveal />
        </Series.Sequence>
        {/* ③ 아이 취향대로 그림체 선택 */}
        <Series.Sequence durationInFrames={5 * AD_FPS}>
          <StyleMorphHook
            durationInFrames={5 * AD_FPS}
            caption={'아이 취향대로\n그림체를 골라요'}
          />
        </Series.Sequence>
        {/* ④ 자연관찰까지, 방대한 라이브러리 */}
        <Series.Sequence durationInFrames={4 * AD_FPS}>
          <ContentGrid />
        </Series.Sequence>
        {/* ⑤ CTA — 7일 무료 체험 */}
        <Series.Sequence durationInFrames={5 * AD_FPS}>
          <ClosingScene />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
