import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';

const { fontFamily } = loadFont('normal', { weights: ['700', '800'] });

const IMG_H = 820;
const FADE = 12; // 그림체 간 크로스페이드

interface Props {
  title: string;
  lines: string[];
  styles: { url: string; label: string }[];
}

export const StyleShowcase: React.FC<Props> = ({ title, lines, styles }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const n = styles.length;
  const BEAT = durationInFrames / n; // 그림체당 유지 프레임

  // 그림체 순차 전환, 컷 사이 크로스페이드
  const beat = Math.min(Math.floor(frame / BEAT), n - 1);
  const local = frame - beat * BEAT;
  const t = Math.min(local / FADE, 1);
  const curScale = interpolate(local, [0, BEAT], [1.0, 1.05]);
  const layers = [
    ...(beat > 0 && t < 1 ? [{ style: styles[beat - 1], opacity: 1 - t, scale: 1.05, z: 1 }] : []),
    { style: styles[beat], opacity: t, scale: curScale, z: 2 },
  ];
  const shown = styles[beat];

  const titleDown = interpolate(frame, [2, 18], [-40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleOpacity = interpolate(frame, [2, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(165deg, #FFF3E9 0%, #FFE1CC 100%)',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '130px 24px 140px',
      }}
    >
      {/* 상단: 브랜드 칩 + 제목 */}
      <div
        style={{
          textAlign: 'center',
          transform: `translateY(${titleDown}px)`,
          opacity: titleOpacity,
        }}
      >
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 40,
            color: '#fff',
            backgroundColor: '#FF6B5E',
            borderRadius: 999,
            padding: '12px 36px',
            display: 'inline-block',
            marginBottom: 24,
            boxShadow: '0 8px 22px rgba(255,107,94,0.35)',
          }}
        >
          탱고북 그림책
        </div>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 88,
            color: '#2B2B2B',
            lineHeight: 1.18,
            wordBreak: 'keep-all',
          }}
        >
          {title}
        </div>
      </div>

      {/* 가운데: 그림체 전환 대형 패널 + 장르 배지 */}
      <div
        style={{
          width: '100%',
          height: IMG_H,
          borderRadius: 28,
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(120,60,30,0.22)',
          backgroundColor: '#241a14',
          position: 'relative',
        }}
      >
        {layers.map((l) => (
          <Img
            key={l.style.url}
            src={l.style.url}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${l.scale})`,
              opacity: l.opacity,
              zIndex: l.z,
            }}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            left: 28,
            bottom: 28,
            zIndex: 3,
            fontFamily,
            fontWeight: 800,
            fontSize: 44,
            color: '#2B2B2B',
            backgroundColor: 'rgba(255,255,255,0.94)',
            borderRadius: 999,
            padding: '14px 34px',
            boxShadow: '0 8px 22px rgba(0,0,0,0.18)',
          }}
        >
          {shown.label}
        </div>
      </div>

      {/* 하단: 그림체 전환에 맞춰 한 줄씩 쌓이는 메시지 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        {lines.map((line, i) => {
          const appear = i * BEAT;
          const pop = spring({
            frame: frame - appear,
            fps,
            config: { damping: 13, stiffness: 180 },
          });
          const op = interpolate(pop, [0, 1], [0, 1]);
          const up = interpolate(pop, [0, 1], [40, 0]);
          const isLast = i === lines.length - 1;
          return (
            <div
              key={line}
              style={{
                fontFamily,
                fontWeight: 800,
                fontSize: isLast ? 62 : 66,
                color: isLast ? '#FF6B5E' : '#3A2E27',
                lineHeight: 1.22,
                textAlign: 'center',
                wordBreak: 'keep-all',
                opacity: op,
                transform: `translateY(${up}px)`,
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
