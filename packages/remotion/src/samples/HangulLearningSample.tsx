import React, { useEffect, useState } from 'react';
import {
  AbsoluteFill,
  Audio,
  Composition,
  Img,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { evolvePath, getLength, getPointAtLength } from '@remotion/paths';
import { TimedRive } from './TimedRive';

export const SAMPLE_FPS = 30;
export const SAMPLE_FRAMES = 720;
export const WRITING_START = 270;
export const WORD_START = 480;
const A = 'hangul-sample-20261012/';
const INK = '#25333D';
const CORAL = '#EF8056';
const MINT = '#31B5A2';
const CREAM = '#FFFCF4';
const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const font = 'SamplePretendard, sans-serif';

export const GA_STROKES = [
  { path: 'M 150 135 H 400 V 580', start: 20, end: 82, color: CORAL, x: 150, y: 70 },
  { path: 'M 585 100 V 620', start: 91, end: 136, color: MINT, x: 585, y: 45 },
  { path: 'M 585 350 H 775', start: 146, end: 174, color: MINT, x: 525, y: 350 },
] as const;
export const VOICE_CUES = [
  { from: 24, file: 'letter-g.mp3' },
  { from: 65, file: 'vowel-a.mp3' },
  { from: 170, file: 'blend-ga.mp3' },
  { from: 240, file: 'syllable-ga.mp3' },
  { from: 279, file: 'write-guide.mp3' },
  { from: 451, file: 'syllable-ga.mp3' },
  { from: 501, file: 'syllable-ga.mp3' },
  { from: 540, file: 'word-gabang.wav' },
  { from: 610, file: 'word-gabang.wav' },
  { from: 674, file: 'word-gabang.wav' },
] as const;

const FontReady: React.FC = () => {
  const [handle] = useState(() => delayRender('Local Korean font'));
  useEffect(() => {
    const face = new FontFace(
      'SamplePretendard',
      'url(' + staticFile(A + 'Pretendard-Regular.otf') + ')'
    );
    face
      .load()
      .then((loaded) => {
        document.fonts.add(loaded);
        continueRender(handle);
      })
      .catch((error) => {
        throw error;
      });
    return () => continueRender(handle);
  }, [handle]);
  return null;
};

const Header: React.FC<{ step: string; title: string }> = ({ step, title }) => (
  <>
    <div
      style={{
        position: 'absolute',
        left: 80,
        top: 54,
        background: '#FFFFFF',
        border: '2px solid #EEE6D8',
        borderRadius: 32,
        padding: '14px 26px',
        fontSize: 31,
        fontWeight: 800,
        color: INK,
      }}
    >
      {step}
    </div>
    <div
      style={{
        position: 'absolute',
        top: 115,
        left: 280,
        right: 280,
        fontSize: 65,
        fontWeight: 900,
        textAlign: 'center',
        color: INK,
        letterSpacing: '-2px',
      }}
    >
      {title}
    </div>
    <div
      style={{
        position: 'absolute',
        right: 80,
        top: 66,
        fontSize: 31,
        fontWeight: 800,
        color: '#8B9890',
      }}
    >
      탱고북
    </div>
  </>
);

const Decorations: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {[
        { x: 140, y: 310, c: '#F5D381' },
        { x: 1770, y: 830, c: '#B8DCCB' },
        { x: 1750, y: 240, c: '#F5C7AE' },
        { x: 160, y: 860, c: '#B8DCCB' },
      ].map((d, i) => (
        <svg
          key={i}
          width={42}
          height={42}
          viewBox="0 0 40 40"
          style={{
            position: 'absolute',
            left: d.x,
            top: d.y,
            transform: 'rotate(' + 12 * Math.sin(frame / 45 + i) + 'deg)',
          }}
        >
          <path d="M20 0 Q22 17 40 20 Q22 22 20 40 Q17 22 0 20 Q17 17 20 0" fill={d.c} />
        </svg>
      ))}
    </AbsoluteFill>
  );
};

const Meeting: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <TimedRive />
      <Header step="1 · 만나요" title={frame < 165 ? 'ㄱ이 ㅏ를 만나면?' : '손을 잡고, 가!'} />
    </AbsoluteFill>
  );
};

const Writing: React.FC = () => {
  const f = useCurrentFrame();
  const activeIndex = f <= 82 ? 0 : f <= 136 ? 1 : 2;
  const stroke = GA_STROKES[activeIndex];
  const progress = interpolate(f, [stroke.start, stroke.end], [0, 1], CLAMP);
  const point = getPointAtLength(stroke.path, getLength(stroke.path) * progress);
  const active = f >= stroke.start && f <= stroke.end;
  const instruction =
    f < 91
      ? '오른쪽으로, 아래로'
      : f < 146
        ? '위에서 아래로'
        : f < 180
          ? '짧게 오른쪽으로'
          : '가, 완성!';
  return (
    <AbsoluteFill style={{ background: CREAM }}>
      <Decorations />
      <Header step="2 · 써요" title="가를 따라 써 봐요" />
      <div
        style={{
          position: 'absolute',
          left: 420,
          top: 215,
          width: 1080,
          height: 700,
          borderRadius: 56,
          background: '#FFFFFF',
          border: '3px solid #EEE7DC',
          boxShadow: '0 14px 0 #F3EEE4',
        }}
      />
      <svg
        width={1080}
        height={720}
        viewBox="0 0 900 750"
        style={{ position: 'absolute', left: 420, top: 196 }}
      >
        <path
          d="M95 700 H840 M95 50 V700"
          fill="none"
          stroke="#F2EEE5"
          strokeWidth={3}
          strokeDasharray="10 12"
        />
        {GA_STROKES.map((s, i) => {
          const p = interpolate(f, [s.start, s.end], [0, 1], CLAMP);
          const evolved = evolvePath(p, s.path);
          return (
            <g key={s.path}>
              <path
                d={s.path}
                fill="none"
                stroke="#ECEFE9"
                strokeWidth={62}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {p > 0 && (
                <path
                  d={s.path}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={62}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  {...evolved}
                />
              )}
              {f < 180 && (
                <g opacity={f >= s.start ? 1 : 0.45}>
                  <circle cx={s.x} cy={s.y} r={24} fill={s.color} />
                  <text
                    x={s.x}
                    y={s.y + 9}
                    textAnchor="middle"
                    fill="white"
                    fontSize={27}
                    fontWeight={800}
                    fontFamily={font}
                  >
                    {i + 1}
                  </text>
                </g>
              )}
            </g>
          );
        })}
        {active && (
          <g transform={'translate(' + point.x + ' ' + point.y + ')'}>
            <circle r={48} fill="#FFE79F" opacity={0.45} />
            <circle r={33} fill="#FFFFFF" stroke="#F7C456" strokeWidth={6} />
            <g transform="rotate(-30)">
              <path
                d="M-11-14V-57Q-11-69 0-69Q11-69 11-57V-14L0 5Z"
                fill="#F7C456"
                stroke="#DDA439"
                strokeWidth={2}
              />
              <path d="M-11-14L0 5L11-14Z" fill="#F7DFC0" />
              <path d="M-4-2L0 5L4-2Z" fill={INK} />
            </g>
          </g>
        )}
      </svg>
      <div
        style={{
          position: 'absolute',
          top: 956,
          left: 360,
          right: 360,
          fontSize: 48,
          fontWeight: 800,
          color: f < 180 ? INK : CORAL,
          textAlign: 'center',
        }}
      >
        {instruction}
      </div>
    </AbsoluteFill>
  );
};

const Word: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrance = spring({ frame: f, fps, config: { damping: 15, stiffness: 120 } });
  const bagY = f > 35 ? -9 * Math.sin(((f - 35) / fps) * Math.PI * 2) : 0;
  const syllable = spring({ frame: f - 30, fps, config: { damping: 17, stiffness: 130 } });
  return (
    <AbsoluteFill style={{ background: CREAM }}>
      <Decorations />
      <Header step="3 · 읽어요" title="가로 시작하는 말" />
      <div
        style={{
          position: 'absolute',
          left: 1030,
          top: 208,
          width: 790,
          height: 790,
          background: '#E4F2E9',
          borderRadius: '50%',
          transform: 'scale(' + entrance + ')',
        }}
      />
      <Img
        src={staticFile(A + 'bag.png')}
        style={{
          position: 'absolute',
          left: 1025,
          top: 165,
          width: 800,
          height: 800,
          objectFit: 'contain',
          transform: 'translateY(' + bagY + 'px) scale(' + entrance + ')',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 216,
          top: 367,
          fontSize: 220,
          fontWeight: 900,
          color: INK,
          letterSpacing: '-12px',
        }}
      >
        <span style={{ color: CORAL }}>가</span>
        <span
          style={{
            display: 'inline-block',
            opacity: Math.min(1, syllable),
            transform: 'translateY(' + (1 - syllable) * 80 + 'px)',
          }}
        >
          방
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 235,
          top: 667,
          fontSize: 52,
          fontWeight: 800,
          color: INK,
        }}
      >
        가, 가방!
      </div>
      <div
        style={{
          position: 'absolute',
          left: 237,
          top: 770,
          padding: '20px 35px',
          borderRadius: 30,
          color: '#477166',
          background: '#E4F2E9',
          fontSize: 35,
          fontWeight: 800,
        }}
      >
        가방에도 ‘가’가 있어요
      </div>
    </AbsoluteFill>
  );
};

export const HangulLearningSample: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [SAMPLE_FRAMES - 15, SAMPLE_FRAMES - 1], [0, 1], CLAMP);
  const music = (f: number) => {
    const edge = Math.min(
      interpolate(f, [0, 18], [0, 1], CLAMP),
      interpolate(f, [SAMPLE_FRAMES - 30, SAMPLE_FRAMES], [1, 0], CLAMP)
    );
    const speech = VOICE_CUES.some((cue) => f >= cue.from - 4 && f < cue.from + 70);
    return edge * (speech ? 0.025 : 0.05);
  };
  return (
    <AbsoluteFill style={{ background: CREAM, fontFamily: font }}>
      <FontReady />
      <Sequence from={0} durationInFrames={WRITING_START}>
        <Meeting />
      </Sequence>
      <Sequence from={WRITING_START} durationInFrames={WORD_START - WRITING_START}>
        <Writing />
      </Sequence>
      <Sequence from={WORD_START} durationInFrames={SAMPLE_FRAMES - WORD_START}>
        <Word />
      </Sequence>
      <Audio src={staticFile(A + 'bgm.mp3')} volume={music} />
      {VOICE_CUES.map((cue, i) => (
        <Sequence key={i} from={cue.from}>
          <Audio src={staticFile(A + cue.file)} volume={0.66} />
        </Sequence>
      ))}
      {[
        { at: 99, sound: 'correct.mp3' },
        { at: 444, sound: 'complete.mp3' },
        { at: 488, sound: 'correct.mp3' },
      ].map((cue, i) => (
        <Sequence key={i} from={cue.at}>
          <Audio src={staticFile(A + cue.sound)} volume={0.14} />
        </Sequence>
      ))}
      <AbsoluteFill style={{ background: CREAM, opacity: fade, pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};

export const HangulSampleRoot: React.FC = () => (
  <Composition
    id="HangulLearningSample"
    component={HangulLearningSample}
    width={1920}
    height={1080}
    fps={SAMPLE_FPS}
    durationInFrames={SAMPLE_FRAMES}
  />
);
