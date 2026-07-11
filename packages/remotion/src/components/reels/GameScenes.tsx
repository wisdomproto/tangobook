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

// ─────────────────────────── 이 책에서 배우는 단어 (Book Words) ───────────────────────────
// 동화책마다 배우는 핵심 단어가 있다 — 게임 학습의 출발점. (예: 백설공주 → 사과·왕비·거울·숲)
const BOOK_WORDS = [
  { emoji: '🍎', word: '사과' },
  { emoji: '👑', word: '왕비' },
  { emoji: '🪞', word: '거울' },
  { emoji: '🌳', word: '숲' },
];

export const BookWords: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const coverIn = spring({ frame, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ backgroundColor: '#FFF6EE' }}>
      <AbsoluteFill
        style={{ flexDirection: 'column', alignItems: 'center', paddingTop: 150, gap: 26 }}
      >
        {/* 책 표지 */}
        <div
          style={{
            width: '58%',
            borderRadius: 24,
            overflow: 'hidden',
            boxShadow: '0 18px 44px rgba(0,0,0,0.2)',
            transform: `scale(${0.8 + coverIn * 0.2})`,
          }}
        >
          <Img
            src={staticFile('reels/covers/cover-snow-white.webp')}
            style={{ width: '100%', display: 'block' }}
          />
        </div>
        {/* 라벨 */}
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 50,
            color: CORAL,
            backgroundColor: CORAL_SOFT,
            borderRadius: 999,
            padding: '14px 44px',
          }}
        >
          이 책에서 배우는 단어
        </div>
        {/* 단어 카드 2×2 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 22,
            width: '80%',
            marginTop: 8,
          }}
        >
          {BOOK_WORDS.map((w, i) => {
            const pop = spring({ frame: frame - (14 + i * 9), fps, config: { damping: 13 } });
            return (
              <div
                key={w.word}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  backgroundColor: '#fff',
                  borderRadius: 26,
                  padding: '22px 30px',
                  boxShadow: '0 8px 22px rgba(0,0,0,0.1)',
                  transform: `scale(${0.7 + pop * 0.3})`,
                  opacity: pop,
                }}
              >
                <span style={{ fontSize: 76 }}>{w.emoji}</span>
                <span style={{ fontFamily, fontWeight: 800, fontSize: 62, color: INK }}>
                  {w.word}
                </span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

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
// 아래 트레이의 글자 블록을 슬롯으로 끌어와 단어(사과)를 완성한다. 단계적으로 날아 들어감.
const SLOT_Y = 760; // 슬롯 중심 y
const SLOT_CX = [438, 642]; // 슬롯 중심 x
const TRAY_Y = 1360; // 트레이 중심 y
// 트레이 초기 위치(사, 과, 나 distractor) → 정답 타일은 슬롯으로 이동.
const B_TILES = [
  { ch: '사', fromX: 366, toX: SLOT_CX[0], toSlot: true, start: 20 },
  { ch: '과', fromX: 540, toX: SLOT_CX[1], toSlot: true, start: 52 },
  { ch: '나', fromX: 714, toX: 714, toSlot: false, start: 0 },
];

export const BlockGame: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const done = frame >= 86;
  const checkPop = spring({ frame: frame - 86, fps, config: { damping: 10 } });
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(160deg,#FFF1E8 0%,#FFE0D2 100%)' }}>
      <Chip label="블록 맞추기 🧩" />

      {/* 빈 슬롯 2칸 */}
      {SLOT_CX.map((cx, i) => (
        <div
          key={`slot-${i}`}
          style={{
            position: 'absolute',
            left: cx - 100,
            top: SLOT_Y - 100,
            width: 200,
            height: 200,
            borderRadius: 28,
            border: '5px dashed #E4B9A6',
            backgroundColor: 'rgba(255,255,255,0.35)',
          }}
        />
      ))}

      {/* 타일들 (트레이 → 슬롯 이동) */}
      {B_TILES.map((t, i) => {
        const p = t.toSlot
          ? interpolate(frame, [t.start, t.start + 22], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          : 0;
        const x = t.fromX + (t.toX - t.fromX) * p;
        const y = TRAY_Y + (SLOT_Y - TRAY_Y) * p;
        const placed = t.toSlot && p > 0.98;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - 100,
              top: y - 100,
              width: 200,
              height: 200,
              borderRadius: 28,
              backgroundColor: '#fff',
              border: `5px solid ${placed ? SUCCESS : '#F0C9B8'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily,
              fontWeight: 800,
              fontSize: 120,
              color: CORAL,
              boxShadow: '0 12px 26px rgba(0,0,0,0.14)',
              transform: `rotate(${t.toSlot && p > 0 && p < 1 ? 4 : 0}deg)`,
            }}
          >
            {t.ch}
          </div>
        );
      })}

      {/* 정답 도장 */}
      {done && (
        <AbsoluteFill
          style={{ justifyContent: 'flex-start', alignItems: 'center', paddingTop: 540 }}
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
            ✓ 사과 완성!
          </div>
        </AbsoluteFill>
      )}

      <Caption text="블록을 끼워 단어를 만들어요" />
    </AbsoluteFill>
  );
};

// ─────────────────────────── 따라쓰기 (Word Writing) ───────────────────────────
// 회색 가이드 글자 위를 손으로 따라 쓴다. coral 획이 왼→오른쪽으로 채워진다.
export const WritingGame: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const trace = interpolate(frame, [16, 92], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const done = frame >= 96;
  const checkPop = spring({ frame: frame - 96, fps, config: { damping: 10 } });
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
          {/* 펜 커서 — 획을 따라 왼→오 이동 */}
          {!done && (
            <div
              style={{
                position: 'absolute',
                left: `${trace * 100}%`,
                top: '44%',
                fontSize: 90,
                transform: 'translate(-30%, -50%) rotate(8deg)',
              }}
            >
              ✏️
            </div>
          )}
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
