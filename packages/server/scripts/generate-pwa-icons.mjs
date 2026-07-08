/**
 * PWA 앱 아이콘 생성 — 호리(브랜드 마스코트) + "탱고북" 텍스트를 세로로 쌓아 브랜드 배경에 합성.
 * (로고가 호리+탱고북 가로형이라, 정사각 아이콘은 세로 스택으로 재구성.)
 *
 * 출력 (client/public): icon-512.png · icon-192.png · apple-touch-icon.png(180) · favicon.png(64).
 * 텍스트는 repo 번들 Pretendard(OFL) 를 fontconfig 로 등록해 렌더 (시스템/CDN 폰트 의존 X).
 * maskable 안전영역 위해 마스코트+텍스트를 중앙 안쪽에 배치.
 *
 * 실행: node packages/server/scripts/generate-pwa-icons.mjs
 */
import sharp from 'sharp';
import fs from 'node:fs/promises';
import fss from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, '../../client/public');
const MASCOT = path.join(PUBLIC, 'mascot/hori/waving.webp'); // 손 흔드는 호리 — 아이콘 소형에서 깔끔
const fontsDir = path.join(__dirname, 'assets', 'og-fonts');

// 번들 Pretendard 만 보이는 임시 fontconfig 등록 (OG 생성기와 동일 방식)
function setupFonts() {
  const conf = `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${fontsDir}</dir>
  <cachedir>${path.join(os.tmpdir(), 'tangobook-fc-cache')}</cachedir>
</fontconfig>`;
  const confPath = path.join(os.tmpdir(), 'tangobook-pwa-fonts.conf');
  fss.writeFileSync(confPath, conf);
  process.env.FONTCONFIG_FILE = confPath;
}

const SIZE = 512;

function bgTextSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
  <defs>
    <radialGradient id="g" cx="50%" cy="38%" r="78%">
      <stop offset="0%" stop-color="#FFB4A6"/>
      <stop offset="65%" stop-color="#FF8272"/>
      <stop offset="100%" stop-color="#FF6F61"/>
    </radialGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#g)"/>
  <text x="${SIZE / 2}" y="452" font-family="Pretendard" font-weight="800" font-size="96"
        fill="#ffffff" text-anchor="middle"
        style="paint-order:stroke;stroke:#D64B3C;stroke-width:6px;stroke-linejoin:round">탱고북</text>
</svg>`;
}

async function buildBase() {
  const bgText = await sharp(Buffer.from(bgTextSvg())).png().toBuffer();
  const m = 300; // 마스코트 크기
  const mascot = await sharp(MASCOT)
    .resize(m, m, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return sharp(bgText)
    .composite([{ input: mascot, top: 40, left: Math.round((SIZE - m) / 2) }])
    .png()
    .toBuffer();
}

async function main() {
  setupFonts();
  const base = await buildBase();
  await fs.writeFile(path.join(PUBLIC, 'icon-512.png'), base);
  await sharp(base).resize(192, 192).png().toFile(path.join(PUBLIC, 'icon-192.png'));
  await sharp(base).resize(180, 180).png().toFile(path.join(PUBLIC, 'apple-touch-icon.png'));
  await sharp(base).resize(64, 64).png().toFile(path.join(PUBLIC, 'favicon.png'));
  console.log('✅ PWA icons (호리 + 탱고북): icon-512/192, apple-touch-icon, favicon');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
