import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import type { EbookOverlay, EbookLang } from '../../data/mosquito-ebook';

/**
 * 이미지 위 텍스트 오버레이 1개. anim 별 등장:
 *  - drop  : 위에서 덜컥 떨어지며 바운스 (의성어)
 *  - pop   : 작게→크게 통통 (키워드)
 *  - shake : 등장 후 부르르 흔들림 (강조)
 *  - fade  : 부드러운 페이드 (제목/라벨)
 * 위치(x,y)는 이미지 박스 기준 0~1 중심 좌표.
 */
export const OverlayText: React.FC<{ overlay: EbookOverlay; lang: EbookLang }> = ({
  overlay,
  lang,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const text = overlay.text[lang];
  if (!text) return null;

  const t = frame - overlay.delaySec * fps;
  const appear = spring({ frame: t, fps, config: { damping: 11, mass: 0.7, stiffness: 120 } });
  const opacity = interpolate(t, [0, 5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const baseRotate = overlay.rotate ?? 0;
  let animTransform = '';
  let rotate = baseRotate;

  if (overlay.anim === 'drop') {
    const dy = interpolate(appear, [0, 1], [-overlay.fontSize * 1.4, 0]);
    animTransform = `translateY(${dy}px)`;
  } else if (overlay.anim === 'pop') {
    const s = interpolate(appear, [0, 1], [0.2, 1]);
    animTransform = `scale(${s})`;
  } else if (overlay.anim === 'shake') {
    const decay = interpolate(t, [0, 40], [1, 0], { extrapolateRight: 'clamp' });
    rotate = baseRotate + (t > 0 ? Math.sin(t / 1.8) * 9 * decay : 0);
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: `${overlay.x * 100}%`,
        top: `${overlay.y * 100}%`,
        transform: `translate(-50%, -50%) ${animTransform} rotate(${rotate}deg)`,
        opacity,
        fontSize: overlay.fontSize,
        fontWeight: 800,
        lineHeight: 1.1,
        color: overlay.color,
        fontFamily: '"NanumSquareRound", "Noto Sans JP", system-ui, sans-serif',
        // 만화톤: 흰 외곽선 + 부드러운 그림자로 그림 위에서 또렷하게
        WebkitTextStroke: '2px #fff',
        paintOrder: 'stroke fill',
        textShadow: '0 3px 6px rgba(0,0,0,0.28)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        textAlign: 'center',
      }}
    >
      {text}
    </div>
  );
};
