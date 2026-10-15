import React, { useCallback, useEffect, useState } from 'react';
import {
  AbsoluteFill,
  Audio,
  Composition,
  Img,
  continueRender,
  delayRender,
  interpolate,
  registerRoot,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import { RemotionRiveCanvas } from '@remotion/rive';
import timing from '../../public/gagya-song-20261015/timing.json';
import { smoothTrainProgress } from './trainMotion';

const A = 'gagya-song-20261015/';
const INK = '#35415c';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const colors = timing.colors;
const font = 'GagyaRound, sans-serif';

const Rive: React.FC<{ artboard: string; animation: string }> = ({ artboard, animation }) => {
  const [handle] = useState(() => delayRender(`Rive ${artboard} first draw`));
  const ready = useCallback(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => continueRender(handle)));
  }, [handle]);
  useEffect(() => () => continueRender(handle), [handle]);
  return (
    <RemotionRiveCanvas
      src={staticFile(A + 'gagya-song.riv')}
      artboard={artboard}
      animation={animation}
      fit="fill"
      enableRiveAssetCdn={false}
      onLoad={ready}
    />
  );
};

const Fonts: React.FC = () => {
  const [handle] = useState(() => delayRender('Korean display font'));
  useEffect(() => {
    const f = new FontFace('GagyaRound', `url(${staticFile(A + 'Cafe24Ssurround.woff')})`);
    f.load()
      .then((v) => {
        document.fonts.add(v);
        continueRender(handle);
      })
      .catch((err) => {
        throw err;
      });
    return () => continueRender(handle);
  }, [handle]);
  return null;
};

export function cueAt(t: number) {
  return (
    timing.cues.find((c) => t >= c.start && t < c.end) ??
    [...timing.cues].reverse().find((c) => c.start <= t) ??
    timing.cues[0]
  );
}

// Small in-place reaction; no flight across the frame or toward the camera.
// The displayed syllable changes exactly on its shared 30fps cue boundary.
export function letterMotion(age: number, duration: number) {
  const pulse = Math.sin(Math.PI * Math.min(age / Math.min(duration, 0.42), 1));
  return `translateY(${-30 * pulse}px) scale(${1 + 0.035 * pulse})`;
}

const Glyph: React.FC<{
  text: string;
  color: string;
  size: number;
  style?: React.CSSProperties;
}> = ({ text, color, size, style }) => (
  <div
    style={{
      fontFamily: font,
      fontSize: size,
      lineHeight: 1.12,
      color,
      WebkitTextStroke: '14px #fff9e8',
      paintOrder: 'stroke fill',
      textShadow: '0 16px 0 #8c6694, 0 26px 0 rgba(67,51,75,.10)',
      ...style,
    }}
  >
    {text}
  </div>
);

const Wheel: React.FC<{ x: number; y: number; angle: number }> = ({ x, y, angle }) => (
  <g transform={`translate(${x} ${y}) rotate(${angle})`}>
    <circle r="38" fill={INK} />
    <circle r="27" fill="#c8b5e9" />
    {[0, 60, 120].map((r) => (
      <rect
        key={r}
        x="-26"
        y="-4"
        width="52"
        height="8"
        rx="4"
        transform={`rotate(${r})`}
        fill="#fff3ce"
      />
    ))}
    <circle r="10" fill="#f1ab57" />
  </g>
);

export function rowProgress(t: number, row: number) {
  return smoothTrainProgress(t, timing.rows[row], timing.ends[row]);
}

const Train: React.FC<{ row: number }> = ({ row }) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const progress = rowProgress(t, row);
  const spacing = 320;
  const phase = (-progress * spacing) / 38;
  const angle = (phase * 180) / Math.PI;
  const base = 540 + progress * spacing;
  const y = 1340;
  return (
    <>
      <svg
        width="1080"
        height="420"
        style={{ position: 'absolute', top: y - 120, overflow: 'visible' }}
      >
        <path d="M -100 308 H 1180" stroke="#59627a" strokeWidth="13" />
        <path d="M -100 326 H 1180" stroke="#b7a8cb" strokeWidth="9" />
        {Array.from({ length: 23 }, (_, i) => (
          <path key={i} d={`M ${i * 64} 300 v 36`} stroke="#ac8a70" strokeWidth="12" />
        ))}
      </svg>
      {timing.letters.map((text, j) => {
        const x = 1080 - (base - j * spacing);
        return (
          <div
            key={j}
            style={{
              position: 'absolute',
              left: x - 140,
              top: y - 130,
              width: 280,
              height: 345,
            }}
          >
            <svg
              width="310"
              height="350"
              style={{ position: 'absolute', left: -15, top: 0, overflow: 'visible' }}
            >
              <path d="M -24 220 H 12 M 298 220 H 326" stroke="#b98b69" strokeWidth="12" />
              <rect x="20" y="70" width="270" height="183" rx="23" fill={colors[j]} />
              <rect x="8" y="48" width="294" height="35" rx="15" fill="#8c7bbb" />
              <rect x="41" y="92" width="228" height="140" rx="16" fill="#fff5d8" />
              <rect x="11" y="245" width="290" height="28" rx="10" fill="#e5a253" />
              <Wheel x={72} y={285} angle={angle} />
              <Wheel x={238} y={285} angle={angle} />
              <path
                d={`M ${72 + 18 * Math.cos(phase)} ${285 + 18 * Math.sin(phase)} h166`}
                stroke="#f6dda1"
                strokeWidth="10"
                strokeLinecap="round"
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                left: 20,
                top: 85,
                width: 240,
                textAlign: 'center',
                fontSize: 142,
                lineHeight: 1,
                fontFamily: font,
                color: colors[j],
                transform: `rotate(${3 * Math.sin(t * 8 + j)}deg)`,
                opacity: t >= timing.rows[row][0] ? 1 : 0,
              }}
            >
              {text}
            </div>
          </div>
        );
      })}
      <div
        className="gagya-rive"
        style={{
          position: 'absolute',
          left: 1080 - (base + 90) - 610,
          top: y - 146,
          width: 610,
          height: 353,
          transform: 'scaleX(-1)',
        }}
      >
        <Rive artboard="Locomotive" animation="Wheels pistons steam" />
      </div>
    </>
  );
};

const Sparks: React.FC<{ t: number; burst?: boolean }> = ({ t, burst = false }) => (
  <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
    {Array.from({ length: burst ? 45 : 8 }, (_, i) => {
      const p = (t * (burst ? 0.37 : 0.5) + i * 0.137) % 1;
      const x = burst
        ? 540 + Math.cos(i * 2.4) * p * 740
        : i % 2 === 0
          ? 55 + ((i * 19) % 110)
          : 915 + ((i * 17) % 110);
      const y = burst ? 780 + Math.sin(i * 2.4) * p * 570 + p * p * 620 : 600 + ((i * 159) % 650);
      const s = (burst ? 14 : 20) * (1 - p * 0.5);
      return (
        <g
          key={i}
          transform={`translate(${x} ${y}) rotate(${t * 80 + i * 47})`}
          opacity={burst ? 1 - p : 0.42}
        >
          <path
            d={`M 0 ${-s} L ${s * 0.3} ${-s * 0.3} L ${s} 0 L ${s * 0.3} ${s * 0.3} L 0 ${s} L ${-s * 0.3} ${s * 0.3} L ${-s} 0 L ${-s * 0.3} ${-s * 0.3} Z`}
            fill={colors[i % 10]}
          />
        </g>
      );
    })}
  </svg>
);

export const GagyaSong: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const cue = cueAt(t);
  const i = cue.index;
  const active = t >= cue.start && t < cue.end;
  const age = Math.max(0, t - cue.start);
  const duration = cue.end - cue.start;
  const isTrain =
    (t >= timing.rows[1][0] - 0.8 && t < timing.ends[1] + 0.3) ||
    (t >= timing.rows[3][0] - 0.8 && t < timing.ends[3] + 0.3);
  const finale = t >= 17.0;
  const fast = t >= 8.55 && t < 13.5;
  const prelude = t < timing.rows[0][0];
  const sceneTint = isTrain ? '#a8e4db' : fast ? '#e5c6ee' : '#ffe783';
  const titleScale = prelude ? interpolate(frame, [0, 12, 30], [0.6, 1.08, 1], clamp) : 1;
  return (
    <AbsoluteFill style={{ backgroundColor: sceneTint, fontFamily: font, overflow: 'hidden' }}>
      <Fonts />
      <style>{`.gagya-rive canvas{width:100% !important;height:100% !important;display:block}`}</style>
      <Img
        src={staticFile(A + 'stage.png')}
        style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <div
        style={{
          position: 'absolute',
          inset: '290px 0 370px',
          background: sceneTint,
          opacity: isTrain ? 0.95 : fast ? 0.85 : 0,
          borderRadius: 80,
        }}
      />
      <Audio src={staticFile(A + 'song.mp3')} />
      <div
        style={{
          position: 'absolute',
          top: 145,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 112,
          color: INK,
          WebkitTextStroke: '9px #fff9e8',
          paintOrder: 'stroke fill',
          textShadow: '0 10px 0 #e4b65c',
          transform: `scale(${titleScale})`,
        }}
      >
        가갸거 송
      </div>
      {!finale && (
        <div
          style={{
            position: 'absolute',
            top: 345,
            left: 140,
            width: 800,
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            rowGap: 18,
            textAlign: 'center',
          }}
        >
          {timing.letters.map((letter, j) => (
            <div
              key={letter}
              style={{
                fontSize: 106,
                lineHeight: 1.1,
                color: active && j === i ? colors[j] : '#9a967d',
                WebkitTextStroke: '6px #fff9e8',
                paintOrder: 'stroke fill',
                opacity: active && j === i ? 1 : 0.65,
                transform: `translateY(${active && j === i ? -12 : 0}px) scale(${active && j === i ? 1.18 : 1})`,
              }}
            >
              {letter}
            </div>
          ))}
        </div>
      )}
      {prelude ? (
        <>
          <div
            style={{
              position: 'absolute',
              top: 740,
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              gap: 20,
            }}
          >
            {['가', '갸'].map((g, j) => (
              <Glyph
                key={g}
                text={g}
                color={colors[j * 3]}
                size={320}
                style={{
                  transform: `translateY(${-30 * Math.abs(Math.sin(t * 6 + j))}px) rotate(${(j - 1) * 6}deg)`,
                  alignSelf: 'center',
                }}
              />
            ))}
          </div>
        </>
      ) : finale ? (
        <>
          <div
            style={{
              position: 'absolute',
              top: 570,
              left: 90,
              right: 90,
              display: 'grid',
              gridTemplateColumns: 'repeat(5,1fr)',
              rowGap: 115,
              textAlign: 'center',
            }}
          >
            {timing.letters.map((g, j) => (
              <Glyph
                key={g}
                text={g}
                color={colors[j]}
                size={168}
                style={{
                  transform: `translateY(${-90 * Math.abs(Math.sin((t - 17) * 6 - j * 0.4))}px) rotate(${16 * Math.sin((t - 17) * 4 + j)}deg)`,
                  WebkitTextStroke: '8px #fff9e8',
                }}
              />
            ))}
          </div>
          <Sparks t={t - 17} burst />
        </>
      ) : (
        <>
          <div
            style={{
              position: 'absolute',
              left: 70,
              right: 70,
              top: isTrain ? 660 : 650,
              textAlign: 'center',
              transform: letterMotion(age, duration),
            }}
          >
            <Glyph text={cue.text} color={colors[i]} size={isTrain ? 330 : 400} />
          </div>
          {isTrain ? (
            <>
              <Train row={t < 9 ? 1 : 3} />
            </>
          ) : (
            <>
              <Sparks t={t} />
            </>
          )}
        </>
      )}
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <Composition
    id="GagyaSong"
    component={GagyaSong}
    durationInFrames={timing.frames}
    fps={30}
    width={1080}
    height={1920}
  />
);

registerRoot(Root);
