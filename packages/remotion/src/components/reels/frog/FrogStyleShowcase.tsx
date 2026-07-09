import React from 'react';
import { AbsoluteFill, Img, staticFile, interpolate, useCurrentFrame } from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';
import { FROG_STYLE_SHOWCASE } from '../../../data/frog-reel';

const { fontFamily } = loadFont('normal', { weights: ['700', '800'] });

const IMG_H = 860;
const CUT = 30; // 프레임당 컷(1.0s) — 차분하게
const FADE = 10; // 컷 사이 부드러운 크로스페이드

export const FrogStyleShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const { title, body, styles } = FROG_STYLE_SHOWCASE;
  const n = styles.length;

  const slot = Math.floor(frame / CUT);
  const local = frame - slot * CUT;
  const t = Math.min(local / FADE, 1); // 0→1 크로스페이드 진행
  const curIdx = slot % n;
  const prevIdx = (slot - 1 + n) % n;
  // 완만한 드리프트 줌(정신없지 않게)
  const curScale = interpolate(local, [0, CUT], [1.0, 1.04]);
  // 이전→현재 두 레이어를 겹쳐 부드럽게 교차
  const layers = [
    ...(slot > 0 && t < 1 ? [{ style: styles[prevIdx], opacity: 1 - t, scale: 1.04, z: 1 }] : []),
    { style: styles[curIdx], opacity: t, scale: curScale, z: 2 },
  ];
  // 라벨은 더 진하게 보이는 그림체를 표시(중간에 자연스럽게 전환)
  const shown = t >= 0.5 || slot === 0 ? styles[curIdx] : styles[prevIdx];

  const titleDown = interpolate(frame, [2, 18], [-40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleOpacity = interpolate(frame, [2, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const bodyUp = interpolate(frame, [12, 28], [40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const bodyOpacity = interpolate(frame, [12, 28], [0, 1], {
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
        padding: '140px 24px 150px',
      }}
    >
      {/* 상단 제목 */}
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
            marginBottom: 26,
            boxShadow: '0 8px 22px rgba(255,107,94,0.35)',
          }}
        >
          탱고북 그림책
        </div>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 92,
            color: '#2B2B2B',
            lineHeight: 1.18,
            wordBreak: 'keep-all',
          }}
        >
          {title}
        </div>
      </div>

      {/* 가운데: 그림체가 빠르게 넘어가는 대형 패널 */}
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
            key={l.style.src}
            src={staticFile(l.style.src)}
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
        {/* 그림체 장르 라벨 배지 */}
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

      {/* 하단 내용 */}
      <div
        style={{
          fontFamily,
          fontWeight: 700,
          fontSize: 58,
          color: '#4A3B33',
          textAlign: 'center',
          lineHeight: 1.4,
          wordBreak: 'keep-all',
          maxWidth: 940,
          transform: `translateY(${bodyUp}px)`,
          opacity: bodyOpacity,
        }}
      >
        {body}
      </div>
    </AbsoluteFill>
  );
};
