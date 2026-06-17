#!/usr/bin/env node
/**
 * OG(Open Graph) 소셜 공유 이미지 생성기.
 *
 * 카톡/페북/트위터 링크 공유 + 검색 결과 썸네일용 1200×630 PNG 를 생성한다.
 * SVG(브랜드 그라데이션 + Pretendard 텍스트) 를 sharp(librsvg) 로 래스터라이즈한 뒤
 * 로고(호리 + 탱고북 워드마크) webp 를 합성한다.
 *
 * 산출물 → packages/client/public/
 *   og-image.png    기본/사이트 공통 (index.html · useSeo 기본값)
 *   og-invite.png   친구 초대(레퍼럴) 공유 전용 — "7일 무료 체험 선물"
 *
 * 폰트는 repo 에 번들된 Pretendard(OFL) 를 fontconfig 로 등록 → CDN/시스템 폰트 의존 X.
 *
 * 사용:
 *   pnpm --filter server og            # = node scripts/generate-og-images.mjs
 */
import sharp from 'sharp';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fontsDir = path.join(__dirname, 'assets', 'og-fonts');
const logoPath = path.join(__dirname, '..', '..', 'client', 'public', 'logo', 'logo-kr.webp');
const outDir = path.join(__dirname, '..', '..', 'client', 'public');

const W = 1200;
const H = 630;

// 브랜드 색 (design-system/tokens/colors.ts 와 동기화)
const C = {
  cream: '#FFF9F3',
  peach50: '#FFF8EF',
  peach100: '#FFF0E0',
  peach200: '#FFDDBF',
  coral100: '#FFE4DC',
  coral400: '#FF7A59',
  coral500: '#FF5E3A',
  coral600: '#E84B2A',
  mint100: '#D8F3E7',
  mint400: '#5CC99F',
  ink700: '#3F2F24',
  ink600: '#6D5A4C',
  fun: '#A78BFA',
};

/**
 * 번들 폰트만 보이는 임시 fontconfig 를 만들어 FONTCONFIG_FILE 로 등록.
 * 시스템 폰트/캐시 오염 없이 Pretendard 를 librsvg 가 인식하게 한다.
 */
async function setupFontconfig() {
  const cacheDir = path.join(os.tmpdir(), 'tangobook-og-fc-cache');
  await fs.mkdir(cacheDir, { recursive: true });
  const conf = `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${fontsDir}</dir>
  <cachedir>${cacheDir}</cachedir>
  <config></config>
</fontconfig>`;
  const confPath = path.join(os.tmpdir(), 'tangobook-og-fonts.conf');
  await fs.writeFile(confPath, conf, 'utf-8');
  process.env.FONTCONFIG_FILE = confPath;
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** 공통 배경 + 장식 도형 SVG 조각 */
function decor() {
  return `
    <circle cx="1080" cy="70" r="150" fill="${C.mint100}" opacity="0.55"/>
    <circle cx="120" cy="560" r="170" fill="${C.peach200}" opacity="0.45"/>
    <circle cx="1130" cy="540" r="90" fill="${C.coral100}" opacity="0.6"/>
    <circle cx="80" cy="90" r="50" fill="${C.coral100}" opacity="0.7"/>
  `;
}

function svgDefault() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.cream}"/>
      <stop offset="1" stop-color="${C.peach100}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${decor()}
  <g font-family="Pretendard" text-anchor="middle">
    <text x="600" y="468" font-weight="800" font-size="50" fill="${C.ink700}">동화로 자라는 4–7세 한글·영어 학습 플랫폼</text>
    <text x="600" y="524" font-weight="400" font-size="31" fill="${C.ink600}">AI 동화책 · 한글 파닉스 · 어휘 학습</text>
  </g>
  <g transform="translate(600 595)">
    <rect x="-118" y="-26" width="236" height="40" rx="20" fill="${C.coral500}"/>
    <text x="0" y="2" text-anchor="middle" font-family="Pretendard" font-weight="800" font-size="22" fill="#ffffff">tangobook.co.kr</text>
  </g>
</svg>`;
}

function svgInvite() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.peach100}"/>
      <stop offset="1" stop-color="${C.coral100}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg2)"/>
  ${decor()}
  <g transform="translate(96 116)">
    <rect x="0" y="0" width="248" height="56" rx="28" fill="${C.coral500}"/>
    <text x="124" y="37" text-anchor="middle" font-family="Pretendard" font-weight="800" font-size="26" fill="#ffffff">친구 초대 선물</text>
  </g>
  <g font-family="Pretendard">
    <text x="96" y="262" font-weight="800" font-size="74" fill="${C.coral600}">7일 무료 체험을</text>
    <text x="96" y="346" font-weight="800" font-size="74" fill="${C.coral600}">선물 받았어요</text>
    <text x="98" y="420" font-weight="400" font-size="33" fill="${C.ink700}">지금 가입하고 탱고북 동화 라이브러리를</text>
    <text x="98" y="466" font-weight="400" font-size="33" fill="${C.ink700}">우리 아이와 마음껏 즐겨보세요</text>
  </g>
  <g transform="translate(96 556)">
    <rect x="0" y="-30" width="270" height="44" rx="22" fill="${C.ink700}"/>
    <text x="135" y="0" text-anchor="middle" font-family="Pretendard" font-weight="800" font-size="22" fill="#ffffff">tangobook.co.kr</text>
  </g>
</svg>`;
}

/**
 * SVG 배경을 PNG 로 래스터라이즈한 뒤 로고를 합성.
 * @param logoW 로고 너비(px) / @param logo {top,left,centerX} 배치
 */
async function compose(svg, logo, outFile) {
  const base = await sharp(Buffer.from(svg)).png().toBuffer();
  const logoBuf = await sharp(logoPath)
    .resize({ width: logo.width })
    .png()
    .toBuffer();
  const meta = await sharp(logoBuf).metadata();
  const left = logo.centerX != null ? Math.round(logo.centerX - meta.width / 2) : logo.left;
  await sharp(base)
    .composite([{ input: logoBuf, top: logo.top, left }])
    .png({ compressionLevel: 9 })
    .toFile(outFile);
  return outFile;
}

async function main() {
  await setupFontconfig();
  await fs.mkdir(outDir, { recursive: true });

  // 기본 OG: 로고 상단 중앙
  const f1 = await compose(svgDefault(), { width: 560, centerX: 600, top: 74 }, path.join(outDir, 'og-image.png'));
  console.log(`✓ ${path.relative(process.cwd(), f1)}`);

  // 초대 OG: 로고 우측 하단
  const f2 = await compose(svgInvite(), { width: 430, left: 700, top: 318 }, path.join(outDir, 'og-invite.png'));
  console.log(`✓ ${path.relative(process.cwd(), f2)}`);

  console.log('[og] 완료. 1200×630 소셜 공유 이미지 2종 생성.');
}

main().catch((e) => {
  console.error('[og] FATAL:', e);
  process.exit(1);
});
