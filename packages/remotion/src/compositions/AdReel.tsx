import React from 'react';
import { AbsoluteFill, Series, Audio, staticFile } from 'remotion';
import { BookWords, LineMatchGame, BlockGame, WritingGame } from '../components/reels/GameScenes';
import { VocabReveal } from '../components/reels/VocabReveal';
import { StyleMorphHook } from '../components/reels/StyleMorphHook';
import { ContentGrid } from '../components/reels/ContentGrid';
import { ClosingScene } from '../components/reels/ClosingScene';

// 광고용 릴스 — 가입·무료체험 전환. 차분한 페이스.
// 스토리(사용자 흐름): ① 동화책마다 배우는 단어가 있고 → ② 그 단어를 게임(그림짝·따라쓰기·블록)으로
//   익히며 → ③ 정답을 맞히면 그 단어가 나온 동화 장면과 연결돼 펼쳐진다 →
//   ④ 취향대로 그림체 선택 → ⑤ 자연관찰까지 방대한 라이브러리 → ⑥ 7일 무료체험 CTA.
export const AD_FPS = 30;
export const AD_WIDTH = 1080;
export const AD_HEIGHT = 1920;
export const AD_DURATION = 720; // 24s

const STYLE_FRAMES = 84;

export const AdReel: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#FFF6EE' }}>
      <Audio src={staticFile('reels/bgm.mp3')} volume={0.55} />
      <Series>
        {/* ① 이 동화책에서 배우는 단어 */}
        <Series.Sequence durationInFrames={111}>
          <BookWords />
        </Series.Sequence>
        {/* ② 그 단어를 게임으로 익힌다 — 그림짝 · 따라쓰기 · 블록 */}
        <Series.Sequence durationInFrames={69}>
          <LineMatchGame />
        </Series.Sequence>
        <Series.Sequence durationInFrames={69}>
          <WritingGame />
        </Series.Sequence>
        <Series.Sequence durationInFrames={69}>
          <BlockGame />
        </Series.Sequence>
        {/* ③ 정답을 맞히면 그 단어가 나온 동화 장면이 펼쳐진다 (핵심 연결) */}
        <Series.Sequence durationInFrames={111}>
          <VocabReveal />
        </Series.Sequence>
        {/* ④ 취향대로 그림체 선택 */}
        <Series.Sequence durationInFrames={STYLE_FRAMES}>
          <StyleMorphHook
            durationInFrames={STYLE_FRAMES}
            caption={'아이 취향대로\n그림체를 골라요'}
          />
        </Series.Sequence>
        {/* ⑤ 자연관찰까지, 방대한 라이브러리 */}
        <Series.Sequence durationInFrames={84}>
          <ContentGrid />
        </Series.Sequence>
        {/* ⑥ CTA — 7일 무료 체험 */}
        <Series.Sequence durationInFrames={123}>
          <ClosingScene />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
