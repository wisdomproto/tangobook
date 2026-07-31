import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  staticFile,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';
import { SparkleParticles } from '../components/SparkleParticles';

// 광고 릴스 V2 — docs/marketing/drafts/ad-reel-2026-07-28-plan.md 사양 그대로.
// 9:16 · 1080×1920 · 30fps · 총 741프레임(24.7초).
// 기존 AdReel/components/reels 는 라이브 릴스와 얽혀 있어 건드리지 않는다.

const { fontFamily } = loadFont('normal', { weights: ['700', '800'] });

export const ADV2_FPS = 30;
export const ADV2_WIDTH = 1080;
export const ADV2_HEIGHT = 1920;
export const ADV2_DURATION = 741;

const CORAL = '#FF5E3A';
const CORAL_SOFT = '#FFE4DC';
const CREAM = '#FFF6EE';
const INK = '#2B2B2B';
const GREEN = '#2FA875';

const C = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// 자막은 각 씬이 끝나기 0.15초(4.5f) 전에 사라진다.
const tail = (frame: number, dur: number) => interpolate(frame, [dur - 7.5, dur - 4.5], [1, 0], C);

const BlurBg: React.FC<{ src: string }> = ({ src }) => (
  <AbsoluteFill style={{ backgroundColor: CREAM }}>
    <Img
      src={staticFile(src)}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        filter: 'blur(48px) brightness(0.75)',
        transform: 'scale(1.2)',
      }}
    />
  </AbsoluteFill>
);

const Pill: React.FC<{ text: string; opacity?: number; color?: string; bg?: string }> = ({
  text,
  opacity = 1,
  color = CORAL,
  bg = '#fff',
}) => (
  <div
    style={{
      fontFamily,
      fontWeight: 800,
      fontSize: 44,
      color,
      backgroundColor: bg,
      borderRadius: 999,
      padding: '18px 44px',
      opacity,
      wordBreak: 'keep-all',
      boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
    }}
  >
    {text}
  </div>
);

// ── S1 ─────────────────────────────────────────────────────────────────────
const MORPH = ['reels/morph-watercolor.webp', 'reels/morph-paper.webp', 'reels/morph-collage.webp'];

const S1: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, dur], [1, 1.06], C);
  const capUp = interpolate(frame, [10.5, 21], [50, 0], C);
  const capOp = interpolate(frame, [10.5, 21], [0, 1], C) * tail(frame, dur);
  return (
    <AbsoluteFill>
      <BlurBg src={MORPH[0]} />
      {MORPH.map((src, i) => (
        <AbsoluteFill
          key={src}
          style={{
            opacity:
              i === 0 ? 1 : interpolate(frame, [i * 22.5 - 2.25, i * 22.5 + 2.25], [0, 1], C),
          }}
        >
          <Img
            src={staticFile(src)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transform: `scale(${scale})`,
            }}
          />
        </AbsoluteFill>
      ))}
      <AbsoluteFill
        style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 200 }}
      >
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 74,
            color: '#fff',
            textAlign: 'center',
            lineHeight: 1.3,
            wordBreak: 'keep-all',
            maxWidth: 900,
            textShadow: '0 6px 24px rgba(0,0,0,0.65)',
            transform: `translateY(${capUp}px)`,
            opacity: capOp,
          }}
        >
          매일 같은 책만 읽어달라고 하죠
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── S2·S3 공통 ──────────────────────────────────────────────────────────────
const SEG = 200;

const LangPill: React.FC<{ shift: number }> = ({ shift }) => (
  <div
    style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: 999,
      padding: '14px 34px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: 26 + shift * SEG,
        top: 12,
        width: SEG,
        height: 68,
        borderRadius: 999,
        backgroundColor: CORAL,
      }}
    />
    {['한글도,', '영어도'].map((w, i) => (
      <div
        key={w}
        style={{
          position: 'relative',
          width: SEG,
          textAlign: 'center',
          fontFamily,
          fontWeight: 800,
          fontSize: 42,
          color: i === 0 ? (shift < 0.5 ? '#fff' : INK) : shift < 0.5 ? INK : '#fff',
        }}
      >
        {w}
      </div>
    ))}
    <div
      style={{
        position: 'relative',
        fontFamily,
        fontWeight: 800,
        fontSize: 42,
        color: INK,
        paddingLeft: 16,
        wordBreak: 'keep-all',
      }}
    >
      읽어줘요
    </div>
  </div>
);

const VoiceBars: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: 'flex', gap: 18, alignItems: 'flex-end', height: 110 }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const h = 28 + 78 * Math.abs(Math.sin(frame * 0.32 + i * 1.1));
        return (
          <div
            key={i}
            style={{ width: 24, height: h, borderRadius: 999, backgroundColor: CORAL }}
          />
        );
      })}
    </div>
  );
};

const ReadScene: React.FC<{ dur: number; img: string; text: string; shift: number }> = ({
  dur,
  img,
  text,
  shift,
}) => {
  const frame = useCurrentFrame();
  const t = tail(frame, dur);
  return (
    <AbsoluteFill>
      <BlurBg src={img} />
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 140 }}>
        <div style={{ opacity: t }}>
          <LangPill shift={shift} />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: 40,
            padding: 22,
            boxShadow: '0 24px 60px rgba(0,0,0,0.28)',
            marginTop: -80,
          }}
        >
          <Img src={staticFile(img)} style={{ width: 880, borderRadius: 24, display: 'block' }} />
        </div>
        <div style={{ marginTop: 46 }}>
          <VoiceBars />
        </div>
      </AbsoluteFill>
      <AbsoluteFill
        style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 190 }}
      >
        <div
          style={{
            backgroundColor: 'rgba(0,0,0,0.62)',
            borderRadius: 28,
            padding: '26px 40px',
            maxWidth: 900,
            fontFamily,
            fontWeight: 700,
            fontSize: 52,
            color: '#fff',
            textAlign: 'center',
            lineHeight: 1.35,
            wordBreak: 'keep-all',
            opacity: t,
          }}
        >
          {text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── S4 ─────────────────────────────────────────────────────────────────────
const WORDS = [
  { file: 'apple', label: '사과' },
  { file: 'mirror', label: '거울' },
  { file: 'forest', label: '숲' },
  { file: 'castle', label: '성' },
  { file: 'bed', label: '침대' },
  { file: 'house', label: '집' },
];

const S4: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = tail(frame, dur);
  return (
    <AbsoluteFill style={{ backgroundColor: CREAM }}>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 110 }}>
        <Pill text="책에 나온 단어가 그대로 게임이 돼요" opacity={t} />
        <Img
          src={staticFile('reels/sw-scene-intro.webp')}
          style={{
            width: 420,
            borderRadius: 22,
            marginTop: 40,
            boxShadow: '0 16px 40px rgba(0,0,0,0.2)',
          }}
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '440px 440px',
            gap: 30,
            marginTop: 54,
          }}
        >
          {WORDS.map((w, i) => {
            const pop = spring({ frame: frame - i * 2.1, fps, config: { damping: 12 } });
            return (
              <div
                key={w.file}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 28,
                  padding: 16,
                  boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                  transform: `scale(${pop})`,
                  opacity: pop,
                }}
              >
                <Img
                  src={staticFile(`reels/words/${w.file}.webp`)}
                  style={{ width: '100%', borderRadius: 18, display: 'block' }}
                />
                <div
                  style={{
                    fontFamily,
                    fontWeight: 800,
                    fontSize: 46,
                    color: INK,
                    textAlign: 'center',
                    marginTop: 12,
                  }}
                >
                  {w.label}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── S5 ─────────────────────────────────────────────────────────────────────
const MATCH = [
  { img: 'apple', label: '사과', right: 2 },
  { img: 'mirror', label: '거울', right: 0 },
  { img: 'forest', label: '숲', right: 1 },
];
const RIGHT_LABELS = ['거울', '숲', '사과'];
const ROW_Y = [640, 960, 1280];

const S5: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const t = tail(frame, dur);
  return (
    <AbsoluteFill style={{ backgroundColor: CREAM }}>
      {MATCH.map((m, i) => (
        <div
          key={m.img}
          style={{
            position: 'absolute',
            left: 90,
            top: ROW_Y[i] - 100,
            width: 330,
            backgroundColor: '#fff',
            borderRadius: 26,
            padding: 14,
            boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
          }}
        >
          <Img
            src={staticFile(`reels/words/${m.img}.webp`)}
            style={{ width: '100%', borderRadius: 16, display: 'block' }}
          />
        </div>
      ))}

      {RIGHT_LABELS.map((label, i) => (
        <div
          key={label}
          style={{
            position: 'absolute',
            right: 90,
            top: ROW_Y[i] - 60,
            width: 300,
            height: 120,
            backgroundColor: '#fff',
            borderRadius: 26,
            boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily,
            fontWeight: 800,
            fontSize: 56,
            color: INK,
          }}
        >
          {label}
        </div>
      ))}

      <AbsoluteFill>
        <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
          {MATCH.map((m, i) => {
            const start = 7.5 + i * 15;
            const progress = interpolate(frame, [start, start + 15], [0, 1], C);
            const y1 = ROW_Y[i];
            const y2 = ROW_Y[m.right];
            const d = `M 434 ${y1} Q 540 ${(y1 + y2) / 2 - 60} 686 ${y2}`;
            return (
              <path
                key={m.img}
                d={d}
                pathLength={1}
                fill="none"
                stroke={GREEN}
                strokeWidth={14}
                strokeLinecap="round"
                strokeDasharray={1}
                strokeDashoffset={1 - progress}
              />
            );
          })}
        </svg>
      </AbsoluteFill>

      <AbsoluteFill
        style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 210 }}
      >
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 62,
            color: INK,
            textAlign: 'center',
            wordBreak: 'keep-all',
            opacity: t,
          }}
        >
          그림과 단어, 짝을 맞추고
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── S6 ─────────────────────────────────────────────────────────────────────
const TRAY = [
  { label: '사', x: 270, dx: 160, dy: -300, from: 12, to: 27 }, // 0.40s → 0.90s
  { label: '과', x: 540, dx: 110, dy: -300, from: 33, to: 48 }, // 1.10s → 1.60s
  { label: '나', x: 810, dx: 0, dy: 0, from: 0, to: 0 },
];

const S6: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = tail(frame, dur);
  const done = spring({ frame: frame - 52.5, fps, config: { damping: 13 } }); // 1.75s
  const y = interpolate(frame, [dur - 9, dur], [0, -ADV2_HEIGHT], C);
  return (
    <AbsoluteFill style={{ backgroundColor: CREAM, transform: `translateY(${y}px)` }}>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 240 }}>
        <Img
          src={staticFile('reels/words/apple.webp')}
          style={{ width: 520, borderRadius: 26, boxShadow: '0 16px 40px rgba(0,0,0,0.16)' }}
        />
      </AbsoluteFill>

      {/* 빈 칸 2개 */}
      {[430, 650].map((cx, i) => {
        const filled = frame >= TRAY[i].to;
        return (
          <div
            key={cx}
            style={{
              position: 'absolute',
              left: cx - 100,
              top: 900,
              width: 200,
              height: 200,
              borderRadius: 28,
              border: `6px dashed ${filled ? 'transparent' : '#D8C7B6'}`,
              backgroundColor: filled ? 'transparent' : '#FFFDFB',
            }}
          />
        );
      })}

      {/* 완성 테두리 + 배지 */}
      <div
        style={{
          position: 'absolute',
          left: 300,
          top: 878,
          width: 480,
          height: 244,
          borderRadius: 34,
          border: `8px solid ${GREEN}`,
          opacity: done,
          transform: `scale(${0.9 + 0.1 * done})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 1150,
          textAlign: 'center',
          opacity: done,
        }}
      >
        <span
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 48,
            color: '#fff',
            backgroundColor: GREEN,
            borderRadius: 999,
            padding: '14px 40px',
          }}
        >
          사과 완성
        </span>
      </div>

      {/* 타일 3개 */}
      {TRAY.map((tile) => {
        const p = tile.to > 0 ? interpolate(frame, [tile.from, tile.to], [0, 1], C) : 0;
        const lift = tile.to > 0 ? -90 * Math.sin(Math.PI * p) : 0;
        return (
          <div
            key={tile.label}
            style={{
              position: 'absolute',
              left: tile.x - 90,
              top: 1300 - 90,
              width: 180,
              height: 180,
              borderRadius: 26,
              backgroundColor: '#fff',
              boxShadow: '0 12px 30px rgba(0,0,0,0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily,
              fontWeight: 800,
              fontSize: 88,
              color: INK,
              transform: `translate(${tile.dx * p}px, ${tile.dy * p + lift}px) scale(${1 + 0.11 * p})`,
            }}
          >
            {tile.label}
          </div>
        );
      })}

      <AbsoluteFill
        style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 190 }}
      >
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 62,
            color: INK,
            textAlign: 'center',
            wordBreak: 'keep-all',
            opacity: t,
          }}
        >
          혼자서 단어를 완성해요
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── S7 (클라이맥스) ────────────────────────────────────────────────────────
const APPLE_SENTENCE_HEAD = '예쁜 아가씨, 여기 아주 맛있는 빨간 ';
const APPLE_SENTENCE_TAIL = '가 있답니다.';

const S7: React.FC<{ dur: number }> = ({ dur }) => {
  const raw = useCurrentFrame();
  const frame = raw - 9; // 밀어올림 9프레임 뒤가 씬의 0초
  const slideIn = interpolate(raw, [0, 9], [ADV2_HEIGHT, 0], C);
  const scale = interpolate(frame, [78, 141], [1.06, 1.14], C); // 2.60s → 4.70s
  const pillOp = interpolate(frame, [10.5, 19.5], [0, 1], C) * tail(frame, dur - 9);
  const sentOp = interpolate(frame, [33, 42], [0, 1], C) * tail(frame, dur - 9);
  const lineOp = interpolate(frame, [102, 111], [0, 1], C) * tail(frame, dur - 9);
  const emphasize = interpolate(frame, [48, 51, 54], [1, 1.15, 1], C); // 1.60s, 0.2초
  const emphColor = frame >= 48 ? CORAL : '#fff';
  return (
    <AbsoluteFill style={{ transform: `translateY(${slideIn}px)` }}>
      <BlurBg src="reels/sw-scene-apple.webp" />
      <AbsoluteFill>
        <Img
          src={staticFile('reels/sw-scene-apple.webp')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transform: `scale(${scale})`,
            transformOrigin: '50% 55%',
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 150 }}>
        <Pill text="방금 맞힌 그 단어" opacity={pillOp} color="#fff" bg={GREEN} />
      </AbsoluteFill>

      <AbsoluteFill
        style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 240 }}
      >
        <div
          style={{
            backgroundColor: 'rgba(0,0,0,0.62)',
            borderRadius: 28,
            padding: '26px 40px',
            maxWidth: 920,
            fontFamily,
            fontWeight: 700,
            fontSize: 52,
            color: '#fff',
            textAlign: 'center',
            lineHeight: 1.35,
            wordBreak: 'keep-all',
            opacity: sentOp,
          }}
        >
          {APPLE_SENTENCE_HEAD}
          <span
            style={{
              display: 'inline-block',
              color: emphColor,
              fontWeight: 800,
              transform: `scale(${emphasize})`,
            }}
          >
            사과
          </span>
          {APPLE_SENTENCE_TAIL}
        </div>
        <div
          style={{
            marginTop: 34,
            fontFamily,
            fontWeight: 800,
            fontSize: 58,
            color: '#fff',
            textShadow: '0 6px 24px rgba(0,0,0,0.7)',
            wordBreak: 'keep-all',
            opacity: lineOp,
          }}
        >
          동화 속에서 다시 만나요
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── S8 ─────────────────────────────────────────────────────────────────────
const GRID = [
  ...Array.from({ length: 9 }, (_, i) => `reels/grid-classics/c${i + 1}.webp`),
  ...Array.from({ length: 6 }, (_, i) => `reels/grid-nature/n${i + 1}.webp`),
];

const S8: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = tail(frame, dur);
  return (
    <AbsoluteFill style={{ backgroundColor: CREAM }}>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 190 }}>
        <div
          style={{
            fontFamily,
            fontWeight: 700,
            fontSize: 44,
            color: CORAL,
            opacity: t,
            wordBreak: 'keep-all',
          }}
        >
          명작부터 자연관찰까지
        </div>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 74,
            color: INK,
            marginTop: 12,
            opacity: t,
            wordBreak: 'keep-all',
          }}
        >
          이야기는 계속 늘어나요
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 300px)',
            gap: 24,
            marginTop: 60,
          }}
        >
          {GRID.map((src, i) => {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const pop = spring({
              frame: frame - (row + col) * 0.9,
              fps,
              config: { damping: 13 },
            });
            return (
              <Img
                key={src}
                src={staticFile(src)}
                style={{
                  width: 300,
                  borderRadius: 18,
                  display: 'block',
                  boxShadow: '0 10px 26px rgba(0,0,0,0.14)',
                  transform: `scale(${pop})`,
                  opacity: pop,
                }}
              />
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── S9 ─────────────────────────────────────────────────────────────────────
const S9: React.FC = () => {
  const raw = useCurrentFrame();
  const frame = raw - 4; // 디졸브 4프레임 뒤가 씬의 0초
  const { fps } = useVideoConfig();
  const dissolve = interpolate(raw, [0, 4], [0, 1], C);
  const pop = spring({ frame, fps, config: { damping: 12 } }); // 0.0~0.3s
  const textUp = interpolate(frame, [12, 24], [40, 0], C);
  const textOp = interpolate(frame, [12, 24], [0, 1], C);
  const pillPop = spring({ frame: frame - 27, fps, config: { damping: 11 } });
  const noteOp = interpolate(frame, [36, 45], [0, 1], C);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: CORAL,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: dissolve,
      }}
    >
      <SparkleParticles count={36} seed={7} />
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 44,
          padding: '40px 56px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
          transform: `scale(${pop})`,
        }}
      >
        <Img src={staticFile('reels/logo/logo-kr.webp')} style={{ width: 720 }} />
      </div>
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 100,
          color: '#fff',
          marginTop: 56,
          textAlign: 'center',
          lineHeight: 1.15,
          whiteSpace: 'pre-line',
          wordBreak: 'keep-all',
          transform: `translateY(${textUp}px)`,
          opacity: textOp,
        }}
      >
        {'지금 가입하면\n1년 무료'}
      </div>
      <div
        style={{
          marginTop: 48,
          backgroundColor: '#fff',
          borderRadius: 999,
          padding: '20px 56px',
          fontFamily,
          fontWeight: 800,
          fontSize: 56,
          color: CORAL,
          transform: `scale(${pillPop})`,
        }}
      >
        tangobook.co.kr
      </div>
      <div
        style={{
          marginTop: 40,
          fontFamily,
          fontWeight: 700,
          fontSize: 36,
          color: 'rgba(255,255,255,0.92)',
          opacity: noteOp,
          wordBreak: 'keep-all',
        }}
      >
        2026년 12월 31일까지 가입하면 됩니다
      </div>
    </AbsoluteFill>
  );
};

// ── BGM 볼륨(기준 0.35 = 100) ──────────────────────────────────────────────
const BGM_BASE = 0.35;
const bgmVolume = (f: number) => {
  let level: number;
  if (f < 66) level = 1;
  else if (f < 249) level = 0.45;
  else if (f < 441) level = 1;
  else if (f < 468)
    level = 0; // 패턴 인터럽트
  else level = interpolate(f, [468, 486], [0, 1], C);
  const fadeOut = interpolate(f, [729, 741], [1, 0], C);
  return BGM_BASE * level * fadeOut;
};

const Sfx: React.FC<{ at: number; src: string; volume?: number }> = ({ at, src, volume = 1 }) => (
  <Sequence from={at} durationInFrames={ADV2_DURATION - at}>
    <Audio src={staticFile(src)} volume={volume} />
  </Sequence>
);

export const AdReelV2: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: CREAM }}>
    <Audio src={staticFile('reels/bgm.mp3')} volume={bgmVolume} />

    <Sequence from={0} durationInFrames={66}>
      <S1 dur={66} />
    </Sequence>
    <Sequence from={66} durationInFrames={99}>
      <ReadScene
        dur={99}
        img="reels/read-p1.webp"
        text="피부가 눈처럼 하얀 백설공주가 살았어요."
        shift={0}
      />
    </Sequence>
    <Sequence from={165} durationInFrames={84}>
      <S3Wrapper />
    </Sequence>
    <Sequence from={249} durationInFrames={60}>
      <S4 dur={60} />
    </Sequence>
    <Sequence from={309} durationInFrames={60}>
      <S5 dur={60} />
    </Sequence>
    {/* S6 는 마지막 9프레임에 위로 밀려나고, S7 이 그 위로 올라온다 */}
    <Sequence from={369} durationInFrames={72}>
      <S6 dur={72} />
    </Sequence>
    <Sequence from={432} durationInFrames={150}>
      <S7 dur={150} />
    </Sequence>
    <Sequence from={582} durationInFrames={66}>
      <S8 dur={66} />
    </Sequence>
    <Sequence from={644} durationInFrames={97}>
      <S9 />
    </Sequence>

    {/* 오디오 */}
    <Sequence from={66} durationInFrames={99}>
      <Audio src={staticFile('reels/audio/page1-ko-trim.mp3')} />
    </Sequence>
    <Sequence from={165} durationInFrames={84}>
      <Audio src={staticFile('reels/audio/page2-en-trim.mp3')} />
    </Sequence>
    <Sfx at={22} src="reels/audio/sfx-tap.mp3" />
    <Sfx at={45} src="reels/audio/sfx-tap.mp3" />
    <Sfx at={165} src="reels/audio/sfx-tap.mp3" />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <Sfx key={i} at={249 + Math.round(i * 2.1)} src="reels/audio/sfx-tap.mp3" volume={0.6} />
    ))}
    <Sfx at={316} src="reels/audio/sfx-connect.mp3" />
    <Sfx at={331} src="reels/audio/sfx-connect.mp3" />
    <Sfx at={346} src="reels/audio/sfx-connect.mp3" />
    <Sfx at={396} src="reels/audio/sfx-tap.mp3" />
    <Sfx at={396} src="reels/audio/syl-sa.mp3" />
    <Sfx at={417} src="reels/audio/sfx-tap.mp3" />
    <Sfx at={417} src="reels/audio/syl-gwa.mp3" />
    <Sfx at={423} src="reels/audio/praise.mp3" />
    {/* 🔴 원본 word-apple-ko.mp3 는 앞에 0.306초 무음이 붙어 있어 그대로 놓으면
        의도한 0.35초 패턴 인터럽트가 0.64초로 늘어난다(1차 렌더 실측). 트림본을 쓴다. */}
    <Sfx at={451} src="reels/audio/word-apple-ko-trim.mp3" />
  </AbsoluteFill>
);

// S3 = S2 와 같은 화면, 라벨 표시가 0.2초에 걸쳐 "영어" 쪽으로 옮겨 붙는다.
function S3Wrapper() {
  const frame = useCurrentFrame();
  return (
    <ReadScene
      dur={84}
      img="reels/read-p2.webp"
      text="The new queen had a magical mirror"
      shift={interpolate(frame, [0, 6], [0, 1], C)}
    />
  );
}
