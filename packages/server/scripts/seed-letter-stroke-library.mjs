#!/usr/bin/env node
/**
 * 글로벌 알파벳 stroke 라이브러리 — R2 `_index/letter-stroke-library.json` 채우기.
 *
 * seed-letter-tracing-strokes-book1.mjs 의 UPPER_STROKES / LOWER_STROKES 정의 + mapCap 변환을
 * 단일 글로벌 파일로 모아서 R2 에 PUT. 모든 영어 학습 컨텐츠가 이 파일 참조.
 *
 * 사용:
 *   node scripts/seed-letter-stroke-library.mjs            # dry-run
 *   node scripts/seed-letter-stroke-library.mjs --apply
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
const envText = fs.readFileSync(envPath, 'utf-8');
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const APPLY = process.argv.includes('--apply');

// boundbox + INSET (seed-letter-tracing-strokes-book1.mjs 와 동일)
const CAP_X_MIN = 0.27;
const CAP_X_MAX = 0.73;
const CAP_Y_MIN = 0.32;
const CAP_Y_MAX = 0.78;
const CAP_W = CAP_X_MAX - CAP_X_MIN;
const CAP_H = CAP_Y_MAX - CAP_Y_MIN;
const INSET = 0.07;
const EFF_W = CAP_W * (1 - 2 * INSET);
const EFF_H = CAP_H * (1 - 2 * INSET);
function mapCap(p) {
  return {
    x: CAP_X_MIN + CAP_W * INSET + p.x * EFF_W,
    y: CAP_Y_MIN + CAP_H * INSET + p.y * EFF_H,
  };
}
function mapStroke(s) {
  return { type: s.type, points: s.points.map(mapCap) };
}

// === 대문자 + 소문자 stroke 정의 (seed-letter-tracing-strokes-book1.mjs 와 동일) ===
const UPPER_STROKES = {
  A: [
    { type: 'line', points: [{ x: 0.5, y: 0 }, { x: 0, y: 1 }] },
    { type: 'line', points: [{ x: 0.5, y: 0 }, { x: 1, y: 1 }] },
    { type: 'line', points: [{ x: 0.25, y: 0.65 }, { x: 0.75, y: 0.65 }] },
  ],
  B: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
    { type: 'bend', points: [{ x: 0, y: 0 }, { x: 0.9, y: 0.2 }, { x: 0, y: 0.45 }] },
    { type: 'bend', points: [{ x: 0, y: 0.55 }, { x: 1.0, y: 0.75 }, { x: 0, y: 1 }] },
  ],
  C: [{ type: 'bend', points: [{ x: 0.95, y: 0.15 }, { x: 0, y: 0.5 }, { x: 0.95, y: 0.85 }] }],
  D: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
    { type: 'bend', points: [{ x: 0, y: 0 }, { x: 1, y: 0.5 }, { x: 0, y: 1 }] },
  ],
  E: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0.9, y: 0 }] },
    { type: 'line', points: [{ x: 0, y: 0.5 }, { x: 0.75, y: 0.5 }] },
    { type: 'line', points: [{ x: 0, y: 1 }, { x: 0.9, y: 1 }] },
  ],
  F: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0.9, y: 0 }] },
    { type: 'line', points: [{ x: 0, y: 0.5 }, { x: 0.75, y: 0.5 }] },
  ],
  G: [
    { type: 'bend', points: [{ x: 0.95, y: 0.15 }, { x: 0, y: 0.5 }, { x: 0.95, y: 0.85 }] },
    { type: 'line', points: [{ x: 0.95, y: 0.6 }, { x: 0.55, y: 0.6 }] },
  ],
  H: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
    { type: 'line', points: [{ x: 1, y: 0 }, { x: 1, y: 1 }] },
    { type: 'line', points: [{ x: 0, y: 0.5 }, { x: 1, y: 0.5 }] },
  ],
  I: [{ type: 'line', points: [{ x: 0.5, y: 0 }, { x: 0.5, y: 1 }] }],
  J: [{ type: 'bend', points: [{ x: 0.95, y: 0 }, { x: 0.95, y: 0.8 }, { x: 0.15, y: 0.95 }] }],
  K: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
    { type: 'line', points: [{ x: 0.9, y: 0 }, { x: 0, y: 0.55 }] },
    { type: 'line', points: [{ x: 0, y: 0.55 }, { x: 0.95, y: 1 }] },
  ],
  L: [{ type: 'bend', points: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0.95, y: 1 }] }],
  M: [
    { type: 'line', points: [{ x: 0, y: 1 }, { x: 0, y: 0 }] },
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0.5, y: 0.7 }] },
    { type: 'line', points: [{ x: 0.5, y: 0.7 }, { x: 1, y: 0 }] },
    { type: 'line', points: [{ x: 1, y: 0 }, { x: 1, y: 1 }] },
  ],
  N: [
    { type: 'line', points: [{ x: 0, y: 1 }, { x: 0, y: 0 }] },
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
    { type: 'line', points: [{ x: 1, y: 1 }, { x: 1, y: 0 }] },
  ],
  O: [{ type: 'loop', points: [{ x: 0.5, y: 0 }, { x: 0, y: 0.5 }, { x: 0.5, y: 1 }, { x: 1, y: 0.5 }, { x: 0.5, y: 0 }] }],
  P: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
    { type: 'bend', points: [{ x: 0, y: 0 }, { x: 0.95, y: 0.25 }, { x: 0, y: 0.5 }] },
  ],
  Q: [
    { type: 'loop', points: [{ x: 0.5, y: 0 }, { x: 0, y: 0.5 }, { x: 0.5, y: 1 }, { x: 1, y: 0.5 }, { x: 0.5, y: 0 }] },
    { type: 'line', points: [{ x: 0.65, y: 0.7 }, { x: 1, y: 1.05 }] },
  ],
  R: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
    { type: 'bend', points: [{ x: 0, y: 0 }, { x: 0.95, y: 0.25 }, { x: 0, y: 0.5 }] },
    { type: 'line', points: [{ x: 0, y: 0.5 }, { x: 1, y: 1 }] },
  ],
  S: [
    { type: 'bend', points: [{ x: 0.9, y: 0.1 }, { x: 0.1, y: 0.35 }, { x: 0.9, y: 0.5 }] },
    { type: 'bend', points: [{ x: 0.9, y: 0.5 }, { x: 0.1, y: 0.65 }, { x: 0.9, y: 0.9 }] },
  ],
  T: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 1, y: 0 }] },
    { type: 'line', points: [{ x: 0.5, y: 0 }, { x: 0.5, y: 1 }] },
  ],
  U: [{ type: 'bend', points: [{ x: 0, y: 0 }, { x: 0.5, y: 1 }, { x: 1, y: 0 }] }],
  V: [{ type: 'bend', points: [{ x: 0, y: 0 }, { x: 0.5, y: 1 }, { x: 1, y: 0 }] }],
  W: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0.3, y: 1 }] },
    { type: 'line', points: [{ x: 0.3, y: 1 }, { x: 0.5, y: 0.4 }] },
    { type: 'line', points: [{ x: 0.5, y: 0.4 }, { x: 0.7, y: 1 }] },
    { type: 'line', points: [{ x: 0.7, y: 1 }, { x: 1, y: 0 }] },
  ],
  X: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
    { type: 'line', points: [{ x: 1, y: 0 }, { x: 0, y: 1 }] },
  ],
  Y: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0.5, y: 0.5 }] },
    { type: 'line', points: [{ x: 1, y: 0 }, { x: 0.5, y: 0.5 }] },
    { type: 'line', points: [{ x: 0.5, y: 0.5 }, { x: 0.5, y: 1 }] },
  ],
  Z: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 1, y: 0 }] },
    { type: 'line', points: [{ x: 1, y: 0 }, { x: 0, y: 1 }] },
    { type: 'line', points: [{ x: 0, y: 1 }, { x: 1, y: 1 }] },
  ],
};

const LOWER_STROKES = {
  a: [
    { type: 'line', points: [{ x: 0.85, y: 0.3 }, { x: 0.85, y: 1 }] },
    { type: 'bend', points: [{ x: 0.85, y: 0.4 }, { x: 0.15, y: 0.65 }, { x: 0.85, y: 0.9 }] },
  ],
  b: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
    { type: 'loop', points: [{ x: 0, y: 0.5 }, { x: 0.9, y: 0.55 }, { x: 0.9, y: 0.9 }, { x: 0, y: 0.95 }, { x: 0, y: 0.5 }] },
  ],
  c: [{ type: 'bend', points: [{ x: 0.9, y: 0.45 }, { x: 0, y: 0.7 }, { x: 0.9, y: 0.95 }] }],
  d: [
    { type: 'line', points: [{ x: 0.9, y: 0 }, { x: 0.9, y: 1 }] },
    { type: 'bend', points: [{ x: 0.9, y: 0.5 }, { x: 0.05, y: 0.7 }, { x: 0.9, y: 0.95 }] },
  ],
  e: [
    { type: 'bend', points: [{ x: 0.95, y: 0.55 }, { x: 0, y: 0.7 }, { x: 0.95, y: 0.95 }] },
    { type: 'line', points: [{ x: 0.2, y: 0.65 }, { x: 0.85, y: 0.65 }] },
  ],
  f: [
    { type: 'bend', points: [{ x: 0.85, y: 0.1 }, { x: 0.3, y: 0.1 }, { x: 0.3, y: 1 }] },
    { type: 'line', points: [{ x: 0.05, y: 0.5 }, { x: 0.6, y: 0.5 }] },
  ],
  g: [
    { type: 'loop', points: [{ x: 0.95, y: 0.5 }, { x: 0.1, y: 0.6 }, { x: 0.1, y: 0.85 }, { x: 0.95, y: 0.95 }, { x: 0.95, y: 0.5 }] },
    { type: 'bend', points: [{ x: 0.95, y: 0.5 }, { x: 0.95, y: 1.1 }, { x: 0.1, y: 1.2 }] },
  ],
  h: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
    { type: 'bend', points: [{ x: 0, y: 0.55 }, { x: 0.85, y: 0.6 }, { x: 0.85, y: 1 }] },
  ],
  i: [
    { type: 'line', points: [{ x: 0.5, y: 0.4 }, { x: 0.5, y: 1 }] },
    { type: 'line', points: [{ x: 0.5, y: 0.15 }, { x: 0.5, y: 0.22 }] },
  ],
  j: [
    { type: 'bend', points: [{ x: 0.7, y: 0.4 }, { x: 0.7, y: 1.05 }, { x: 0.05, y: 1.2 }] },
    { type: 'line', points: [{ x: 0.7, y: 0.15 }, { x: 0.7, y: 0.22 }] },
  ],
  k: [
    { type: 'line', points: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
    { type: 'line', points: [{ x: 0.85, y: 0.5 }, { x: 0, y: 0.75 }] },
    { type: 'line', points: [{ x: 0, y: 0.75 }, { x: 0.9, y: 1 }] },
  ],
  l: [{ type: 'line', points: [{ x: 0.5, y: 0 }, { x: 0.5, y: 1 }] }],
  m: [
    { type: 'line', points: [{ x: 0, y: 1 }, { x: 0, y: 0.5 }] },
    { type: 'bend', points: [{ x: 0, y: 0.5 }, { x: 0.5, y: 0.45 }, { x: 0.5, y: 1 }] },
    { type: 'bend', points: [{ x: 0.5, y: 0.5 }, { x: 1, y: 0.45 }, { x: 1, y: 1 }] },
  ],
  n: [
    { type: 'line', points: [{ x: 0, y: 1 }, { x: 0, y: 0.5 }] },
    { type: 'bend', points: [{ x: 0, y: 0.5 }, { x: 0.9, y: 0.45 }, { x: 0.9, y: 1 }] },
  ],
  o: [{ type: 'loop', points: [{ x: 0.5, y: 0.4 }, { x: 0.05, y: 0.7 }, { x: 0.5, y: 0.95 }, { x: 0.95, y: 0.7 }, { x: 0.5, y: 0.4 }] }],
  p: [
    { type: 'line', points: [{ x: 0.05, y: 0.5 }, { x: 0.05, y: 1.15 }] },
    { type: 'loop', points: [{ x: 0.05, y: 0.5 }, { x: 0.9, y: 0.55 }, { x: 0.9, y: 0.85 }, { x: 0.05, y: 0.9 }, { x: 0.05, y: 0.5 }] },
  ],
  q: [
    { type: 'loop', points: [{ x: 0.95, y: 0.5 }, { x: 0.1, y: 0.55 }, { x: 0.1, y: 0.85 }, { x: 0.95, y: 0.9 }, { x: 0.95, y: 0.5 }] },
    { type: 'line', points: [{ x: 0.95, y: 0.5 }, { x: 0.95, y: 1.15 }] },
  ],
  r: [
    { type: 'line', points: [{ x: 0, y: 0.5 }, { x: 0, y: 1 }] },
    { type: 'bend', points: [{ x: 0, y: 0.55 }, { x: 0.5, y: 0.45 }, { x: 0.85, y: 0.55 }] },
  ],
  s: [
    { type: 'bend', points: [{ x: 0.85, y: 0.5 }, { x: 0.15, y: 0.6 }, { x: 0.85, y: 0.75 }] },
    { type: 'bend', points: [{ x: 0.85, y: 0.75 }, { x: 0.15, y: 0.85 }, { x: 0.15, y: 0.95 }] },
  ],
  t: [
    { type: 'bend', points: [{ x: 0.5, y: 0.2 }, { x: 0.5, y: 0.95 }, { x: 0.85, y: 0.95 }] },
    { type: 'line', points: [{ x: 0.15, y: 0.4 }, { x: 0.85, y: 0.4 }] },
  ],
  u: [
    { type: 'bend', points: [{ x: 0.15, y: 0.5 }, { x: 0.5, y: 1 }, { x: 0.85, y: 0.65 }] },
    { type: 'line', points: [{ x: 0.85, y: 0.5 }, { x: 0.85, y: 1 }] },
  ],
  v: [{ type: 'bend', points: [{ x: 0.15, y: 0.5 }, { x: 0.5, y: 1 }, { x: 0.85, y: 0.5 }] }],
  w: [
    { type: 'line', points: [{ x: 0.05, y: 0.5 }, { x: 0.3, y: 1 }] },
    { type: 'line', points: [{ x: 0.3, y: 1 }, { x: 0.5, y: 0.65 }] },
    { type: 'line', points: [{ x: 0.5, y: 0.65 }, { x: 0.7, y: 1 }] },
    { type: 'line', points: [{ x: 0.7, y: 1 }, { x: 0.95, y: 0.5 }] },
  ],
  x: [
    { type: 'line', points: [{ x: 0.15, y: 0.5 }, { x: 0.85, y: 1 }] },
    { type: 'line', points: [{ x: 0.85, y: 0.5 }, { x: 0.15, y: 1 }] },
  ],
  y: [
    { type: 'line', points: [{ x: 0.15, y: 0.5 }, { x: 0.5, y: 0.9 }] },
    { type: 'bend', points: [{ x: 0.85, y: 0.5 }, { x: 0.5, y: 0.9 }, { x: 0.05, y: 1.2 }] },
  ],
  z: [
    { type: 'line', points: [{ x: 0.15, y: 0.5 }, { x: 0.85, y: 0.5 }] },
    { type: 'line', points: [{ x: 0.85, y: 0.5 }, { x: 0.15, y: 1 }] },
    { type: 'line', points: [{ x: 0.15, y: 1 }, { x: 0.85, y: 1 }] },
  ],
};

// Library 객체 생성
const letters = {};
for (const [letter, strokes] of Object.entries(UPPER_STROKES)) {
  letters[letter] = { strokes: strokes.map(mapStroke), enforceOrder: true };
}
for (const [letter, strokes] of Object.entries(LOWER_STROKES)) {
  letters[letter] = { strokes: strokes.map(mapStroke), enforceOrder: true };
}

const library = {
  version: 1,
  updatedAt: new Date().toISOString(),
  letters,
};

console.log(`Letters defined: ${Object.keys(letters).length}`);
console.log(`Total strokes: ${Object.values(letters).reduce((sum, l) => sum + l.strokes.length, 0)}`);

if (!APPLY) {
  console.log('(dry-run — --apply 로 R2 저장)');
  process.exit(0);
}

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;

if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
  console.error('R2 env vars 누락. packages/server/.env 확인.');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

const key = '_index/letter-stroke-library.json';
await s3.send(
  new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: JSON.stringify(library, null, 2),
    ContentType: 'application/json',
    CacheControl: 'public, max-age=60',
  })
);
console.log(`Saved to R2: ${key}`);
