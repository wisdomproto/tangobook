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

const { fontFamily } = loadFont('normal', { weights: ['800'] });

const IMGS = [
  'reels/nature/card-03-animal.webp',
  'reels/nature/card-04-plant.webp',
  'reels/nature/card-05-ocean.webp',
];

export const NatureScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cut = Math.floor(frame / (1 * fps)) % IMGS.length;
  const zoom = interpolate(frame, [0, 3 * fps], [1.0, 1.12]);
  return (
    <AbsoluteFill style={{ backgroundColor: '#0E2A22' }}>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Img
          src={staticFile(IMGS[cut])}
          style={{ width: '90%', borderRadius: 24, transform: `scale(${zoom})` }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 200 }}
      >
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 76,
            color: '#fff',
            textShadow: '0 4px 18px rgba(0,0,0,0.5)',
          }}
        >
          자연관찰 그림책도
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
