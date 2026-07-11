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

const COVERS = [
  'reels/covers/cover-cinderella.webp',
  'reels/covers/cover-snow-white.webp',
  'reels/covers/cover-red-riding-hood.webp',
  'reels/covers/cover-ugly-duckling.webp',
  'reels/covers/cover-nutcracker.webp',
  'reels/covers/cover-jack-beanstalk.webp',
  'reels/covers/cover-hare-tortoise.webp',
  'reels/covers/cover-ant-grasshopper.webp',
];

export const ClassicCollage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const framesPerCut = 0.4 * fps;
  const cut = Math.floor(frame / framesPerCut) % COVERS.length;
  const local = frame % framesPerCut;
  const scale = interpolate(local, [0, framesPerCut], [1.0, 1.08]);
  return (
    <AbsoluteFill style={{ backgroundColor: '#1A1A2E' }}>
      {/* 블러 풀블리드 배경 — 세로 여백 제거 */}
      <AbsoluteFill>
        <Img
          src={staticFile(COVERS[cut])}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(48px) brightness(0.5)',
            transform: 'scale(1.25)',
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Img
          src={staticFile(COVERS[cut])}
          style={{
            width: '88%',
            borderRadius: 24,
            transform: `scale(${scale})`,
            boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', paddingTop: 140 }}>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 76,
            color: '#fff',
            textAlign: 'center',
            whiteSpace: 'pre-line',
            textShadow: '0 4px 18px rgba(0,0,0,0.5)',
          }}
        >
          {'세계 명작동화,\n탱고북에서'}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
