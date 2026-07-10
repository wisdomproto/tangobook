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
import { SparkleParticles } from '../../SparkleParticles';

const { fontFamily } = loadFont('normal', { weights: ['700', '800'] });

/** CTA: 로고 + 7일 무료 체험 카드 (ReelsPromo ClosingScene 톤 재사용) */
export const FrogClosing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12 } });
  const textUp = interpolate(frame, [12, 30], [40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const textOpacity = interpolate(frame, [12, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pillPop = spring({ frame: frame - 30, fps, config: { damping: 11 } });
  return (
    <AbsoluteFill
      style={{ backgroundColor: '#FF6B5E', justifyContent: 'center', alignItems: 'center' }}
    >
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
          transform: `translateY(${textUp}px)`,
          opacity: textOpacity,
        }}
      >
        {'7일간\n무료 체험'}
      </div>
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 52,
          color: '#FF6B5E',
          backgroundColor: '#fff',
          borderRadius: 999,
          padding: '20px 52px',
          marginTop: 40,
          boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
          transform: `scale(${pillPop})`,
        }}
      >
        tangobook.co.kr
      </div>
      <div
        style={{
          fontFamily,
          fontWeight: 700,
          fontSize: 46,
          color: '#FFE9D6',
          marginTop: 28,
          opacity: textOpacity,
        }}
      >
        지금 무료로 보기 👇
      </div>
      <SparkleParticles seed={321} count={50} />
    </AbsoluteFill>
  );
};
