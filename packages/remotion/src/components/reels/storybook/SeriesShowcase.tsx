import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';

const { fontFamily } = loadFont('normal', { weights: ['700', '800'] });

interface Props {
  headline: string;
  covers: string[]; // 8
  labels: string[]; // 8
}

export const SeriesShowcase: React.FC<Props> = ({ headline, covers, labels }) => {
  const frame = useCurrentFrame();
  const items = covers.slice(0, 8);
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(165deg, #FFF3E9 0%, #FFE1CC 100%)',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 48px',
        gap: 56,
      }}
    >
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 76,
          color: '#2B2B2B',
          textAlign: 'center',
          lineHeight: 1.2,
          wordBreak: 'keep-all',
          opacity: interpolate(frame, [2, 18], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        {headline}
      </div>
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, width: '100%' }}
      >
        {items.map((url, i) => {
          const enter = interpolate(frame, [6 + i * 3, 18 + i * 3], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <div
              key={url}
              style={{ opacity: enter, transform: `translateY(${(1 - enter) * 20}px)` }}
            >
              <div
                style={{
                  aspectRatio: '1 / 1',
                  borderRadius: 22,
                  overflow: 'hidden',
                  boxShadow: '0 12px 30px rgba(120,60,30,0.2)',
                  backgroundColor: '#241a14',
                }}
              >
                <Img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div
                style={{
                  fontFamily,
                  fontWeight: 700,
                  fontSize: 30,
                  color: '#4A3B33',
                  textAlign: 'center',
                  marginTop: 10,
                  wordBreak: 'keep-all',
                }}
              >
                {labels[i]}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
