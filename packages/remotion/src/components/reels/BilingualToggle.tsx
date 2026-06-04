import React from 'react';
import {
  AbsoluteFill,
  Img,
  staticFile,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';

const { fontFamily } = loadFont('normal', { weights: ['700', '800'] });

const COVER = 'reels/covers/cover-snow-white.webp';
const KO_CAPTION = '백설공주는 빨간 사과를\n한 입 베어 물었어요.';
const EN_CAPTION = 'Snow White took a bite\nof the red apple.';

export const BilingualToggle: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const half = durationInFrames / 2;
  const showEn = frame >= half;
  const caption = showEn ? EN_CAPTION : KO_CAPTION;
  const label = showEn ? 'English' : '한글';
  const pop = interpolate(frame % half, [0, 8], [0.94, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill
      style={{ backgroundColor: '#FFF6EE', justifyContent: 'center', alignItems: 'center' }}
    >
      <div
        style={{
          position: 'absolute',
          top: 130,
          fontFamily,
          fontWeight: 800,
          fontSize: 72,
          color: '#2B2B2B',
          textAlign: 'center',
          whiteSpace: 'pre-line',
        }}
      >
        {'한 권으로\n한글 + 영어'}
      </div>
      <div
        style={{
          width: '78%',
          background: '#fff',
          borderRadius: 36,
          overflow: 'hidden',
          boxShadow: '0 24px 70px rgba(0,0,0,0.18)',
          transform: `scale(${pop})`,
        }}
      >
        <Img src={staticFile(COVER)} style={{ width: '100%', display: 'block' }} />
        <div
          style={{
            padding: '36px 40px 48px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
          }}
        >
          <div
            style={{
              fontFamily,
              fontWeight: 800,
              fontSize: 44,
              color: '#fff',
              background: '#FF6B5E',
              padding: '12px 40px',
              borderRadius: 999,
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontFamily,
              fontWeight: 700,
              fontSize: 46,
              color: '#2B2B2B',
              textAlign: 'center',
              whiteSpace: 'pre-line',
              lineHeight: 1.45,
            }}
          >
            {caption}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
