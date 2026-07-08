/**
 * PWA 앱 아이콘 생성 — 호리 마스코트 + 브랜드 배경(peach→coral radial)을 sharp 로 합성.
 *
 * 출력 (client/public): icon-512.png · icon-192.png · apple-touch-icon.png(180) · favicon.png(64).
 * manifest.json / index.html 이 참조하는 파일들. maskable 안전영역 위해 마스코트는 중앙 ~62%.
 *
 * 실행: node packages/server/scripts/generate-pwa-icons.mjs
 */
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, '../../client/public');
const MASCOT = path.join(PUBLIC, 'mascot/hori/waving.webp');

const bgSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <defs>
    <radialGradient id="g" cx="50%" cy="40%" r="75%">
      <stop offset="0%" stop-color="#FFE4D6"/>
      <stop offset="70%" stop-color="#FF8A7A"/>
      <stop offset="100%" stop-color="#FF6F61"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#g)"/>
</svg>`;

async function buildBase(size = 512, mascotRatio = 0.62) {
  const bg = await sharp(Buffer.from(bgSvg(size))).png().toBuffer();
  const m = Math.round(size * mascotRatio);
  const mascot = await sharp(MASCOT)
    .resize(m, m, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  // 마스코트를 중앙보다 살짝 위(발이 아래 여백)로 — 시각 균형
  return sharp(bg)
    .composite([{ input: mascot, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function main() {
  const base = await buildBase(512);
  await fs.writeFile(path.join(PUBLIC, 'icon-512.png'), base);
  await sharp(base).resize(192, 192).png().toFile(path.join(PUBLIC, 'icon-192.png'));
  await sharp(base).resize(180, 180).png().toFile(path.join(PUBLIC, 'apple-touch-icon.png'));
  await sharp(base).resize(64, 64).png().toFile(path.join(PUBLIC, 'favicon.png'));
  console.log('✅ PWA icons: icon-512.png, icon-192.png, apple-touch-icon.png, favicon.png');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
