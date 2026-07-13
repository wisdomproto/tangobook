import React from 'react';
import { AbsoluteFill, Img } from 'remotion';
import { z } from 'zod';
import { loadFont as loadJua } from '@remotion/google-fonts/Jua';
import { loadFont as loadBaloo2 } from '@remotion/google-fonts/Baloo2';
import { loadFont as loadZCOOLKuaiLe } from '@remotion/google-fonts/ZCOOLKuaiLe';
import { loadFont as loadNotoSansThai } from '@remotion/google-fonts/NotoSansThai';
import { loadFont as loadNotoSansJP } from '@remotion/google-fonts/NotoSansJP';

// 16:9 YouTube 썸네일 스틸. 배치 파이프라인이 selectComposition + renderStill 로 PNG 생성.
export const LT_W = 1280;
export const LT_H = 720;

export const LongformThumbSchema = z.object({
  title: z.string(),
  heroImageUrl: z.string(),
  lang: z.string(),
  styleLabel: z.string().optional(),
});
export type LongformThumbProps = z.infer<typeof LongformThumbSchema>;

// 언어별 제목 폰트 — packages/shared/src/constants/cover-fonts.ts 와 동일한 family 선택을
// Remotion 에서 로드 가능한 @remotion/google-fonts 모듈로 미러링(Jua/ZCOOLKuaiLe 는 400 단일 굵기만 존재).
const { fontFamily: juaFamily } = loadJua('normal', { weights: ['400'] });
const { fontFamily: balooFamily } = loadBaloo2('normal', { weights: ['700', '800'] });
const { fontFamily: zcoolFamily } = loadZCOOLKuaiLe('normal', { weights: ['400'] });
const { fontFamily: notoThaiFamily } = loadNotoSansThai('normal', { weights: ['700'] });
const { fontFamily: notoJpFamily } = loadNotoSansJP('normal', { weights: ['700'] });

const TITLE_FONT_BY_LANG: Record<string, { family: string; weight: number }> = {
  ko: { family: juaFamily, weight: 400 },
  en: { family: balooFamily, weight: 800 },
  es: { family: balooFamily, weight: 800 },
  fr: { family: balooFamily, weight: 800 },
  de: { family: balooFamily, weight: 800 },
  ms: { family: balooFamily, weight: 800 },
  id: { family: balooFamily, weight: 800 },
  vi: { family: balooFamily, weight: 800 },
  zh: { family: zcoolFamily, weight: 400 },
  ja: { family: notoJpFamily, weight: 700 },
  th: { family: notoThaiFamily, weight: 700 },
};

function titleFont(lang: string): { family: string; weight: number } {
  return TITLE_FONT_BY_LANG[lang] ?? { family: balooFamily, weight: 800 };
}

export const LongformThumbnail: React.FC<LongformThumbProps> = ({
  title,
  heroImageUrl,
  lang,
  styleLabel,
}) => {
  const font = titleFont(lang);

  return (
    <AbsoluteFill style={{ backgroundColor: '#241a14' }}>
      {/* 배경 삽화 — 🔴 encodeURI 필수(R2 한글 파일명, raw non-ASCII src 는 헤드리스 크롬에서 로드 실패) */}
      <AbsoluteFill>
        <Img
          src={encodeURI(heroImageUrl)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </AbsoluteFill>

      {/* 하단 스크림 — 제목 가독성 */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.35) 62%, rgba(0,0,0,0.68) 100%)',
        }}
      />

      {/* 제목 (좌하단) */}
      <AbsoluteFill
        style={{
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
          padding: '0 64px 56px',
        }}
      >
        {styleLabel ? (
          <div
            style={{
              fontFamily: balooFamily,
              fontWeight: 700,
              fontSize: 26,
              color: '#fff',
              backgroundColor: 'rgba(0,0,0,0.4)',
              borderRadius: 999,
              padding: '8px 22px',
              marginBottom: 18,
              letterSpacing: 0.2,
            }}
          >
            {styleLabel}
          </div>
        ) : null}
        <div
          style={{
            fontFamily: font.family,
            fontWeight: font.weight,
            fontSize: 92,
            lineHeight: 1.14,
            color: '#fff',
            maxWidth: 980,
            wordBreak: 'keep-all',
            whiteSpace: 'pre-wrap',
            textShadow:
              '0 2px 0 rgba(0,0,0,0.55), 0 10px 30px rgba(0,0,0,0.55), 0 0 14px rgba(0,0,0,0.35)',
          }}
        >
          {title}
        </div>
      </AbsoluteFill>

      {/* 탱고북 워드마크 (우하단) — 브랜드명은 항상 한글이므로 Jua 고정(언어 무관) */}
      <div
        style={{
          position: 'absolute',
          right: 40,
          bottom: 40,
          fontFamily: juaFamily,
          fontWeight: 400,
          fontSize: 30,
          color: '#fff',
          backgroundColor: 'rgba(255,107,94,0.94)',
          borderRadius: 999,
          padding: '12px 28px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
        }}
      >
        탱고북
      </div>
    </AbsoluteFill>
  );
};
