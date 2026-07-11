import React from 'react';
import { AbsoluteFill, Img } from 'remotion';
import { z } from 'zod';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';

const { fontFamily } = loadFont('normal', { weights: ['700', '800'] });

const R2 = 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev';

export const ThumbSchema = z.object({
  bookTitle: z.string(),
  coverUrl: z.string(),
  styles: z.array(z.object({ url: z.string(), label: z.string() })),
});
export type ThumbProps = z.infer<typeof ThumbSchema>;

/** 개구리 왕자 샘플 데이터 (encodeURI 된 R2 URL). */
export const THUMB_FROG: ThumbProps = {
  bookTitle: '개구리 왕자',
  coverUrl: `${R2}/1772009873865-%EA%B0%9C%EA%B5%AC%EB%A6%AC%EC%99%95%EC%9E%90-cover-misc-1779584931510.webp`,
  styles: [
    {
      url: `${R2}/1772009873865-%EA%B0%9C%EA%B5%AC%EB%A6%AC%EC%99%95%EC%9E%90-illustration-page12-1779583123055.webp`,
      label: '콜라주',
    },
    {
      url: `${R2}/1772009873865-%EA%B0%9C%EA%B5%AC%EB%A6%AC%EC%99%95%EC%9E%90-illustration-page12-1779427929742.webp`,
      label: '수채동화풍',
    },
    {
      url: `${R2}/1772009873865-%EA%B0%9C%EA%B5%AC%EB%A6%AC%EC%99%95%EC%9E%90-illustration-page12-1779840231880.webp`,
      label: '페이퍼 3D 아트',
    },
  ],
};

const chip = (): React.CSSProperties => ({
  fontFamily,
  fontWeight: 800,
  fontSize: 40,
  color: '#fff',
  backgroundColor: '#FF6B5E',
  borderRadius: 999,
  padding: '14px 40px',
  display: 'inline-block',
  boxShadow: '0 10px 26px rgba(255,107,94,0.4)',
});

/** ① 포스터형: 큰 제목 + 16:9 삽화 카드(온전, 크롭 없음) + 태그라인 */
export const ThumbPoster: React.FC<ThumbProps> = ({ bookTitle, coverUrl }) => {
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(165deg, #FFF3E9 0%, #FFDCC6 100%)',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '150px 60px 130px',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ ...chip(), marginBottom: 34 }}>탱고북 그림책</div>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 128,
            color: '#2B2B2B',
            lineHeight: 1.14,
            wordBreak: 'keep-all',
          }}
        >
          {bookTitle}
        </div>
      </div>

      <div
        style={{
          width: '100%',
          aspectRatio: '16 / 9',
          borderRadius: 40,
          overflow: 'hidden',
          boxShadow: '0 30px 70px rgba(120,60,30,0.28)',
          border: '10px solid #fff',
          backgroundColor: '#241a14',
        }}
      >
        <Img src={coverUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 60,
            color: '#4A3B33',
            lineHeight: 1.32,
            whiteSpace: 'pre-line',
            wordBreak: 'keep-all',
            marginBottom: 30,
          }}
        >
          {'다양한 그림체로 만나는\n명작 동화'}
        </div>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 46,
            color: '#fff',
            backgroundColor: '#FF6B5E',
            borderRadius: 999,
            padding: '20px 52px',
            display: 'inline-block',
            boxShadow: '0 12px 30px rgba(255,107,94,0.4)',
          }}
        >
          ▶ 지금 보기
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** ①+③ 하이브리드: 3그림체 세로 스택(풀블리드) + 포스터 브랜딩(제목·태그라인) + CTA */
export const ThumbHybrid: React.FC<ThumbProps> = ({ bookTitle, styles }) => {
  return (
    <AbsoluteFill style={{ flexDirection: 'column', backgroundColor: '#241a14' }}>
      {styles.map((s, i) => (
        <div key={s.url} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <Img src={s.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {i > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 6,
                backgroundColor: '#fff',
              }}
            />
          )}
          <div
            style={{
              position: 'absolute',
              left: 26,
              [i === styles.length - 1 ? 'top' : 'bottom']: 22,
              fontFamily,
              fontWeight: 800,
              fontSize: 38,
              color: '#2B2B2B',
              backgroundColor: 'rgba(255,255,255,0.94)',
              borderRadius: 999,
              padding: '10px 26px',
              boxShadow: '0 6px 18px rgba(0,0,0,0.22)',
            }}
          >
            {s.label}
          </div>
        </div>
      ))}
      {/* 상·하 스크림 + 제목(위) + CTA(아래) */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(to bottom, rgba(20,12,8,0.82) 0%, rgba(20,12,8,0.3) 15%, rgba(20,12,8,0) 30%, rgba(20,12,8,0) 78%, rgba(20,12,8,0.85) 100%)',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '84px 40px 70px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ ...chip(), fontSize: 34, padding: '10px 30px', marginBottom: 18 }}>
            탱고북 그림책
          </div>
          <div
            style={{
              fontFamily,
              fontWeight: 800,
              fontSize: 100,
              color: '#fff',
              lineHeight: 1.12,
              wordBreak: 'keep-all',
              textShadow: '0 6px 24px rgba(0,0,0,0.65)',
            }}
          >
            {bookTitle}
          </div>
          <div
            style={{
              fontFamily,
              fontWeight: 800,
              fontSize: 40,
              color: '#FFE9D6',
              marginTop: 14,
              textShadow: '0 3px 14px rgba(0,0,0,0.65)',
            }}
          >
            세 가지 그림체로 만나는 명작
          </div>
        </div>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 48,
            color: '#fff',
            backgroundColor: '#FF6B5E',
            borderRadius: 999,
            padding: '22px 60px',
            boxShadow: '0 14px 34px rgba(0,0,0,0.4)',
          }}
        >
          ▶ 지금 보기
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const NatureThumbSchema = z.object({
  bookTitle: z.string(),
  coverUrl: z.string(),
  headline: z.string(),
  categoryLabel: z.string(),
});
export type NatureThumbProps = z.infer<typeof NatureThumbSchema>;

export const THUMB_NATURE_SAMPLE: NatureThumbProps = {
  bookTitle: '기가노토사우루스',
  coverUrl: THUMB_FROG.coverUrl,
  headline: '티라노보다 컸다고?',
  categoryLabel: '공룡 친구들',
};

export const NatureThumb: React.FC<NatureThumbProps> = ({
  bookTitle,
  coverUrl,
  headline,
  categoryLabel,
}) => {
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(165deg, #FFF3E9 0%, #FFDCC6 100%)',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '130px 60px 120px',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ ...chip(), marginBottom: 28 }}>{categoryLabel}</div>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 104,
            color: '#2B2B2B',
            lineHeight: 1.12,
            wordBreak: 'keep-all',
          }}
        >
          {bookTitle}
        </div>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 66,
            color: '#FF6B5E',
            lineHeight: 1.2,
            marginTop: 22,
            wordBreak: 'keep-all',
          }}
        >
          {headline}
        </div>
      </div>
      <div
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          borderRadius: 40,
          overflow: 'hidden',
          boxShadow: '0 30px 70px rgba(120,60,30,0.28)',
          border: '10px solid #fff',
          backgroundColor: '#241a14',
        }}
      >
        <Img src={coverUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    </AbsoluteFill>
  );
};

/**
 * ④ 중앙정렬 포스터 (그리드 안전): 글자 없는 삽화를 풀블리드로 깔고, 제목·배지를
 *    세로 정중앙에 배치. 인스타 프로필 그리드가 위·아래를 잘라도(1:1~4:5 크롭) 제목이
 *    항상 보인다. 명작·자연관찰 공용 — 배지=카테고리/브랜드, headline=선택(자연관찰 훅).
 */
export const CenterPosterSchema = z.object({
  bookTitle: z.string(),
  heroUrl: z.string(),
  badge: z.string(),
  bg: z.string().optional(), // 배경 그라디언트 CSS (시리즈별 테마). 없으면 네이비.
  glowRgb: z.string().optional(), // 글로우 색 "r,g,b". 없으면 블루.
  badgeBg: z.string().optional(), // 배지 배경색 (시리즈별). 없으면 coral.
  headline: z.string().optional(),
});
export type CenterPosterProps = z.infer<typeof CenterPosterSchema>;

const DEFAULT_BG =
  'radial-gradient(ellipse 95% 62% at 50% 42%, #17436e 0%, #0b2540 46%, #050f1e 100%)';
const DEFAULT_GLOW = '120,185,255';
const DEFAULT_BADGE = '#FF6B5E';

export const THUMB_CENTER_SAMPLE: CenterPosterProps = {
  bookTitle: '개구리 왕자',
  heroUrl: THUMB_FROG.styles[0].url,
  badge: '명작 그림책',
};

export const CenterPoster: React.FC<CenterPosterProps> = ({
  bookTitle,
  heroUrl,
  badge,
  bg,
  glowRgb,
  badgeBg,
}) => {
  const glow = glowRgb || DEFAULT_GLOW;
  const badgeColor = badgeBg || DEFAULT_BADGE;
  return (
    <AbsoluteFill style={{ background: bg || DEFAULT_BG }}>
      {/* 카드 뒤 은은한 컬러 글로우 (시리즈 테마색) */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 68% 40% at 50% 46%, rgba(${glow},0.24) 0%, rgba(${glow},0) 62%)`,
        }}
      />
      {/* 중앙 스택: 배지 + 온전한 16:9 삽화(크롭 없음) + 큰 제목 — 세로 정중앙(그리드 안전) */}
      <AbsoluteFill
        style={{
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 52px',
          gap: 46,
        }}
      >
        <div
          style={{
            ...chip(),
            fontSize: 62,
            padding: '20px 60px',
            backgroundColor: badgeColor,
            boxShadow: `0 0 36px rgba(${glow},0.55), 0 10px 26px rgba(0,0,0,0.35)`,
          }}
        >
          {badge}
        </div>
        <div
          style={{
            width: '100%',
            aspectRatio: '16 / 9',
            borderRadius: 32,
            overflow: 'hidden',
            border: '6px solid rgba(255,255,255,0.96)',
            boxShadow: `0 0 64px rgba(${glow},0.6), 0 0 26px rgba(255,255,255,0.5), 0 20px 50px rgba(0,0,0,0.5)`,
            backgroundColor: '#0a1626',
          }}
        >
          <Img src={heroUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        {/* 제목 영역 고정 높이(2줄분) + 위 정렬 → 1줄/2줄 상관없이 이미지 위치 불변 */}
        <div
          style={{
            height: 340,
            width: '100%',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontFamily,
              fontWeight: 800,
              fontSize: 150,
              color: '#fff',
              textAlign: 'center',
              lineHeight: 1.06,
              wordBreak: 'keep-all',
              textShadow: `0 0 38px rgba(${glow},0.8), 0 0 14px rgba(255,255,255,0.55), 0 4px 18px rgba(0,0,0,0.5)`,
            }}
          >
            {bookTitle}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** ② 그림체 3분할: 같은 장면을 3개 그림체로 세로 스택 + 제목 오버레이 */
export const ThumbStyles: React.FC<ThumbProps> = ({ bookTitle, styles }) => {
  return (
    <AbsoluteFill style={{ flexDirection: 'column', backgroundColor: '#241a14' }}>
      {styles.map((s, i) => (
        <div key={s.url} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <Img src={s.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {/* 얇은 구분선 */}
          {i > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 6,
                backgroundColor: '#fff',
              }}
            />
          )}
          {/* 그림체 라벨 */}
          <div
            style={{
              position: 'absolute',
              left: 28,
              bottom: 24,
              fontFamily,
              fontWeight: 800,
              fontSize: 42,
              color: '#2B2B2B',
              backgroundColor: 'rgba(255,255,255,0.94)',
              borderRadius: 999,
              padding: '12px 30px',
              boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
            }}
          >
            {s.label}
          </div>
        </div>
      ))}
      {/* 상단 제목 오버레이 (스크림) */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(to bottom, rgba(20,12,8,0.78) 0%, rgba(20,12,8,0.35) 14%, rgba(20,12,8,0) 26%)',
          justifyContent: 'flex-start',
          alignItems: 'center',
          padding: '90px 40px 0',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ ...chip(), fontSize: 34, padding: '10px 30px', marginBottom: 20 }}>
            탱고북 그림책
          </div>
          <div
            style={{
              fontFamily,
              fontWeight: 800,
              fontSize: 96,
              color: '#fff',
              lineHeight: 1.12,
              wordBreak: 'keep-all',
              textShadow: '0 6px 24px rgba(0,0,0,0.6)',
            }}
          >
            {bookTitle}
          </div>
          <div
            style={{
              fontFamily,
              fontWeight: 800,
              fontSize: 40,
              color: '#FFE9D6',
              marginTop: 14,
              textShadow: '0 3px 14px rgba(0,0,0,0.6)',
            }}
          >
            한 권을 세 가지 그림체로
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
