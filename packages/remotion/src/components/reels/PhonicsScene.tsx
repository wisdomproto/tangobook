import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';

const { fontFamily } = loadFont('normal', { weights: ['800'] });

const FillLetter: React.FC<{ char: string; progress: number; done: boolean }> = ({
  char,
  progress,
  done,
}) => {
  const reveal = (1 - progress) * 100; // inset bottom %: 100 -> 0 as it fills
  const common: React.CSSProperties = {
    fontFamily,
    fontWeight: 800,
    fontSize: 420,
    lineHeight: 1,
    position: 'absolute',
    inset: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };
  return (
    <div style={{ position: 'relative', width: 460, height: 460 }}>
      <div style={{ ...common, color: '#D7E8E0' }}>{char}</div>
      <div style={{ ...common, color: '#1F9D6B', clipPath: `inset(${reveal}% 0 0 0)` }}>{char}</div>
      {done && <div style={{ position: 'absolute', right: -10, top: -10, fontSize: 120 }}>✓</div>}
    </div>
  );
};

export const PhonicsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const half = durationInFrames / 2;
  const showSecond = frame >= half;
  const char = showSecond ? 'ㄱ' : 'A';
  const local = frame % half;
  const progress = interpolate(local, [4, half * 0.7], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const done = progress >= 0.98;
  const enter = spring({ frame: local, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill
      style={{ backgroundColor: '#EAF7F2', justifyContent: 'center', alignItems: 'center' }}
    >
      <div
        style={{
          position: 'absolute',
          top: 140,
          fontFamily,
          fontWeight: 800,
          fontSize: 72,
          color: '#1F7A5A',
          textAlign: 'center',
          whiteSpace: 'pre-line',
        }}
      >
        {'한글·영어\n파닉스까지'}
      </div>
      <div style={{ transform: `scale(${0.9 + enter * 0.1})` }}>
        <FillLetter char={char} progress={progress} done={done} />
      </div>
    </AbsoluteFill>
  );
};
