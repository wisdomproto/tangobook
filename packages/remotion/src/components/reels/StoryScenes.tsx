import React from 'react';
import {
  AbsoluteFill,
  Img,
  staticFile,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';

const { fontFamily } = loadFont('normal', { weights: ['700', '800'] });

const CORAL = '#FF5E3A';
const CORAL_SOFT = '#FFE4DC';

// 🔊 나레이션 바 — 읽어주는 느낌
function NarrationBars({ frame }: { frame: number }) {
  const bars = [0, 1, 2, 3, 4];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 60 }}>
      <span style={{ fontSize: 44, marginRight: 6 }}>🔊</span>
      {bars.map((b) => {
        const h = 18 + (Math.sin((frame / 5 + b) * 1.2) * 0.5 + 0.5) * 42;
        return (
          <div key={b} style={{ width: 12, height: h, borderRadius: 8, backgroundColor: CORAL }} />
        );
      })}
    </div>
  );
}

// 동화책 페이지 카드 — 삽화(풀블리드 블러 배경 + 카드) + 문장 자막 + 나레이션.
function StoryPage({
  cover,
  sentence,
  cardScale = 1,
}: {
  cover: string;
  sentence: React.ReactNode;
  cardScale?: number;
}) {
  return (
    <>
      {/* 풀블리드 블러 배경 */}
      <AbsoluteFill>
        <Img
          src={staticFile(cover)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(48px) brightness(0.55)',
            transform: 'scale(1.25)',
          }}
        />
      </AbsoluteFill>
      {/* 페이지(삽화) 카드 */}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', paddingBottom: 120 }}>
        <div
          style={{
            width: '86%',
            borderRadius: 28,
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
            transform: `scale(${cardScale})`,
          }}
        >
          <Img src={staticFile(cover)} style={{ width: '100%', display: 'block' }} />
        </div>
      </AbsoluteFill>
      {/* 문장 자막 */}
      <AbsoluteFill
        style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 300 }}
      >
        <div
          style={{
            maxWidth: '86%',
            backgroundColor: 'rgba(0,0,0,0.55)',
            borderRadius: 22,
            padding: '20px 34px',
            fontFamily,
            fontWeight: 800,
            fontSize: 50,
            color: '#fff',
            textAlign: 'center',
            lineHeight: 1.4,
            wordBreak: 'keep-all',
          }}
        >
          {sentence}
        </div>
      </AbsoluteFill>
    </>
  );
}

// ─────────── ① 동화 자체 — 명작 동화를 실감나게 읽어줘요 ───────────
export const StorybookIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 15 } });
  return (
    <AbsoluteFill style={{ backgroundColor: '#1A1A2E' }}>
      <StoryPage
        cover="reels/covers/cover-cinderella.webp"
        cardScale={0.92 + pop * 0.08}
        sentence={<>옛날, 마음씨 고운 소녀가 살았어요.</>}
      />
      {/* 상단 라벨 + 나레이션 */}
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 130 }}>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 48,
            color: '#fff',
            backgroundColor: CORAL,
            borderRadius: 999,
            padding: '14px 44px',
          }}
        >
          세계명작 동화, 읽어줘요 📖
        </div>
      </AbsoluteFill>
      <AbsoluteFill
        style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 200 }}
      >
        <NarrationBars frame={frame} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─────────── 정답 → 동화 페이지 연결 (자연스럽게) ───────────
// 게임에서 맞힌 단어가 실제로 나오는 동화 페이지 = 삽화 + 그 문장(단어 강조) + 나레이션.
export const PageLink: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // 페이지가 아래에서 부드럽게 올라오며 등장 (게임에서 이어지는 느낌)
  const rise = spring({ frame, fps, config: { damping: 16 } });
  const chipPop = spring({ frame: frame - 6, fps, config: { damping: 11 } });
  return (
    <AbsoluteFill style={{ backgroundColor: '#1A1A2E' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translateY(${(1 - rise) * 90}px)`,
          opacity: interpolate(rise, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        <StoryPage
          cover="reels/covers/cover-snow-white.webp"
          sentence={
            <>
              왕비가 빨간 <span style={{ color: '#FFC24D' }}>사과</span>를 건넸어요.
            </>
          }
        />
      </div>
      {/* 상단 "정답!" 칩 */}
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 130 }}>
        <div
          style={{
            transform: `scale(${chipPop})`,
            fontFamily,
            fontWeight: 800,
            fontSize: 48,
            color: '#fff',
            backgroundColor: '#3AA87E',
            borderRadius: 999,
            padding: '14px 44px',
          }}
        >
          ✓ 정답! 🍎 사과
        </div>
      </AbsoluteFill>
      {/* 나레이션 + 하단 카피 */}
      <AbsoluteFill
        style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 205 }}
      >
        <NarrationBars frame={frame} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 110 }}
      >
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 44,
            color: CORAL,
            backgroundColor: CORAL_SOFT,
            borderRadius: 999,
            padding: '12px 36px',
            opacity: chipPop,
          }}
        >
          그 단어가 나온 동화 장면으로 이어져요
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
