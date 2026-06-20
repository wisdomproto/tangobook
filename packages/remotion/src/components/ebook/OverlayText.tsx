import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import type { EbookOverlay, EbookLang } from '../../data/mosquito-ebook';

/**
 * 이미지 위 텍스트 오버레이 1개. anim 별 등장 + 등장 후 가벼운 idle(살짝 떠다님)로 정적이지 않게.
 *  - drop  : 위에서 덜컥 떨어지며 바운스 (의성어)
 *  - pop   : 작게→크게 오버슈트 (키워드/강조)
 *  - shake : 등장 후 부르르 흔들림 (강조)
 *  - fade  : 부드러운 페이드 (제목/라벨)
 * 등장 시점(appearFrame, 페이지 로컬 프레임)은 부모가 TTS 싱크로 계산해 넘긴다.
 */
export const OverlayText: React.FC<{
  overlay: EbookOverlay;
  lang: EbookLang;
  appearFrame: number;
}> = ({ overlay, lang, appearFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const text = overlay.text[lang];
  if (!text) return null;

  const t = frame - appearFrame;
  const FS = overlay.fontSize * 1.2; // 전역 글자 크기 배율(가독성 ↑)

  // 단어 하나씩 순차 등장. 키워드 나열용. 방향: row(가로, 기본) | col(세로).
  if (overlay.stagger) {
    const words = text.split(/\s+/).filter(Boolean);
    const stepFrames = Math.round(0.5 * fps); // 단어 간격
    const isCol = overlay.staggerDir === 'col';
    return (
      <div
        style={{
          position: 'absolute',
          left: `${overlay.x * 100}%`,
          top: `${overlay.y * 100}%`,
          // 세로는 위에서 아래로 자라도록 top 기준, 가로는 점 중심.
          transform: `translate(-50%, ${isCol ? '0' : '-50%'}) rotate(${overlay.rotate ?? 0}deg)`,
          display: 'flex',
          flexDirection: isCol ? 'column' : 'row',
          alignItems: 'center',
          gap: FS * (isCol ? 0.28 : 0.5),
          pointerEvents: 'none',
        }}
      >
        {words.map((w, i) => {
          const wt = t - i * stepFrames;
          const a = spring({ frame: wt, fps, config: { damping: 12, mass: 0.6, stiffness: 150 } });
          const op = interpolate(wt, [0, 4], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const dy = interpolate(a, [0, 1], [FS * 0.5, 0]);
          return (
            <div
              key={i}
              style={{
                opacity: op,
                transform: `translateY(${dy}px)`,
                fontSize: FS,
                fontWeight: 800,
                lineHeight: 1.1,
                color: overlay.color,
                fontFamily: '"NanumSquareRound", "Noto Sans JP", system-ui, sans-serif',
                WebkitTextStroke: '2px #fff',
                paintOrder: 'stroke fill',
                textShadow: '0 3px 6px rgba(0,0,0,0.28)',
                whiteSpace: 'nowrap',
              }}
            >
              {w}
            </div>
          );
        })}
      </div>
    );
  }

  const appear = spring({ frame: t, fps, config: { damping: 10, mass: 0.7, stiffness: 140 } });
  const opacity = interpolate(t, [0, 5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const baseRotate = overlay.rotate ?? 0;
  // 등장 후 idle: 가벼운 상하 부유 + 미세 호흡(제목/라벨은 차분하게 제외).
  const lively = overlay.kind === '의성어' || overlay.kind === '키워드';
  const idle =
    lively && t > 0
      ? interpolate(t, [10, 24], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      : 0;
  const bobY = idle * Math.sin(t / 14) * 4;
  const breathe = 1 + idle * Math.sin(t / 18) * 0.02;

  let translateY = bobY;
  let scale = breathe;
  let rotate = baseRotate;

  if (overlay.anim === 'drop') {
    const dy = interpolate(appear, [0, 1], [-FS * 1.4, 0]);
    translateY = dy + bobY;
  } else if (overlay.anim === 'pop') {
    // spring 오버슈트로 0→1.x→1 통통 등장
    scale = interpolate(appear, [0, 1], [0.2, 1]) * breathe;
  } else if (overlay.anim === 'shake') {
    const decay = interpolate(t, [0, 45], [1, 0], { extrapolateRight: 'clamp' });
    rotate = baseRotate + (t > 0 ? Math.sin(t / 1.7) * 10 * decay : 0);
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: `${overlay.x * 100}%`,
        top: `${overlay.y * 100}%`,
        transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale}) rotate(${rotate}deg)`,
        opacity,
        fontSize: FS,
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
