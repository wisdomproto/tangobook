import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';

const { fontFamily } = loadFont('normal', { weights: ['700', '800'] });

// 광고 릴스 커버(썸네일) — 오프닝 감성 훅과 톤 통일. 9:16 스틸.
export const AD_THUMB_W = 1080;
export const AD_THUMB_H = 1920;

export const AdThumbnail: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#141019' }}>
      {/* 잠자리 감성 이미지 */}
      <AbsoluteFill>
        <Img
          src={staticFile('reels/hook-bedtime.webp')}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </AbsoluteFill>
      {/* 상하 스크림 */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(15,12,20,0.55) 0%, rgba(15,12,20,0) 26%, rgba(15,12,20,0) 44%, rgba(15,12,20,0.78) 72%, rgba(15,12,20,0.95) 100%)',
        }}
      />

      {/* 상단 브랜드 */}
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 90 }}>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 46,
            color: '#fff',
            backgroundColor: 'rgba(255,94,58,0.95)',
            borderRadius: 999,
            padding: '14px 40px',
            boxShadow: '0 8px 22px rgba(0,0,0,0.35)',
          }}
        >
          🐯 탱고북
        </div>
      </AbsoluteFill>

      {/* 하단 카피 */}
      <AbsoluteFill
        style={{
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingBottom: 150,
          gap: 30,
        }}
      >
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 96,
            color: '#fff',
            textAlign: 'center',
            lineHeight: 1.28,
            whiteSpace: 'pre-line',
            wordBreak: 'keep-all',
            textShadow: '0 6px 26px rgba(0,0,0,0.8)',
          }}
        >
          {'매일 밤,\n"한 번만 더\n읽어줘…"'}
        </div>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 44,
            color: '#141019',
            backgroundColor: '#FFD24D',
            borderRadius: 999,
            padding: '18px 44px',
            textAlign: 'center',
            wordBreak: 'keep-all',
            boxShadow: '0 8px 22px rgba(0,0,0,0.35)',
          }}
        >
          이제 탱고북이 대신 읽어줘요 📖
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
