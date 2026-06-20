import React from 'react';
import {
  AbsoluteFill,
  Img,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from 'remotion';
import type { EbookPage, EbookLang, EbookOverlay } from '../../data/mosquito-ebook';
import { OverlayText } from './OverlayText';
import { EbookSubtitle } from './EbookSubtitle';
import { ttsStartFrame } from '../../utils/ebook-timing';

/** 개발용 좌표 그리드(10% 격자 + 오버레이 점/라벨). debugCoords 일 때만. */
const CoordGrid: React.FC<{ overlays: EbookOverlay[] }> = ({ overlays }) => (
  <>
    {Array.from({ length: 9 }, (_, i) => (i + 1) * 10).map((p) => (
      <React.Fragment key={p}>
        <div
          style={{
            position: 'absolute',
            left: `${p}%`,
            top: 0,
            bottom: 0,
            width: 1,
            background: 'rgba(255,0,0,.22)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: `${p}%`,
            left: 0,
            right: 0,
            height: 1,
            background: 'rgba(255,0,0,.22)',
          }}
        />
      </React.Fragment>
    ))}
    {overlays.map((o) => (
      <div
        key={o.id}
        style={{
          position: 'absolute',
          left: `${o.x * 100}%`,
          top: `${o.y * 100}%`,
          transform: 'translate(-50%,-50%)',
          width: 12,
          height: 12,
          borderRadius: 6,
          background: 'lime',
          outline: '2px solid #000',
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: 14,
            top: -6,
            fontSize: 13,
            color: 'lime',
            whiteSpace: 'nowrap',
            textShadow: '0 0 3px #000',
          }}
        >
          {o.id} ({o.x},{o.y})
        </span>
      </div>
    ))}
  </>
);

export const EbookPageScene: React.FC<{
  page: EbookPage;
  lang: EbookLang;
  debugCoords?: boolean;
}> = ({ page, lang, debugCoords }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  // 은은한 켄번스 (contain 유지 — scale 만 약하게)
  const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.045], {
    extrapolateRight: 'clamp',
  });
  const tts = page.ttsUrl[lang];
  const narration = page.narration[lang];

  return (
    <AbsoluteFill style={{ backgroundColor: '#f4f6ee' }}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <Img
            src={page.imageUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transform: `scale(${scale})`,
            }}
          />
          {page.overlays.map((o) => (
            <OverlayText key={o.id} overlay={o} lang={lang} />
          ))}
          {debugCoords && <CoordGrid overlays={page.overlays} />}
        </div>
      </AbsoluteFill>
      <EbookSubtitle text={narration} lang={lang} />
      {tts && (
        <Sequence from={ttsStartFrame(fps)}>
          <Audio src={tts} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
