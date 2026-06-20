import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import type { EbookLang } from '../../data/mosquito-ebook';
import { activeCaption, type EbookCaption } from '../../utils/ebook-timing';

/**
 * 하단 자막. TTS 진행에 맞춰 나레이션을 한 줄씩 보여준다(통짜 X).
 * 활성 줄은 buildCaptions 의 startFrame 으로 결정, 줄이 바뀔 때 짧게 페이드.
 */
export const EbookSubtitle: React.FC<{ captions: EbookCaption[]; lang: EbookLang }> = ({
  captions,
  lang,
}) => {
  const frame = useCurrentFrame();
  const active = activeCaption(captions, frame);
  if (!active) return null;

  // 줄 전환 직후 짧은 페이드 인(해당 줄 시작 기준).
  const opacity = interpolate(frame, [active.startFrame, active.startFrame + 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fontSize = active.text.length > 40 ? 40 : active.text.length > 24 ? 48 : 56;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: '4.5%',
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        key={active.index}
        style={{
          maxWidth: '86%',
          opacity,
          background: 'rgba(22,26,20,0.74)',
          color: '#fff',
          fontFamily:
            lang === 'ja'
              ? '"Noto Sans JP", system-ui, sans-serif'
              : '"Pretendard Variable", "NanumSquareRound", system-ui, sans-serif',
          fontSize,
          lineHeight: 1.4,
          fontWeight: 600,
          padding: '14px 30px',
          borderRadius: 16,
          textAlign: 'center',
          whiteSpace: 'pre-line',
          boxShadow: '0 6px 22px rgba(0,0,0,0.28)',
        }}
      >
        {active.text}
      </div>
    </div>
  );
};
