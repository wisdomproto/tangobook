import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';

const { fontFamily } = loadFont('normal', { weights: ['700', '800'] });

const CORAL = '#FF5E3A';
const CORAL_SOFT = '#FFE4DC';
const SUCCESS = '#3AA87E';
const INK = '#2B2B2B';

function Chip({ label }: { label: string }) {
  return (
    <AbsoluteFill style={{ alignItems: 'center', paddingTop: 140 }}>
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 46,
          color: CORAL,
          backgroundColor: CORAL_SOFT,
          borderRadius: 999,
          padding: '14px 44px',
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
}

function Caption({ text }: { text: string }) {
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 190 }}>
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 58,
          color: INK,
          textAlign: 'center',
          textShadow: '0 2px 12px rgba(255,255,255,0.9)',
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
}

// ─────────────────────────── 그림짝 맞추기 (Line Matching) ───────────────────────────
// 그림 카드(좌) ↔ 단어 카드(우)를 곡선 줄로 잇는다. 맞은 쌍 = 초록선.
const LM_PAIRS = [
  { emoji: '🍎', word: '사과', picY: 620, wordY: 1160 },
  { emoji: '🐱', word: '고양이', picY: 900, wordY: 620 },
  { emoji: '🌸', word: '꽃', picY: 1180, wordY: 900 },
];
const LM_PIC_X = 300;
const LM_WORD_X = 780;

export const LineMatchGame: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: '#FFF6EE' }}>
      <Chip label="그림짝 맞추기 🎯" />

      {/* 곡선 줄 (뒤) */}
      <svg
        width="1080"
        height="1920"
        style={{ position: 'absolute', inset: 0 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {LM_PAIRS.map((p, i) => {
          const draw = interpolate(frame, [10 + i * 14, 34 + i * 14], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const x1 = LM_PIC_X + 150;
          const y1 = p.picY;
          const x2 = LM_WORD_X - 150;
          const y2 = p.wordY;
          const mx = (x1 + x2) / 2;
          return (
            <path
              key={i}
              d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
              stroke={SUCCESS}
              strokeWidth={10}
              fill="none"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - draw}
            />
          );
        })}
      </svg>

      {/* 그림 카드 (좌) */}
      {LM_PAIRS.map((p, i) => (
        <div
          key={`pic-${i}`}
          style={{
            position: 'absolute',
            left: LM_PIC_X - 150,
            top: p.picY - 110,
            width: 300,
            height: 220,
            borderRadius: 28,
            backgroundColor: '#fff',
            border: `5px solid ${SUCCESS}`,
            boxShadow: '0 10px 26px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 130,
          }}
        >
          {p.emoji}
        </div>
      ))}

      {/* 단어 카드 (우) */}
      {LM_PAIRS.map((p, i) => (
        <div
          key={`word-${i}`}
          style={{
            position: 'absolute',
            left: LM_WORD_X - 150,
            top: p.wordY - 110,
            width: 300,
            height: 220,
            borderRadius: 28,
            backgroundColor: '#fff',
            border: `5px solid ${SUCCESS}`,
            boxShadow: '0 10px 26px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily,
            fontWeight: 800,
            fontSize: 72,
            color: INK,
          }}
        >
          {p.word}
        </div>
      ))}

      <Caption text="그림과 단어를 이어요" />
    </AbsoluteFill>
  );
};

// ─────────────────────────── 블록 맞추기 (Block) ───────────────────────────
// 글자 블록을 슬롯에 끼워 단어를 완성. 완성되면 ✓.
const BLOCK_TILES = ['사', '과'];

export const BlockGame: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const done = frame >= 55;
  const checkPop = spring({ frame: frame - 55, fps, config: { damping: 10 } });
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(160deg,#FFF1E8 0%,#FFE0D2 100%)' }}>
      <Chip label="블록 맞추기 🧩" />

      {/* 정답 슬롯 (단어) */}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', paddingBottom: 60 }}>
        <div style={{ display: 'flex', gap: 26 }}>
          {BLOCK_TILES.map((t, i) => {
            const arrive = spring({ frame: frame - (12 + i * 16), fps, config: { damping: 13 } });
            return (
              <div
                key={i}
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: 28,
                  border: `5px dashed ${arrive > 0.5 ? SUCCESS : '#E9C9BA'}`,
                  backgroundColor: arrive > 0.5 ? '#fff' : 'rgba(255,255,255,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily,
                  fontWeight: 800,
                  fontSize: 120,
                  color: CORAL,
                  transform: `translateY(${(1 - arrive) * 120}px) scale(${0.6 + arrive * 0.4})`,
                  opacity: arrive,
                  boxShadow: arrive > 0.9 ? '0 12px 30px rgba(0,0,0,0.14)' : 'none',
                }}
              >
                {t}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* 정답 도장 */}
      {done && (
        <AbsoluteFill
          style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 470 }}
        >
          <div
            style={{
              transform: `scale(${checkPop})`,
              fontFamily,
              fontWeight: 800,
              fontSize: 54,
              color: '#fff',
              backgroundColor: SUCCESS,
              borderRadius: 999,
              padding: '16px 48px',
              boxShadow: '0 10px 26px rgba(0,0,0,0.18)',
            }}
          >
            ✓ 완성!
          </div>
        </AbsoluteFill>
      )}

      <Caption text="블록으로 단어를 만들어요" />
    </AbsoluteFill>
  );
};

// ─────────────────────────── 따라쓰기 (Word Writing) ───────────────────────────
// 회색 가이드 글자 위를 손으로 따라 쓴다. coral 획이 왼→오른쪽으로 채워진다.
export const WritingGame: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const trace = interpolate(frame, [12, 58], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const done = frame >= 60;
  const checkPop = spring({ frame: frame - 60, fps, config: { damping: 10 } });
  const CHAR = '사';
  return (
    <AbsoluteFill style={{ backgroundColor: '#FFF6EE' }}>
      <Chip label="따라쓰기 ✏️" />

      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div
          style={{
            position: 'relative',
            width: 620,
            height: 620,
            borderRadius: 40,
            backgroundColor: '#fff',
            border: '5px solid #F0DCCF',
            boxShadow: '0 14px 40px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          {/* 점선 십자 가이드 */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              borderLeft: '3px dashed #EADFD4',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              borderTop: '3px dashed #EADFD4',
            }}
          />
          {/* 회색 가이드 글자 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily,
              fontWeight: 800,
              fontSize: 440,
              color: '#D8C8BB',
            }}
          >
            {CHAR}
          </div>
          {/* 사용자 획(coral) — 왼→오 wipe */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily,
              fontWeight: 800,
              fontSize: 440,
              color: CORAL,
              clipPath: `inset(0 ${100 - trace * 100}% 0 0)`,
            }}
          >
            {CHAR}
          </div>
        </div>
      </AbsoluteFill>

      {done && (
        <AbsoluteFill
          style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 430 }}
        >
          <div
            style={{
              transform: `scale(${checkPop})`,
              fontFamily,
              fontWeight: 800,
              fontSize: 54,
              color: '#fff',
              backgroundColor: SUCCESS,
              borderRadius: 999,
              padding: '16px 48px',
              boxShadow: '0 10px 26px rgba(0,0,0,0.18)',
            }}
          >
            ✓ 잘했어요!
          </div>
        </AbsoluteFill>
      )}

      <Caption text="손으로 따라 써요" />
    </AbsoluteFill>
  );
};
