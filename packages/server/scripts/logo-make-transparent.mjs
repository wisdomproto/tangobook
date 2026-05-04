#!/usr/bin/env node
// 로고 PNG 의 체크무늬 배경 (Photoshop/Figma transparency indicator 가 픽셀로 박힌 상태)
// → 4 코너에서 floodfill 로 외곽만 alpha 0 으로 변환. 호랑이/텍스트 내부 흰색 보존.
//
// 사용:
//   node scripts/logo-make-transparent.mjs

import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_LOGO = path.join(__dirname, '..', '..', 'client', 'public', 'logo');

const FILES = ['logo-kr.png', 'logo-en.png'];

/**
 * 체크무늬 픽셀 판정 — 흰색 (240+) 또는 회색 격자 (R≈G≈B, 180-220 범위).
 * 호랑이 컬러풀 픽셀은 r/g/b 차이 큼 → false.
 */
function isCheckBg(r, g, b) {
  if (r >= 240 && g >= 240 && b >= 240) return true;
  const diffs = Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b);
  if (diffs <= 18 && r >= 180 && r <= 230) return true;
  return false;
}

async function processFile(filename) {
  const inPath = path.join(PUBLIC_LOGO, filename);
  console.log(`\n▸ ${filename}`);

  const { data, info } = await sharp(inPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  console.log(`  크기: ${width} × ${height} × ${channels}ch`);

  // BFS floodfill from 4 corners
  const visited = new Uint8Array(width * height);
  const stack = [];
  for (const [x, y] of [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ]) {
    stack.push([x, y]);
  }

  let cleared = 0;
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    const idx = y * width + x;
    if (visited[idx]) continue;
    const off = idx * channels;
    if (!isCheckBg(data[off], data[off + 1], data[off + 2])) continue;
    visited[idx] = 1;
    data[off + 3] = 0; // alpha 0
    cleared++;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  console.log(`  투명화 픽셀: ${cleared.toLocaleString()} / ${(width * height).toLocaleString()} (${((cleared / (width * height)) * 100).toFixed(1)}%)`);

  // raw → PNG 저장 (덮어씌우기)
  await sharp(data, { raw: { width, height, channels } })
    .png({ compressionLevel: 9 })
    .toFile(inPath + '.tmp');

  // rename
  const fs = await import('node:fs/promises');
  await fs.rename(inPath + '.tmp', inPath);
  console.log(`  ✓ 저장: ${inPath}`);
}

for (const f of FILES) {
  await processFile(f);
}

console.log('\n끝.');
