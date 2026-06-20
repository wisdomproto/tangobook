import React from 'react';
import {
  AbsoluteFill,
  Img,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from 'remotion';
import type { EbookPage, EbookLang, EbookOverlay } from '../../data/mosquito-ebook';
import { OverlayText } from './OverlayText';
import { EbookSubtitle } from './EbookSubtitle';
import { ttsStartFrame, buildCaptions } from '../../utils/ebook-timing';

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
  const tts = page.ttsUrl[lang];
  const narration = page.narration[lang];

  // 켄번스: 줌 + 페이지별 팬. 팬은 항상 줌 오버스캔 안쪽으로만 → 가장자리(크림 배경) 노출 방지.
  const prog = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: 'clamp' });
  const scale = 1.06 + 0.08 * prog; // 1.06 → 1.14
  const overscanPct = (scale - 1) * 50; // 한 변당 여유(%) — 이 범위를 넘는 팬은 모서리를 드러냄
  const pan = overscanPct * 0.5 * prog; // 여유의 절반까지만 이동
  const dir = page.page % 4;
  const panX = (dir === 0 ? 1 : dir === 2 ? -1 : 0) * pan;
  const panY = (dir === 1 ? 1 : dir === 3 ? -1 : 0) * pan;

  // TTS 진행에 맞춘 자막 토막 + 오버레이 등장 타이밍.
  const captions = buildCaptions(narration, page.ttsDurationSec[lang], fps);
  const appearFrameOf = (o: EbookOverlay): number => {
    if (o.lineIndex != null && captions[o.lineIndex]) return captions[o.lineIndex].startFrame;
    return Math.round(o.delaySec * fps);
  };

  // 절대 URL(R2)은 그대로, 상대 경로(로컬 public)는 staticFile 로 해석 — 웹 Player·mp4 렌더 공통.
  const imgSrc = page.imageUrl.startsWith('http') ? page.imageUrl : staticFile(page.imageUrl);

  return (
    <AbsoluteFill style={{ backgroundColor: '#f5fada' }}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <Img
            src={imgSrc}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transform: `scale(${scale}) translate(${panX}%, ${panY}%)`,
            }}
          />
          {page.overlays.map((o) => (
            <OverlayText key={o.id} overlay={o} lang={lang} appearFrame={appearFrameOf(o)} />
          ))}
          {debugCoords && <CoordGrid overlays={page.overlays} />}
        </div>
      </AbsoluteFill>
      <EbookSubtitle captions={captions} lang={lang} />
      {tts && (
        <Sequence from={ttsStartFrame(fps)}>
          <Audio src={tts} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
