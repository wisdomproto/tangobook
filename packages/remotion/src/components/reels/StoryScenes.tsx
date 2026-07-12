import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  Series,
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

// ─────────── ⓪ 오프닝 감정 훅 — 부모 공감(밤마다 읽어주기, 힘들죠) ───────────
export const OpeningHook: React.FC = () => {
  const frame = useCurrentFrame();
  // 잔잔한 켄번즈 줌
  const zoom = interpolate(frame, [0, 120], [1.04, 1.12], { extrapolateRight: 'clamp' });
  const line1 = interpolate(frame, [6, 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const line1Y = interpolate(frame, [6, 22], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const line2 = interpolate(frame, [52, 68], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const line2Y = interpolate(frame, [52, 68], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{ backgroundColor: '#141019' }}>
      {/* 밤 잠자리 — 엄마가 아이에게 그림책 읽어주는 실제 감성 이미지 */}
      <AbsoluteFill>
        <Img
          src={staticFile('reels/hook-bedtime.webp')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${zoom})`,
          }}
        />
      </AbsoluteFill>
      {/* 하단 스크림 — 자막 가독성 */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(15,12,20,0) 42%, rgba(15,12,20,0.72) 74%, rgba(15,12,20,0.92) 100%)',
        }}
      />
      {/* 공감 카피 (하단) */}
      <AbsoluteFill
        style={{
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 26,
          paddingBottom: 190,
        }}
      >
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 72,
            color: '#fff',
            textAlign: 'center',
            lineHeight: 1.35,
            whiteSpace: 'pre-line',
            wordBreak: 'keep-all',
            opacity: line1,
            transform: `translateY(${line1Y}px)`,
            textShadow: '0 4px 22px rgba(0,0,0,0.75)',
          }}
        >
          {'"엄마, 한 번만\n더 읽어줘…"'}
        </div>
        <div
          style={{
            fontFamily,
            fontWeight: 700,
            fontSize: 50,
            color: '#FFD9C7',
            textAlign: 'center',
            lineHeight: 1.4,
            whiteSpace: 'pre-line',
            wordBreak: 'keep-all',
            opacity: line2,
            transform: `translateY(${line2Y}px)`,
            textShadow: '0 3px 16px rgba(0,0,0,0.7)',
          }}
        >
          {'매일 밤, 목이 쉬도록\n읽어주고 계신가요?'}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─────────── ① 동화 자체 — 명작 동화를 실감나게 읽어줘요 ───────────
export const StorybookIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 15 } });
  return (
    <AbsoluteFill style={{ backgroundColor: '#1A1A2E' }}>
      <StoryPage
        cover="reels/sw-scene-intro.webp"
        cardScale={0.92 + pop * 0.08}
        sentence={<>옛날, 마음씨 고운 백설공주가 살았어요.</>}
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
          한글도, 영어도 읽어줘요 📖
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

// ─────────── ① 탱고북이 여러 페이지를 실제로 읽어준다 ───────────
// 자막 문장 = 나레이션 음성(같은 Leda TTS) 100% 일치. 페이지 길이 = 음성 길이에 맞춤.
const READ_PAGES = [
  {
    img: 'reels/read-p1.webp',
    audio: 'reels/audio/page1-ko.mp3', // 실제 한글 나레이션(첫 문장) 4.56s
    text: '옛날 아주 먼 옛날, 피부가 눈처럼 하얀\n백설공주가 살았어요.',
    frames: 146,
  },
  {
    img: 'reels/read-p2.webp',
    audio: 'reels/audio/page2-en.mp3', // 실제 영어 나레이션(첫 문장) 4.97s
    text: 'The new queen had a magical mirror\nthat could answer any question.',
    frames: 156,
  },
];
export const READING_TOTAL = READ_PAGES.reduce((a, p) => a + p.frames, 0); // 248

function ReadingPage({ page }: { page: (typeof READ_PAGES)[number] }) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: '#1A1A2E' }}>
      <StoryPage cover={page.img} sentence={page.text} />
      <AbsoluteFill
        style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 200 }}
      >
        <NarrationBars frame={frame} />
      </AbsoluteFill>
      <Audio src={staticFile(page.audio)} />
    </AbsoluteFill>
  );
}

export const StorybookReading: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#1A1A2E' }}>
      <Series>
        {READ_PAGES.map((p, i) => (
          <Series.Sequence key={i} durationInFrames={p.frames}>
            <ReadingPage page={p} />
          </Series.Sequence>
        ))}
      </Series>
      {/* 상단 라벨 (항상 표시) */}
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 130, pointerEvents: 'none' }}>
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
          한글도, 영어도 읽어줘요 📖
        </div>
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
          cover="reels/sw-scene-apple.webp"
          sentence={
            <>
              예쁜 아가씨, 여기 아주 맛있는
              <br />
              빨간 <span style={{ color: '#FFC24D' }}>사과</span>가 있답니다.
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
          방금 배운 단어가, 동화 속에서 다시 살아나요
        </div>
      </AbsoluteFill>

      {/* 실제 동화책 9쪽 나레이션 (사과 장면) */}
      <Sequence from={8}>
        <Audio src={staticFile('reels/audio/page9-narration-trim.mp3')} />
      </Sequence>
    </AbsoluteFill>
  );
};
