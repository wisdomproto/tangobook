import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';
import { REEL_FPS, REEL_WIDTH } from '../../../data/storybook-reel';

const { fontFamily } = loadFont('normal', { weights: ['700', '800'] });

interface Props {
  headline: string;
  covers: string[]; // 8(라벨 모드) 또는 전권(스크롤 모드)
  labels?: string[]; // 없으면 전권 스크롤 모드
  headerTitle?: string; // 다른 씬과 같은 헤더(브랜드+책 제목) — 이 화면만 프레임이 없으면 "혼자 다른 영상 같다"
}

/** 전권을 4열 그리드로 깔고 위로 천천히 흘린다.
 *  🔴 "45편"이라고 써 놓고 8칸만 보여주면 숫자가 안 믿긴다(사용자 피드백) → 표지가 화면 밖으로
 *  계속 흘러 나가는 것 자체가 규모의 증거다. 라벨은 안 단다(45개면 글자 벽 + 표지에 제목이 이미 있다). */
const ScrollGrid: React.FC<{ covers: string[] }> = ({ covers }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const COLS = 4;
  const GAP = 14;
  const PAD = 24;
  // 🔴 내림 필수 — 소수점 폭(247.5)이면 4개 합이 컨테이너를 아주 살짝 넘어 3열로 줄바꿈된다.
  const TILE_W = Math.floor((REEL_WIDTH - PAD * 2 - GAP * (COLS - 1)) / COLS) - 1;
  const TILE_H = Math.round((TILE_W * 9) / 16);
  const rows = Math.ceil(covers.length / COLS);
  const totalH = rows * TILE_H + (rows - 1) * GAP;
  const VIEW_H = 1180;
  // 마지막 1초는 멈춰서 끝을 보여준다 — 끝까지 흐르다 컷되면 "잘렸다"가 된다.
  const y = interpolate(
    frame,
    [0, Math.max(1, durationInFrames - REEL_FPS)],
    [0, Math.max(0, totalH - VIEW_H)],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
  return (
    <div style={{ width: '100%', height: VIEW_H, overflow: 'hidden', position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center', // 마지막 줄이 덜 차면 가운데로 — 왼쪽에 붙으면 잘린 것처럼 보인다
          gap: GAP,
          padding: `0 ${PAD}px`,
          transform: `translateY(${-y}px)`,
        }}
      >
        {covers.map((url, i) => (
          <div
            key={i}
            style={{
              width: TILE_W,
              height: TILE_H,
              borderRadius: 14,
              overflow: 'hidden',
              backgroundColor: '#241a14',
              boxShadow: '0 8px 20px rgba(120,60,30,0.18)',
            }}
          >
            <Img src={url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
        ))}
      </div>
      {/* 위·아래 페이드 — 창 밖으로 흘러 나가는 느낌(딱 잘린 모서리 방지) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 70,
          background: 'linear-gradient(#FFF6EE, rgba(255,246,238,0))',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 70,
          background: 'linear-gradient(rgba(255,226,205,0), #FFE2CD)',
        }}
      />
    </div>
  );
};

export const SeriesShowcase: React.FC<Props> = ({ headline, covers, labels, headerTitle }) => {
  const frame = useCurrentFrame();
  const items = covers.slice(0, 8);
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(165deg, #FFF3E9 0%, #FFE1CC 100%)',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        // 🔴 가로 패딩 0 — 스크롤 그리드가 화면 폭을 그대로 써야 4열이 들어간다(패딩을 남기면
        // 타일 4개가 안 들어가 3열로 줄바꿈된다). 여백이 필요한 자식만 각자 padding 을 준다.
        padding: '56px 0 48px',
      }}
    >
      {/* ── 헤더: StoryScene 과 동일 프레임 ── */}
      <div style={{ textAlign: 'center', width: '100%' }}>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 30,
            color: '#fff',
            backgroundColor: '#FF6B5E',
            borderRadius: 999,
            padding: '8px 26px',
            display: 'inline-block',
            letterSpacing: 1,
          }}
        >
          탱고북 · 읽어주는 그림책
        </div>
        {headerTitle ? (
          <div
            style={{
              fontFamily,
              fontWeight: 800,
              fontSize: 56, // StoryScene 헤더와 동일
              color: '#7A5A48',
              marginTop: 12,
              wordBreak: 'keep-all',
              lineHeight: 1.25,
              paddingLeft: 40,
              paddingRight: 40,
            }}
          >
            {headerTitle}
          </div>
        ) : null}
      </div>

      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 44,
        }}
      >
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 76,
            color: '#2B2B2B',
            textAlign: 'center',
            lineHeight: 1.2,
            wordBreak: 'keep-all',
            whiteSpace: 'pre-line', // 헤드라인의 \n 을 줄바꿈으로
            paddingLeft: 48,
            paddingRight: 48,
            opacity: interpolate(frame, [2, 18], [0, 1], { extrapolateRight: 'clamp' }),
          }}
        >
          {headline}
        </div>
        {!labels?.length ? (
          <ScrollGrid covers={covers} />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 24,
              width: '100%',
              padding: '0 48px',
            }}
          >
            {items.map((url, i) => {
              // 스태거를 짧게 — 예전(6+3i → 18+3i)은 마지막 타일이 ~1.3s 까지 흐려서 "미완성 같다"는 피드백.
              const enter = interpolate(frame, [3 + i * 1.5, 11 + i * 1.5], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              return (
                <div
                  key={url}
                  style={{ opacity: enter, transform: `translateY(${(1 - enter) * 20}px)` }}
                >
                  <div
                    style={{
                      // 🔴 표지는 16:9 — 정사각(1/1)+cover 로 담으면 좌우가 잘려 표지에 박힌 제목 글씨가 날아간다.
                      aspectRatio: '16 / 9',
                      borderRadius: 22,
                      overflow: 'hidden',
                      boxShadow: '0 12px 30px rgba(120,60,30,0.2)',
                      backgroundColor: '#241a14',
                    }}
                  >
                    <Img
                      src={url}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <div
                    style={{
                      fontFamily,
                      fontWeight: 700,
                      fontSize: 30,
                      color: '#4A3B33',
                      textAlign: 'center',
                      marginTop: 10,
                      wordBreak: 'keep-all',
                    }}
                  >
                    {labels[i]}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 푸터: StoryScene 과 동일 ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <Img src={staticFile('reels/logo/logo-kr.webp')} style={{ height: 58 }} />
        <div
          style={{ fontFamily, fontWeight: 800, fontSize: 34, color: '#B08268', letterSpacing: 1 }}
        >
          tangobook.co.kr
        </div>
      </div>
    </AbsoluteFill>
  );
};
