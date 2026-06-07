#!/usr/bin/env node
// 읽기 전용: R2 storybook JSON 전수 → 베트남어(vi) 포함 책 카운트 + 전체/언어 분포.
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8');
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const bucket = process.env.R2_BUCKET_NAME;

// storybook-*.json 키 수집 (top-level)
const keys = [];
let token;
do {
  const out = await s3.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: 'storybook-', ContinuationToken: token })
  );
  for (const o of out.Contents ?? []) if (o.Key.endsWith('.json')) keys.push(o.Key);
  token = out.IsTruncated ? out.NextContinuationToken : undefined;
} while (token);

console.log(`storybook JSON ${keys.length}개 로드 중...\n`);

const books = [];
let i = 0;
async function loader() {
  while (i < keys.length) {
    const k = keys[i++];
    try {
      const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: k }));
      books.push(JSON.parse(await out.Body.transformToString('utf-8')));
    } catch {}
  }
}
await Promise.all(Array.from({ length: 16 }, loader));

const hasViLang = (b) => Array.isArray(b.languages) && b.languages.includes('vi');
const hasViPage = (b) =>
  (b.pages ?? []).some((p) => p?.translations?.vi) ||
  Object.values(b.styleAssets ?? {}).some((sa) =>
    (sa?.pages ?? []).some((p) => p?.translations?.vi)
  );

const storybooks = books.filter((b) => !b.type || b.type === 'storybook');
const phonics = books.filter((b) => b.type === 'phonics');

const viLang = books.filter(hasViLang);
const viPageOnly = books.filter((b) => !hasViLang(b) && hasViPage(b));

console.log(`전체 ${books.length}권 (동화책 ${storybooks.length} / 파닉스 ${phonics.length})`);
console.log(`\n베트남어(vi) — languages 필드 기준: ${viLang.length}권`);
console.log(`베트남어(vi) — languages엔 없지만 page.translations.vi 존재: ${viPageOnly.length}권 (drift)`);

const viAll = books.filter((b) => hasViLang(b) || hasViPage(b));
const viPublic = viAll.filter((b) => b.isPublic);
console.log(`베트남어(vi) — 합집합: ${viAll.length}권 (공개 ${viPublic.length} / 비공개 ${viAll.length - viPublic.length})\n`);

console.log('── vi 책 목록 ──');
for (const b of viAll.sort((a, b) => (b.isPublic ? 1 : 0) - (a.isPublic ? 1 : 0))) {
  const flags = [
    hasViLang(b) ? 'lang' : '',
    hasViPage(b) ? 'page' : '',
    b.isPublic ? '공개' : '비공개',
  ]
    .filter(Boolean)
    .join('·');
  const pages = (b.pages ?? []).length;
  console.log(`  ${b.isPublic ? '✅' : '⬜'} ${b.title?.padEnd(20) ?? b.id}  [${flags}]  ${pages}p  ${b.category ?? ''}`);
}

// 언어 분포 전체
const langDist = new Map();
for (const b of books) {
  for (const l of b.languages ?? ['(none)']) langDist.set(l, (langDist.get(l) ?? 0) + 1);
}
console.log('\n── languages 필드 분포 ──');
for (const [l, n] of [...langDist.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${l}: ${n}권`);
}
