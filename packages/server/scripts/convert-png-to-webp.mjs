#!/usr/bin/env node
/**
 * packages/client/public 의 모든 .png 를 .webp 로 변환 (원본 삭제 X — 별도 단계).
 * 투명도 보존 (RGBA), 품질 85, method 6 (압축률 최대).
 *
 * 사용:
 *   node scripts/convert-png-to-webp.mjs           # 변환만 (원본 유지)
 *   node scripts/convert-png-to-webp.mjs --delete  # 변환 후 원본 png 삭제
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'client', 'public');
const DELETE = process.argv.includes('--delete');

function findPngs(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findPngs(p));
    else if (entry.isFile() && p.toLowerCase().endsWith('.png')) out.push(p);
  }
  return out;
}

const pngs = findPngs(PUBLIC_DIR);
console.log(`Found ${pngs.length} PNG files in ${PUBLIC_DIR}`);

let originalTotal = 0;
let convertedTotal = 0;
let converted = 0;
let skipped = 0;
let failed = 0;
const failures = [];

const pyScript = `
from PIL import Image
import sys, os
src, dst = sys.argv[1], sys.argv[2]
img = Image.open(src)
# RGBA 또는 P/LA → RGBA, 그 외는 그대로
if img.mode == 'P' and 'transparency' in img.info:
  img = img.convert('RGBA')
img.save(dst, 'webp', quality=85, method=6)
print(os.path.getsize(dst))
`;

for (const png of pngs) {
  const webp = png.slice(0, -4) + '.webp';
  if (fs.existsSync(webp)) {
    skipped++;
    continue;
  }
  const result = spawnSync('python3', ['-c', pyScript, png, webp], {
    encoding: 'utf-8',
  });
  if (result.status !== 0) {
    failed++;
    failures.push({ png, err: result.stderr.slice(0, 100) });
    continue;
  }
  const oldSize = fs.statSync(png).size;
  const newSize = fs.statSync(webp).size;
  originalTotal += oldSize;
  convertedTotal += newSize;
  converted++;
  if (converted % 10 === 0) console.log(`  [${converted}/${pngs.length}] converted...`);
}

console.log(`\n=== 결과 ===`);
console.log(`변환: ${converted}, skip: ${skipped}, fail: ${failed}`);
console.log(`원본 총: ${(originalTotal / 1024 / 1024).toFixed(1)} MB`);
console.log(`webp 총: ${(convertedTotal / 1024 / 1024).toFixed(1)} MB`);
console.log(`절감: ${((1 - convertedTotal / originalTotal) * 100).toFixed(1)}%`);

if (failures.length > 0) {
  console.log(`\n=== 실패 ===`);
  failures.forEach((f) => console.log(`  ${f.png}: ${f.err}`));
}

if (DELETE) {
  console.log(`\n원본 PNG 삭제 중...`);
  let deleted = 0;
  for (const png of pngs) {
    const webp = png.slice(0, -4) + '.webp';
    if (fs.existsSync(webp) && fs.existsSync(png)) {
      fs.unlinkSync(png);
      deleted++;
    }
  }
  console.log(`삭제: ${deleted} 개`);
}
