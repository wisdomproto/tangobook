#!/usr/bin/env node
/**
 * 한글 자모 stroke 라이브러리 seed — R2 `_index/korean-jamo-stroke-library.json`.
 *
 * 51 자모 (단자음 14 + 쌍자음 5 + 겹받침 11 + 단모음 10 + 복모음 11) 의 base stroke 를
 * 자모 자체 0~1 박스 안에서 정의. `composeKoreanSyllable` 가 4 케이스 박스 분할로 음절 자동 합성.
 *
 * 정확도 ~80%. 어색한 음절은 저작도구 `/korean-jamo-stroke-editor` 에서 미세 조정.
 *
 * 사용:
 *   node scripts/seed-korean-jamo-stroke-library.mjs            # dry-run
 *   node scripts/seed-korean-jamo-stroke-library.mjs --apply
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

// 자모 base stroke — 자모 자체 0~1 박스. 합성 시 음절 box 안 sub-box 로 transform.
// `line` 2점, `bend` 3점, `loop` 3+점 (start=end).

// ─── 단자음 14 ──────────────────────────────────
const SINGLE_CONSONANTS = {
  ㄱ: [{ type: 'bend', points: [{ x: 0.05, y: 0.1 }, { x: 0.95, y: 0.1 }, { x: 0.95, y: 0.95 }] }],
  ㄴ: [{ type: 'bend', points: [{ x: 0.05, y: 0.05 }, { x: 0.05, y: 0.9 }, { x: 0.95, y: 0.9 }] }],
  ㄷ: [
    { type: 'line', points: [{ x: 0.05, y: 0.1 }, { x: 0.95, y: 0.1 }] },
    { type: 'bend', points: [{ x: 0.05, y: 0.1 }, { x: 0.05, y: 0.9 }, { x: 0.95, y: 0.9 }] },
  ],
  ㄹ: [
    { type: 'bend', points: [{ x: 0.05, y: 0.05 }, { x: 0.95, y: 0.05 }, { x: 0.95, y: 0.45 }] },
    { type: 'line', points: [{ x: 0.05, y: 0.45 }, { x: 0.95, y: 0.45 }] },
    { type: 'bend', points: [{ x: 0.05, y: 0.45 }, { x: 0.05, y: 0.95 }, { x: 0.95, y: 0.95 }] },
  ],
  ㅁ: [
    { type: 'line', points: [{ x: 0.05, y: 0.05 }, { x: 0.05, y: 0.95 }] },
    { type: 'bend', points: [{ x: 0.05, y: 0.05 }, { x: 0.95, y: 0.05 }, { x: 0.95, y: 0.95 }] },
    { type: 'line', points: [{ x: 0.05, y: 0.95 }, { x: 0.95, y: 0.95 }] },
  ],
  ㅂ: [
    { type: 'line', points: [{ x: 0.1, y: 0.05 }, { x: 0.1, y: 0.95 }] },
    { type: 'line', points: [{ x: 0.9, y: 0.05 }, { x: 0.9, y: 0.95 }] },
    { type: 'line', points: [{ x: 0.1, y: 0.55 }, { x: 0.9, y: 0.55 }] },
    { type: 'line', points: [{ x: 0.1, y: 0.95 }, { x: 0.9, y: 0.95 }] },
  ],
  ㅅ: [
    { type: 'line', points: [{ x: 0.5, y: 0.05 }, { x: 0.05, y: 0.95 }] },
    { type: 'line', points: [{ x: 0.5, y: 0.05 }, { x: 0.95, y: 0.95 }] },
  ],
  ㅇ: [
    {
      type: 'loop',
      points: [
        { x: 0.5, y: 0.05 },
        { x: 0.05, y: 0.5 },
        { x: 0.5, y: 0.95 },
        { x: 0.95, y: 0.5 },
        { x: 0.5, y: 0.05 },
      ],
    },
  ],
  ㅈ: [
    { type: 'line', points: [{ x: 0.05, y: 0.1 }, { x: 0.95, y: 0.1 }] },
    { type: 'line', points: [{ x: 0.5, y: 0.1 }, { x: 0.05, y: 0.95 }] },
    { type: 'line', points: [{ x: 0.5, y: 0.1 }, { x: 0.95, y: 0.95 }] },
  ],
  ㅊ: [
    { type: 'line', points: [{ x: 0.4, y: 0.0 }, { x: 0.6, y: 0.0 }] },
    { type: 'line', points: [{ x: 0.05, y: 0.25 }, { x: 0.95, y: 0.25 }] },
    { type: 'line', points: [{ x: 0.5, y: 0.25 }, { x: 0.05, y: 0.95 }] },
    { type: 'line', points: [{ x: 0.5, y: 0.25 }, { x: 0.95, y: 0.95 }] },
  ],
  ㅋ: [
    { type: 'bend', points: [{ x: 0.05, y: 0.1 }, { x: 0.95, y: 0.1 }, { x: 0.95, y: 0.95 }] },
    { type: 'line', points: [{ x: 0.05, y: 0.5 }, { x: 0.95, y: 0.5 }] },
  ],
  ㅌ: [
    { type: 'line', points: [{ x: 0.05, y: 0.1 }, { x: 0.95, y: 0.1 }] },
    { type: 'line', points: [{ x: 0.05, y: 0.5 }, { x: 0.95, y: 0.5 }] },
    { type: 'bend', points: [{ x: 0.05, y: 0.1 }, { x: 0.05, y: 0.9 }, { x: 0.95, y: 0.9 }] },
  ],
  ㅍ: [
    { type: 'line', points: [{ x: 0.05, y: 0.1 }, { x: 0.95, y: 0.1 }] },
    { type: 'line', points: [{ x: 0.25, y: 0.1 }, { x: 0.25, y: 0.9 }] },
    { type: 'line', points: [{ x: 0.75, y: 0.1 }, { x: 0.75, y: 0.9 }] },
    { type: 'line', points: [{ x: 0.05, y: 0.9 }, { x: 0.95, y: 0.9 }] },
  ],
  ㅎ: [
    { type: 'line', points: [{ x: 0.4, y: 0.0 }, { x: 0.6, y: 0.0 }] },
    { type: 'line', points: [{ x: 0.05, y: 0.25 }, { x: 0.95, y: 0.25 }] },
    {
      type: 'loop',
      points: [
        { x: 0.5, y: 0.4 },
        { x: 0.15, y: 0.65 },
        { x: 0.5, y: 0.95 },
        { x: 0.85, y: 0.65 },
        { x: 0.5, y: 0.4 },
      ],
    },
  ],
};

// ─── 쌍자음 5 ──────────────────────────────────
// 단자음 stroke 를 좌/우 half-box 로 transform — 각각 0~0.5 / 0.5~1 박스
function scaleX(strokes, x1, x2) {
  const w = x2 - x1;
  return strokes.map((s) => ({
    type: s.type,
    points: s.points.map((p) => ({ x: x1 + p.x * w, y: p.y })),
  }));
}
const DOUBLE_CONSONANTS = {
  ㄲ: [...scaleX(SINGLE_CONSONANTS.ㄱ, 0, 0.5), ...scaleX(SINGLE_CONSONANTS.ㄱ, 0.5, 1)],
  ㄸ: [...scaleX(SINGLE_CONSONANTS.ㄷ, 0, 0.5), ...scaleX(SINGLE_CONSONANTS.ㄷ, 0.5, 1)],
  ㅃ: [...scaleX(SINGLE_CONSONANTS.ㅂ, 0, 0.5), ...scaleX(SINGLE_CONSONANTS.ㅂ, 0.5, 1)],
  ㅆ: [...scaleX(SINGLE_CONSONANTS.ㅅ, 0, 0.5), ...scaleX(SINGLE_CONSONANTS.ㅅ, 0.5, 1)],
  ㅉ: [...scaleX(SINGLE_CONSONANTS.ㅈ, 0, 0.5), ...scaleX(SINGLE_CONSONANTS.ㅈ, 0.5, 1)],
};

// ─── 겹받침 11 — 두 단자음 좌/우 ──────────────────────────────────
const COMPOUND_FINALS = {
  ㄳ: [...scaleX(SINGLE_CONSONANTS.ㄱ, 0, 0.5), ...scaleX(SINGLE_CONSONANTS.ㅅ, 0.5, 1)],
  ㄵ: [...scaleX(SINGLE_CONSONANTS.ㄴ, 0, 0.5), ...scaleX(SINGLE_CONSONANTS.ㅈ, 0.5, 1)],
  ㄶ: [...scaleX(SINGLE_CONSONANTS.ㄴ, 0, 0.5), ...scaleX(SINGLE_CONSONANTS.ㅎ, 0.5, 1)],
  ㄺ: [...scaleX(SINGLE_CONSONANTS.ㄹ, 0, 0.5), ...scaleX(SINGLE_CONSONANTS.ㄱ, 0.5, 1)],
  ㄻ: [...scaleX(SINGLE_CONSONANTS.ㄹ, 0, 0.5), ...scaleX(SINGLE_CONSONANTS.ㅁ, 0.5, 1)],
  ㄼ: [...scaleX(SINGLE_CONSONANTS.ㄹ, 0, 0.5), ...scaleX(SINGLE_CONSONANTS.ㅂ, 0.5, 1)],
  ㄽ: [...scaleX(SINGLE_CONSONANTS.ㄹ, 0, 0.5), ...scaleX(SINGLE_CONSONANTS.ㅅ, 0.5, 1)],
  ㄾ: [...scaleX(SINGLE_CONSONANTS.ㄹ, 0, 0.5), ...scaleX(SINGLE_CONSONANTS.ㅌ, 0.5, 1)],
  ㄿ: [...scaleX(SINGLE_CONSONANTS.ㄹ, 0, 0.5), ...scaleX(SINGLE_CONSONANTS.ㅍ, 0.5, 1)],
  ㅀ: [...scaleX(SINGLE_CONSONANTS.ㄹ, 0, 0.5), ...scaleX(SINGLE_CONSONANTS.ㅎ, 0.5, 1)],
  ㅄ: [...scaleX(SINGLE_CONSONANTS.ㅂ, 0, 0.5), ...scaleX(SINGLE_CONSONANTS.ㅅ, 0.5, 1)],
};

// ─── 단모음 10 ──────────────────────────────────
const BASIC_VOWELS = {
  ㅏ: [
    { type: 'line', points: [{ x: 0.5, y: 0.05 }, { x: 0.5, y: 0.95 }] },
    { type: 'line', points: [{ x: 0.5, y: 0.5 }, { x: 0.95, y: 0.5 }] },
  ],
  ㅑ: [
    { type: 'line', points: [{ x: 0.5, y: 0.05 }, { x: 0.5, y: 0.95 }] },
    { type: 'line', points: [{ x: 0.5, y: 0.3 }, { x: 0.95, y: 0.3 }] },
    { type: 'line', points: [{ x: 0.5, y: 0.7 }, { x: 0.95, y: 0.7 }] },
  ],
  ㅓ: [
    { type: 'line', points: [{ x: 0.05, y: 0.5 }, { x: 0.5, y: 0.5 }] },
    { type: 'line', points: [{ x: 0.5, y: 0.05 }, { x: 0.5, y: 0.95 }] },
  ],
  ㅕ: [
    { type: 'line', points: [{ x: 0.05, y: 0.3 }, { x: 0.5, y: 0.3 }] },
    { type: 'line', points: [{ x: 0.05, y: 0.7 }, { x: 0.5, y: 0.7 }] },
    { type: 'line', points: [{ x: 0.5, y: 0.05 }, { x: 0.5, y: 0.95 }] },
  ],
  ㅗ: [
    { type: 'line', points: [{ x: 0.5, y: 0.1 }, { x: 0.5, y: 0.5 }] },
    { type: 'line', points: [{ x: 0.05, y: 0.5 }, { x: 0.95, y: 0.5 }] },
  ],
  ㅛ: [
    { type: 'line', points: [{ x: 0.3, y: 0.1 }, { x: 0.3, y: 0.5 }] },
    { type: 'line', points: [{ x: 0.7, y: 0.1 }, { x: 0.7, y: 0.5 }] },
    { type: 'line', points: [{ x: 0.05, y: 0.5 }, { x: 0.95, y: 0.5 }] },
  ],
  ㅜ: [
    { type: 'line', points: [{ x: 0.05, y: 0.5 }, { x: 0.95, y: 0.5 }] },
    { type: 'line', points: [{ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.9 }] },
  ],
  ㅠ: [
    { type: 'line', points: [{ x: 0.05, y: 0.5 }, { x: 0.95, y: 0.5 }] },
    { type: 'line', points: [{ x: 0.3, y: 0.5 }, { x: 0.3, y: 0.9 }] },
    { type: 'line', points: [{ x: 0.7, y: 0.5 }, { x: 0.7, y: 0.9 }] },
  ],
  ㅡ: [{ type: 'line', points: [{ x: 0.05, y: 0.5 }, { x: 0.95, y: 0.5 }] }],
  ㅣ: [{ type: 'line', points: [{ x: 0.5, y: 0.05 }, { x: 0.5, y: 0.95 }] }],
};

// ─── 복모음 11 ──────────────────────────────────
const COMPOUND_VOWELS = {
  ㅐ: [
    { type: 'line', points: [{ x: 0.35, y: 0.05 }, { x: 0.35, y: 0.95 }] },
    { type: 'line', points: [{ x: 0.35, y: 0.5 }, { x: 0.7, y: 0.5 }] },
    { type: 'line', points: [{ x: 0.8, y: 0.05 }, { x: 0.8, y: 0.95 }] },
  ],
  ㅒ: [
    { type: 'line', points: [{ x: 0.3, y: 0.05 }, { x: 0.3, y: 0.95 }] },
    { type: 'line', points: [{ x: 0.3, y: 0.3 }, { x: 0.65, y: 0.3 }] },
    { type: 'line', points: [{ x: 0.3, y: 0.7 }, { x: 0.65, y: 0.7 }] },
    { type: 'line', points: [{ x: 0.8, y: 0.05 }, { x: 0.8, y: 0.95 }] },
  ],
  ㅔ: [
    { type: 'line', points: [{ x: 0.05, y: 0.5 }, { x: 0.35, y: 0.5 }] },
    { type: 'line', points: [{ x: 0.35, y: 0.05 }, { x: 0.35, y: 0.95 }] },
    { type: 'line', points: [{ x: 0.8, y: 0.05 }, { x: 0.8, y: 0.95 }] },
  ],
  ㅖ: [
    { type: 'line', points: [{ x: 0.05, y: 0.3 }, { x: 0.3, y: 0.3 }] },
    { type: 'line', points: [{ x: 0.05, y: 0.7 }, { x: 0.3, y: 0.7 }] },
    { type: 'line', points: [{ x: 0.3, y: 0.05 }, { x: 0.3, y: 0.95 }] },
    { type: 'line', points: [{ x: 0.8, y: 0.05 }, { x: 0.8, y: 0.95 }] },
  ],
  // 복합 (vertical + horizontal) — 자모 box 0~1 안에 ㅗ/ㅜ + ㅏ/ㅓ/ㅣ 결합 배치
  ㅘ: [
    // ㅗ part (좌하)
    { type: 'line', points: [{ x: 0.2, y: 0.3 }, { x: 0.2, y: 0.65 }] },
    { type: 'line', points: [{ x: 0.05, y: 0.65 }, { x: 0.55, y: 0.65 }] },
    // ㅏ part (우)
    { type: 'line', points: [{ x: 0.7, y: 0.05 }, { x: 0.7, y: 0.95 }] },
    { type: 'line', points: [{ x: 0.7, y: 0.5 }, { x: 0.95, y: 0.5 }] },
  ],
  ㅙ: [
    { type: 'line', points: [{ x: 0.15, y: 0.3 }, { x: 0.15, y: 0.65 }] },
    { type: 'line', points: [{ x: 0.0, y: 0.65 }, { x: 0.4, y: 0.65 }] },
    { type: 'line', points: [{ x: 0.55, y: 0.05 }, { x: 0.55, y: 0.95 }] },
    { type: 'line', points: [{ x: 0.55, y: 0.5 }, { x: 0.85, y: 0.5 }] },
    { type: 'line', points: [{ x: 0.95, y: 0.05 }, { x: 0.95, y: 0.95 }] },
  ],
  ㅚ: [
    { type: 'line', points: [{ x: 0.3, y: 0.3 }, { x: 0.3, y: 0.65 }] },
    { type: 'line', points: [{ x: 0.05, y: 0.65 }, { x: 0.65, y: 0.65 }] },
    { type: 'line', points: [{ x: 0.85, y: 0.05 }, { x: 0.85, y: 0.95 }] },
  ],
  ㅝ: [
    // ㅜ part (좌상)
    { type: 'line', points: [{ x: 0.05, y: 0.35 }, { x: 0.55, y: 0.35 }] },
    { type: 'line', points: [{ x: 0.3, y: 0.35 }, { x: 0.3, y: 0.7 }] },
    // ㅓ part (우)
    { type: 'line', points: [{ x: 0.6, y: 0.5 }, { x: 0.7, y: 0.5 }] },
    { type: 'line', points: [{ x: 0.7, y: 0.05 }, { x: 0.7, y: 0.95 }] },
  ],
  ㅞ: [
    { type: 'line', points: [{ x: 0.0, y: 0.35 }, { x: 0.4, y: 0.35 }] },
    { type: 'line', points: [{ x: 0.2, y: 0.35 }, { x: 0.2, y: 0.7 }] },
    { type: 'line', points: [{ x: 0.5, y: 0.5 }, { x: 0.6, y: 0.5 }] },
    { type: 'line', points: [{ x: 0.6, y: 0.05 }, { x: 0.6, y: 0.95 }] },
    { type: 'line', points: [{ x: 0.9, y: 0.05 }, { x: 0.9, y: 0.95 }] },
  ],
  ㅟ: [
    { type: 'line', points: [{ x: 0.05, y: 0.35 }, { x: 0.6, y: 0.35 }] },
    { type: 'line', points: [{ x: 0.3, y: 0.35 }, { x: 0.3, y: 0.7 }] },
    { type: 'line', points: [{ x: 0.8, y: 0.05 }, { x: 0.8, y: 0.95 }] },
  ],
  ㅢ: [
    { type: 'line', points: [{ x: 0.05, y: 0.5 }, { x: 0.65, y: 0.5 }] },
    { type: 'line', points: [{ x: 0.85, y: 0.05 }, { x: 0.85, y: 0.95 }] },
  ],
};

// ─── library 빌드 (variant 시스템) ──────────────────────────────────
// 자음: cho 4 variant + jong / 모음: vowel 2 variant / 겹받침: jong only
// 단일 base 를 모든 variant 에 동일 복사 — 사용자가 편집기에서 variant 별 fine-tune.
const jamo = {};
const VARIANTS_CONSONANT = [
  'cho-horiz-noJong',
  'cho-horiz-hasJong',
  'cho-vert-noJong',
  'cho-vert-hasJong',
  'jong',
];
const VARIANTS_VOWEL = ['vowel-noJong', 'vowel-hasJong'];
const VARIANTS_FINAL_ONLY = ['jong'];

const merge = (group, variantKeys) => {
  for (const [k, strokes] of Object.entries(group)) {
    const data = { strokes, enforceOrder: true };
    const variants = {};
    for (const v of variantKeys) {
      variants[v] = data;
    }
    jamo[k] = { variants };
  }
};
merge(SINGLE_CONSONANTS, VARIANTS_CONSONANT);
merge(DOUBLE_CONSONANTS, VARIANTS_CONSONANT);
merge(COMPOUND_FINALS, VARIANTS_FINAL_ONLY);
merge(BASIC_VOWELS, VARIANTS_VOWEL);
merge(COMPOUND_VOWELS, VARIANTS_VOWEL);

const library = {
  version: 1,
  updatedAt: new Date().toISOString(),
  jamo,
};

const totalKeys = Object.keys(jamo).length;
const totalVariants = Object.values(jamo).reduce(
  (sum, entry) => sum + Object.keys(entry.variants).length,
  0
);
console.log(`Jamo defined: ${totalKeys}`);
console.log(`Total variants: ${totalVariants}`);

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

const key = '_index/korean-jamo-stroke-library.json';
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
