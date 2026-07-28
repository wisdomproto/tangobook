#!/usr/bin/env node
/**
 * 네이버 블로그(blog.naver.com/tangobooks) 세팅용 이미지 생성기.
 *
 * generate-og-images.mjs 와 같은 방식 — 번들 Pretendard 를 fontconfig 로 등록해
 * SVG 를 sharp(librsvg) 로 굽고 로고 webp 를 합성한다. AI 생성 X, 한글이 깨지지 않는다.
 *
 * 산출물 → docs/marketing/naver/
 *   cover-pc.png      966×600   PC 블로그 커버(타이틀) 이미지
 *   cover-mobile.png  1080×1300 모바일 앱 커버
 *   profile.png       286×286   프로필 이미지 (기존 인스타 니들펠트 프로필 재사용)
 *
 * 🔴 모바일 커버는 네이버 앱이 블로그명·프로필을 그 위에 겹쳐 그린다.
 *    그래서 글자를 넣지 않고 분위기(호리+배경)만 둔다 — 겹치면 둘 다 안 읽힌다.
 *
 * 사용: node packages/server/scripts/generate-naver-blog-assets.mjs
 */
import sharp from 'sharp';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fontsDir = path.join(__dirname, 'assets', 'og-fonts');
const repoRoot = path.join(__dirname, '..', '..', '..');
const logoPath = path.join(repoRoot, 'packages/client/public/logo/logo-kr.webp');
// 🔴 커버 합성엔 투명 마스코트를 쓴다 — 인스타 프로필 PNG 는 자체 복숭아색 정사각
//    배경이 있어서 그라데이션 위에 네모 패치로 얹힌다.
const horiCutoutPath = path.join(repoRoot, 'packages/client/public/mascot/hori/idle.webp');
const horiProfilePath = path.join(repoRoot, 'docs/marketing/instagram-profile-felt-1080.png');
const outDir = path.join(repoRoot, 'docs/marketing/naver');

// 브랜드 색 (design-system/tokens/colors.ts)
const C = {
  cream: '#FFF9F3',
  peach100: '#FFF0E0',
  peach200: '#FFDDBF',
  coral100: '#FFE4DC',
  coral500: '#FF5E3A',
  mint100: '#D8F3E7',
  ink700: '#3F2F24',
  ink600: '#6D5A4C',
};

async function setupFontconfig() {
  const cacheDir = path.join(os.tmpdir(), 'tangobook-naver-fc-cache');
  await fs.mkdir(cacheDir, { recursive: true });
  const confPath = path.join(os.tmpdir(), 'tangobook-naver-fonts.conf');
  await fs.writeFile(
    confPath,
    `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig><dir>${fontsDir}</dir><cachedir>${cacheDir}</cachedir><config></config></fontconfig>`,
    'utf-8',
  );
  process.env.FONTCONFIG_FILE = confPath;
}

/** PC 커버 966×600 — 로고 + 한 줄 카피 + 도메인 pill */
function svgCoverPc(W, H) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.cream}"/>
      <stop offset="1" stop-color="${C.peach100}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="880" cy="70" r="130" fill="${C.mint100}" opacity="0.5"/>
  <circle cx="90" cy="530" r="150" fill="${C.peach200}" opacity="0.42"/>
  <circle cx="915" cy="520" r="80" fill="${C.coral100}" opacity="0.55"/>
  <circle cx="70" cy="80" r="44" fill="${C.coral100}" opacity="0.65"/>
  <g font-family="Pretendard" text-anchor="middle">
    <text x="${W / 2}" y="398" font-weight="800" font-size="42" fill="${C.ink700}">동화로 자라는 4–7세 한글·영어</text>
    <text x="${W / 2}" y="446" font-weight="400" font-size="27" fill="${C.ink600}">AI 동화책 · 한글 파닉스 · 어휘 학습</text>
  </g>
  <g transform="translate(${W / 2} 512)">
    <rect x="-108" y="-24" width="216" height="38" rx="19" fill="${C.coral500}"/>
    <text x="0" y="2" text-anchor="middle" font-family="Pretendard" font-weight="800" font-size="21" fill="#ffffff">tangobook.co.kr</text>
  </g>
</svg>`;
}

/** 모바일 커버 1080×1300 — 글자 없음(앱이 블로그명을 겹쳐 그림) */
function svgCoverMobile(W, H) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bgm" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.cream}"/>
      <stop offset="0.6" stop-color="${C.peach100}"/>
      <stop offset="1" stop-color="${C.peach200}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bgm)"/>
  <circle cx="930" cy="180" r="200" fill="${C.mint100}" opacity="0.45"/>
  <circle cx="130" cy="1080" r="230" fill="${C.coral100}" opacity="0.45"/>
  <circle cx="140" cy="230" r="70" fill="${C.coral100}" opacity="0.55"/>
  <circle cx="960" cy="1120" r="110" fill="${C.peach200}" opacity="0.5"/>
</svg>`;
}

async function compose(svg, overlays, outFile) {
  const base = await sharp(Buffer.from(svg)).png().toBuffer();
  const layers = [];
  for (const o of overlays) {
    const buf = await sharp(o.src).resize({ width: o.width }).png().toBuffer();
    const meta = await sharp(buf).metadata();
    layers.push({ input: buf, top: o.top, left: Math.round(o.centerX - meta.width / 2) });
  }
  await sharp(base).composite(layers).png().toFile(outFile);
  console.log(`  ✓ ${path.basename(outFile)}`);
}

async function main() {
  await setupFontconfig();
  await fs.mkdir(outDir, { recursive: true });
  console.log('네이버 블로그 자산 생성 →', path.relative(process.cwd(), outDir));

  // 1) PC 커버 966×600 — 로고를 위쪽에
  await compose(
    svgCoverPc(966, 600),
    // 🔴 커버는 스킨 스타일에 따라 위아래가 잘린다 — 로고~pill 을 가운데 띠에 모은다
    [{ src: logoPath, width: 420, top: 132, centerX: 483 }],
    path.join(outDir, 'cover-pc.png'),
  );

  // 2) 모바일 커버 1080×1300 — 호리만, 글자 없음.
  //    앱이 아래쪽에 블로그명·프로필을 겹치므로 위쪽 띠에 둔다.
  await compose(
    svgCoverMobile(1080, 1300),
    [{ src: horiCutoutPath, width: 660, top: 250, centerX: 540 }],
    path.join(outDir, 'cover-mobile.png'),
  );

  // 3) 프로필 286×286 — 호리가 두 종류라 둘 다 굽고 형이 고른다.
  //    felt = 인스타와 같은 니들펠트(채널 간 일치) / 3d = 로고·커버와 같은 3D(블로그 안 일치)
  await sharp(horiProfilePath)
    .resize(286, 286, { fit: 'cover' })
    .png()
    .toFile(path.join(outDir, 'profile-felt.png'));
  console.log('  ✓ profile-felt.png');

  const profile3dBg = await sharp(Buffer.from(svgCoverMobile(286, 286))).png().toBuffer();
  const hori3d = await sharp(horiCutoutPath).resize({ width: 240 }).png().toBuffer();
  await sharp(profile3dBg)
    .composite([{ input: hori3d, top: 30, left: 23 }])
    .png()
    .toFile(path.join(outDir, 'profile-3d.png'));
  console.log('  ✓ profile-3d.png');
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
