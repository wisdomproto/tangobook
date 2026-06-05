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
  'reels/nature/db-ocean.jpg',
  'reels/nature/db-land.jpg',
  'reels/nature/db-bird.jpg',
  'reels/nature/db-plant.jpg',
  'reels/nature/db-insect.jpg',
  'reels/nature/db-dino.jpg',
  'reels/nature/db-sea2.jpg',
  'reels/nature/db-sky2.jpg',
  'reels/nature/db-space.jpg',
];

export const NatureScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const durationInFrames = 5 * fps;
  const perCut = durationInFrames / IMGS.length;
  const cut = Math.min(Math.floor(frame / perCut), IMGS.length - 1);
  const local = frame - cut * perCut;
  const zoom = interpolate(local, [0, perCut], [1.04, 1.12]);
  const fade = interpolate(local, [0, 4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{ backgroundColor: '#0E2A22' }}>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Img
          src={staticFile(IMGS[cut])}
          style={{
            width: '90%',
            borderRadius: 24,
            opacity: fade,
            transform: `scale(${zoom})`,
          }}
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
