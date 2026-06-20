import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import type { EbookLang } from '../../data/mosquito-ebook';

/** 하단 자막. narration 의 \n 을 줄바꿈으로 보존. 빈 문자열이면 렌더 안 함. */
export const EbookSubtitle: React.FC<{ text: string; lang: EbookLang }> = ({ text, lang }) => {
  const frame = useCurrentFrame();
  if (!text) return null;
  const opacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  // 긴 본문(부록 등)은 화면을 덜 채우도록 폰트 축소
  const fontSize = text.length > 140 ? 26 : text.length > 80 ? 30 : 34;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: '4.5%',
        display: 'flex',
        justifyContent: 'center',
        opacity,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          maxWidth: '86%',
          background: 'rgba(22,26,20,0.74)',
          color: '#fff',
          fontFamily:
            lang === 'ja'
              ? '"Noto Sans JP", system-ui, sans-serif'
              : '"Pretendard Variable", "NanumSquareRound", system-ui, sans-serif',
          fontSize,
          lineHeight: 1.42,
          fontWeight: 600,
          padding: '13px 28px',
          borderRadius: 16,
          textAlign: 'center',
          whiteSpace: 'pre-line',
          boxShadow: '0 6px 22px rgba(0,0,0,0.28)',
        }}
      >
        {text}
      </div>
    </div>
  );
};
