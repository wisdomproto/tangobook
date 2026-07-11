import React from 'react';
import {
  AbsoluteFill,
  Img,
  staticFile,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';
import { SparkleParticles } from '../SparkleParticles';

const { fontFamily } = loadFont('normal', { weights: ['700', '800'] });

// 명작 동화 + 어휘 학습의 핵심 기능: 단어를 맞히면 그 단어가 나오는 동화 장면이 펼쳐진다.
// 예) 백설공주 → 🍎 사과(apple). 차분한 3단계: 질문 → 정답 → 장면 리빌.
const CHOICES = ['사과', '사자', '별'];
const ANSWER = 0;

export const VocabReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 타임라인(프레임 @30fps): 0 등장 · 45 정답선택 · 75 리빌 시작
  const answered = frame >= 45;
  const reveal = interpolate(frame, [75, 100], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cardIn = spring({ frame, fps, config: { damping: 14 } });
  const blur = interpolate(reveal, [0, 1], [16, 0]);
  const zoom = interpolate(reveal, [0, 1], [1.0, 1.06]);

  const correctPop = spring({ frame: frame - 45, fps, config: { damping: 10 } });
  const labelIn = spring({ frame: frame - 88, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ backgroundColor: '#FFF6EE' }}>
      {/* 상단 라벨 */}
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 150 }}>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 44,
            color: '#FF6B5E',
            backgroundColor: '#FFE4DC',
            borderRadius: 999,
            padding: '14px 40px',
          }}
        >
          단어 놀이 📖
        </div>
      </AbsoluteFill>

      {/* 동화 장면 카드 */}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div
          style={{
            position: 'relative',
            width: '84%',
            borderRadius: 28,
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(0,0,0,0.22)',
            transform: `scale(${(0.7 + cardIn * 0.3) * zoom})`,
          }}
        >
          <Img
            src={staticFile('reels/covers/cover-snow-white.webp')}
            style={{
              width: '100%',
              display: 'block',
              filter: `blur(${blur}px) brightness(${0.7 + reveal * 0.3})`,
            }}
          />
          {/* 리빌 시 단어 라벨 오버레이 */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 28,
              display: 'flex',
              justifyContent: 'center',
              opacity: labelIn,
              transform: `translateY(${(1 - labelIn) * 30}px)`,
            }}
          >
            <div
              style={{
                fontFamily,
                fontWeight: 800,
                fontSize: 52,
                color: '#fff',
                backgroundColor: 'rgba(255,94,58,0.92)',
                borderRadius: 999,
                padding: '14px 44px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              }}
            >
              🍎 사과 · apple
            </div>
          </div>
        </div>
      </AbsoluteFill>

      {/* 보기 칩 (정답 전) / 정답 도장 (정답 후) */}
      <AbsoluteFill
        style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 360 }}
      >
        {!answered ? (
          <div style={{ display: 'flex', gap: 20 }}>
            {CHOICES.map((c) => (
              <div
                key={c}
                style={{
                  fontFamily,
                  fontWeight: 800,
                  fontSize: 46,
                  color: '#2B2B2B',
                  backgroundColor: '#fff',
                  borderRadius: 24,
                  padding: '22px 44px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                }}
              >
                {c}
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              transform: `scale(${correctPop})`,
              fontFamily,
              fontWeight: 800,
              fontSize: 56,
              color: '#fff',
              backgroundColor: '#3AA87E',
              borderRadius: 999,
              padding: '18px 52px',
              boxShadow: '0 10px 28px rgba(0,0,0,0.2)',
            }}
          >
            ✓ 정답! {CHOICES[ANSWER]}
          </div>
        )}
      </AbsoluteFill>

      {/* 하단 카피 */}
      <AbsoluteFill
        style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 200 }}
      >
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 60,
            color: '#2B2B2B',
            textAlign: 'center',
            lineHeight: 1.3,
            whiteSpace: 'pre-line',
            textShadow: '0 2px 12px rgba(255,255,255,0.9)',
          }}
        >
          {reveal > 0.5 ? '그 장면이 펼쳐져요' : '단어를 맞히면'}
        </div>
      </AbsoluteFill>

      {reveal > 0.4 && <SparkleParticles seed={42} count={30} />}
    </AbsoluteFill>
  );
};
