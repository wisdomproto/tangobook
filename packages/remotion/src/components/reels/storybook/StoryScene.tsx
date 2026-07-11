import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';

const { fontFamily } = loadFont('normal', { weights: ['700', '800'] });

const IMG_H = 860; // 풀폭 세로 긴 패널 → 16:9 원본은 좌우가 살짝 잘리며 크게

/** 삽화를 풀폭 대형 패널에 cover로 담고(좌우 약간 크롭), 컷 사이 크로스페이드 + 완만한 줌.
 *  원격 R2 URL을 <Img src={url}> 로 로드(staticFile 아님). */
const ImageBox: React.FC<{ imageUrls: string[] }> = ({ imageUrls }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const n = imageUrls.length;
  const per = durationInFrames / n;
  const FADE = Math.min(10, per / 3);
  return (
    <div
      style={{
        width: '100%',
        height: IMG_H,
        borderRadius: 28,
        overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(120,60,30,0.22)',
        backgroundColor: '#241a14',
        position: 'relative',
      }}
    >
      {imageUrls.map((src, i) => {
        const local = frame - i * per;
        const fadeIn =
          i === 0
            ? 1
            : interpolate(local, [-FADE, 0], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
        const fadeOut =
          i === n - 1
            ? 1
            : interpolate(local, [per - FADE, per], [1, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
        const opacity = Math.min(fadeIn, fadeOut);
        if (opacity <= 0) return null;
        const zoom = interpolate(local, [0, per], [1.0, 1.05]);
        return (
          <Img
            key={src}
            src={src}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover', // 컨테이너가 16:9라 원본 16:9는 잘림 없음
              opacity,
              transform: `scale(${zoom})`,
            }}
          />
        );
      })}
    </div>
  );
};

interface Props {
  title: string; // 상단 카드 제목
  body: string; // 하단 내용
  imageUrls: string[];
  hero?: boolean; // 첫 씬은 제목 크게
}

export const StoryScene: React.FC<Props> = ({ title, body, imageUrls, hero }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const titleDown = interpolate(frame, [2, 18], [-40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleOpacity = interpolate(frame, [2, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 긴 줄거리는 문장 단위로 순차 노출(한 번에 벽처럼 뜨지 않게). 문장 끝(. ! ?) 기준 분할.
  // 짧은 캡션(문장 1개)은 그대로 한 번에 표시.
  const segments = body
    .split(/(?<=[.!?])\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  const segLen = durationInFrames / segments.length;
  const segIdx =
    segments.length > 1 ? Math.min(Math.floor(frame / segLen), segments.length - 1) : 0;
  const shownBody = segments[segIdx] ?? body;
  const local = frame - segIdx * segLen;
  // 첫 세그먼트는 씬 등장 애니, 이후 세그먼트는 각자 페이드/슬라이드 인.
  const segEnter = interpolate(local, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const firstEnter = interpolate(frame, [12, 28], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const bodyOpacity = segIdx === 0 ? Math.min(firstEnter, segEnter) : segEnter;
  const bodyUp = interpolate(bodyOpacity, [0, 1], [40, 0]);
  // 폰트는 현재 보이는 세그먼트 길이에 맞춰 자동 축소.
  const segLenChars = shownBody.replace(/\n/g, '').length;
  const bodyFont = segLenChars > 60 ? 44 : segLenChars > 44 ? 50 : segLenChars > 28 ? 54 : 58;

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(165deg, #FFF3E9 0%, #FFE1CC 100%)',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '140px 24px 150px',
      }}
    >
      {/* 상단: 브랜드 키커 + 카드 제목 */}
      <div
        style={{
          textAlign: 'center',
          transform: `translateY(${titleDown}px)`,
          opacity: titleOpacity,
        }}
      >
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 40,
            color: '#fff',
            backgroundColor: '#FF6B5E',
            borderRadius: 999,
            padding: '12px 36px',
            display: 'inline-block',
            marginBottom: 26,
            boxShadow: '0 8px 22px rgba(255,107,94,0.35)',
          }}
        >
          탱고북 그림책
        </div>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: hero ? 108 : 92,
            color: '#2B2B2B',
            lineHeight: 1.18,
            wordBreak: 'keep-all',
          }}
        >
          {title}
        </div>
      </div>

      {/* 가운데: 16:9 삽화 (잘림 없음) */}
      <ImageBox imageUrls={imageUrls} />

      {/* 하단: 내용 텍스트 */}
      <div
        style={{
          fontFamily,
          fontWeight: 700,
          fontSize: bodyFont,
          color: '#4A3B33',
          textAlign: 'center',
          lineHeight: 1.4,
          whiteSpace: 'pre-line',
          wordBreak: 'keep-all',
          maxWidth: 980,
          transform: `translateY(${bodyUp}px)`,
          opacity: bodyOpacity,
        }}
      >
        {shownBody}
      </div>
    </AbsoluteFill>
  );
};
